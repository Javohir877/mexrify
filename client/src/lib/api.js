// API qatlami. Backend ishlayotgan bo'lsa — hammasi u orqali (kesh, YouTube to'liq ijro).
// Backend topilmasa (masalan, faqat GitHub Pages) — to'g'ridan-to'g'ri Deezer/Audius'ga ulanadi.
import { createStore } from './store.js';

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const apiState = createStore({ ready: false, backend: false, youtube: false });
let readyPromise;

export function initApi() {
  readyPromise ??= (async () => {
    try {
      const r = await fetch(`${API}/api/config`, { headers: { Accept: 'application/json' } });
      if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) throw new Error('no backend');
      const cfg = await r.json();
      apiState.set({ ready: true, backend: true, youtube: !!cfg.youtube });
    } catch {
      apiState.set({ ready: true, backend: false, youtube: false });
    }
  })();
  return readyPromise;
}

/* ---- yordamchilar ---- */
const cache = new Map();
function cached(key, fn, ttl = 5 * 60e3) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < ttl) return hit.p;
  const p = fn().catch(e => { cache.delete(key); throw e; });
  cache.set(key, { t: Date.now(), p });
  return p;
}

async function getJson(url) {
  const r = await fetch(url);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.error || `HTTP ${r.status}`), { status: r.status });
  return d;
}

let jsonpN = 0;
function jsonp(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const cb = `__mx${++jsonpN}_${Date.now()}`;
    const s = document.createElement('script');
    const timer = setTimeout(() => { done(); reject(new Error('timeout')); }, timeout);
    function done() { clearTimeout(timer); window[cb] = () => { }; s.remove(); }
    window[cb] = d => { done(); resolve(d); };
    s.onerror = () => { done(); reject(new Error('network')); };
    s.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + cb;
    document.head.appendChild(s);
  });
}

/* ---- Deezer ---- */
export async function dz(path, params = {}) {
  await initApi();
  const q = new URLSearchParams(params);
  const d = apiState.get().backend
    ? await cached(`b:dz:${path}?${q}`, () => getJson(`${API}/api/deezer/${path}?${q}`))
    : await cached(`d:dz:${path}?${q}`, () => jsonp(`https://api.deezer.com/${path}?${q}&output=jsonp`));
  if (!d || d.error) throw new Error(d?.error?.message || d?.error || 'Deezer xatosi');
  return d;
}

/* ---- Audius ---- */
export const AUDIUS = 'https://api.audius.co/v1';
export async function au(path, params = {}) {
  await initApi();
  const q = new URLSearchParams(params);
  const url = apiState.get().backend ? `${API}/api/audius/${path}?${q}` : `${AUDIUS}/${path}?${q}&app_name=MEXRIFY`;
  const r = await cached(url, () => getJson(url));
  return r.data;
}

/* ---- iTunes (zaxira qidiruv) ---- */
export function itunesSearch(term, limit = 50) {
  const q = new URLSearchParams({ term, media: 'music', entity: 'song', limit });
  return cached('it:' + q, () => jsonp('https://itunes.apple.com/search?' + q)).then(d => d.results || []);
}

/* ---- YouTube (faqat backend orqali; kalit serverda) ---- */
export async function ytFind(track) {
  await initApi();
  const s = apiState.get();
  if (!s.backend || !s.youtube) return [];
  const q = new URLSearchParams({ id: track.id, q: `${track.artist} - ${track.title}` });
  try {
    const d = await cached('yt:' + track.id, () => getJson(`${API}/api/youtube/find?${q}`), 60 * 60e3);
    return d.ids || [];
  } catch (e) {
    if (e.status === 429 || e.status === 503) apiState.set({ youtube: false });
    return [];
  }
}
export function ytForget(track) {
  cache.delete('yt:' + track.id);
  if (apiState.get().backend) fetch(`${API}/api/youtube/find?id=${encodeURIComponent(track.id)}`, { method: 'DELETE' }).catch(() => { });
}
