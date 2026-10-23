import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TTLCache, cachedFetcher } from './cache.js';
import { createYoutube } from './youtube.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// --port bayrog'i (dev rejimida Vite bilan to'qnashmaslik uchun) > PORT (Render beradi) > 4000
const argPort = process.argv.indexOf('--port');
const PORT = Number(argPort > -1 ? process.argv[argPort + 1] : process.env.PORT) || 4000;
const ORIGINS = process.env.CORS_ORIGINS || '*';
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');

const fetchJson = cachedFetcher(new TTLCache({ ttl: 10 * 60e3, max: 3000 }));
const youtube = createYoutube({
  apiKey: process.env.YOUTUBE_API_KEY || '',
  cacheFile: path.resolve(__dirname, '../data/youtube-cache.json'),
});

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(cors({ origin: ORIGINS === '*' ? true : ORIGINS.split(',').map(s => s.trim()) }));

// Oddiy rate-limit: har bir IP uchun daqiqasiga 240 so'rov
const hits = new Map();
app.use('/api', (req, res, next) => {
  const now = Date.now();
  const h = hits.get(req.ip) || { n: 0, reset: now + 60e3 };
  if (now > h.reset) { h.n = 0; h.reset = now + 60e3; }
  h.n++;
  hits.set(req.ip, h);
  if (h.n > 240) return res.status(429).json({ error: "Juda ko'p so'rov, biroz kuting" });
  next();
});
setInterval(() => { const now = Date.now(); for (const [ip, h] of hits) if (now > h.reset) hits.delete(ip); }, 5 * 60e3).unref();

const pick = (query, keys) => {
  const out = new URLSearchParams();
  for (const k of keys) if (query[k] != null && query[k] !== '') out.set(k, String(query[k]).slice(0, 200));
  return out;
};
const fail = (res, e) => res.status(e.status && e.status < 600 ? e.status : 502).json({ error: e.message || 'Xatolik' });

/* ---------- Holat ---------- */
app.get('/api/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));
app.get('/api/config', (req, res) => res.json({ youtube: youtube.enabled(), cachedSongs: youtube.size() }));

/* ---------- Deezer proksi (katalog, chartlar, 30s preview) ---------- */
const DZ_PATHS = /^(chart\/\d+\/(tracks|albums|artists|playlists)|genre(\/\d+(\/artists)?)?|search(\/(artist|album|playlist|track))?|artist\/\d+(\/(top|albums|related|radio))?|album\/\d+|playlist\/\d+|track\/\d+)$/;
app.get('/api/deezer/*', async (req, res) => {
  const p = req.params[0];
  if (!DZ_PATHS.test(p)) return res.status(404).json({ error: "Noma'lum yo'l" });
  const q = pick(req.query, ['q', 'limit', 'index']);
  // Trek ma'lumoti (preview havolasi) tez eskiradi — qisqa kesh
  const ttl = p.startsWith('track/') ? 2 * 60e3 : p.startsWith('search') ? 30 * 60e3 : 10 * 60e3;
  try {
    const data = await fetchJson(`https://api.deezer.com/${p}?${q}`, ttl);
    if (data.error) return res.status(404).json({ error: data.error.message });
    res.set('Cache-Control', 'public, max-age=120').json(data);
  } catch (e) { fail(res, e); }
});

/* ---------- Audius proksi (to'liq mustaqil treklar, phonk) ---------- */
const AU_PATHS = /^(tracks\/(trending|search)|users\/\w+(\/tracks)?)$/;
app.get('/api/audius/*', async (req, res) => {
  const p = req.params[0];
  if (!AU_PATHS.test(p)) return res.status(404).json({ error: "Noma'lum yo'l" });
  const q = pick(req.query, ['query', 'limit', 'offset', 'genre', 'time']);
  q.set('app_name', 'MEXRIFY');
  try {
    const data = await fetchJson(`https://api.audius.co/v1/${p}?${q}`, 10 * 60e3);
    res.set('Cache-Control', 'public, max-age=120').json(data);
  } catch (e) { fail(res, e); }
});

/* ---------- YouTube: to'liq ijro uchun video topish ---------- */
app.get('/api/youtube/find', async (req, res) => {
  const id = String(req.query.id || '').slice(0, 64);
  const q = String(req.query.q || '').slice(0, 200).trim();
  if (!/^[\w-]+$/.test(id) || !q) return res.status(400).json({ error: 'id va q kerak' });
  try { res.json(await youtube.find(id, q)); } catch (e) { fail(res, e); }
});
app.delete('/api/youtube/find', (req, res) => {
  const id = String(req.query.id || '');
  if (/^[\w-]+$/.test(id)) youtube.forget(id);
  res.json({ ok: true });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Topilmadi' }));

/* ---------- Frontend (client/dist) ---------- */
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST, { maxAge: '1h', index: false }));
  app.get('*', (req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`MEXRIFY server: http://localhost:${PORT}`);
  console.log(`YouTube to'liq rejim: ${youtube.enabled() ? 'YOQILGAN' : "O'CHIQ (server/.env da YOUTUBE_API_KEY yo'q)"}`);
});
