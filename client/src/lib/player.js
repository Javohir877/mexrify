// Pleyer: navbat, aralash/takror, ikki dvigatel — <audio> (preview/Audius) va YouTube IFrame (to'liq)
import { createStore, ls } from './store.js';
import { shuffleArr } from './util.js';
import { streamUrl, getCollection, radioFor } from './music.js';
import { ytFind, ytForget } from './api.js';
import { addRecent } from './library.js';
import { toast } from './ui.js';

export const player = createStore({
  queue: [], qi: -1, current: null,
  playing: false, time: 0, duration: 0,
  shuffle: ls.get('shuffle', false), repeat: ls.get('repeat', 0), // 0 o'chiq, 1 hammasi, 2 bitta
  volume: ls.get('volume', 80), muted: false,
  mode: 'audio', label: '',
});
const S = () => player.get();

const audio = typeof Audio !== 'undefined' ? new Audio() : null;
let original = [], errStreak = 0, ytCands = [], yt = null, ytReady = null;

/* ---------- Dvigatel ---------- */
const eng = {
  get time() { return S().mode === 'yt' ? (yt?.getCurrentTime?.() || 0) : audio.currentTime; },
  get duration() { return S().mode === 'yt' ? (yt?.getDuration?.() || 0) : (audio.duration || 0); },
  get paused() { return S().mode === 'yt' ? ![1, 3].includes(yt?.getPlayerState?.()) : audio.paused; },
  seek(s) { S().mode === 'yt' ? yt?.seekTo?.(s, true) : (audio.currentTime = s); },
  play() { if (S().mode === 'yt') { yt?.playVideo?.(); return Promise.resolve(); } return audio.play(); },
  pause() { S().mode === 'yt' ? yt?.pauseVideo?.() : audio.pause(); },
};

function applyVolume() {
  const { volume, muted } = S();
  const v = muted ? 0 : volume / 100;
  audio.volume = v;
  yt?.setVolume?.(Math.round(v * 100));
}

function loadYt() {
  if (ytReady) return ytReady;
  ytReady = new Promise((resolve, reject) => {
    const timer = setTimeout(() => { ytReady = null; reject(new Error('yt-timeout')); }, 15000);
    const create = () => {
      const host = document.getElementById('ytHost');
      const el = document.createElement('div');
      host.appendChild(el);
      yt = new window.YT.Player(el, {
        width: '100%', height: '100%',
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => { clearTimeout(timer); applyVolume(); resolve(yt); },
          onStateChange: e => {
            if (S().mode !== 'yt') return;
            if (e.data === 1) player.set({ playing: true });
            else if (e.data === 2) player.set({ playing: false });
            else if (e.data === 0) next(true);
          },
          onError: () => {
            if (S().mode !== 'yt') return;
            ytCands.shift();
            if (ytCands.length) return yt.loadVideoById(ytCands[0]);
            const t = S().current;
            if (t) { ytForget(t); playAt(S().qi, false, true); } // YouTube'da yo'q → preview
          },
        },
      });
    };
    if (window.YT?.Player) return create();
    window.onYouTubeIframeAPIReady = create;
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = () => { clearTimeout(timer); ytReady = null; reject(new Error('yt-load')); };
    document.head.appendChild(s);
  });
  return ytReady;
}

/* ---------- Ijro ---------- */
export function playList(tracks, start = 0) {
  if (!tracks.length) return;
  original = tracks.slice();
  const first = original[start];
  const queue = S().shuffle ? [first, ...shuffleArr(original.filter((_, i) => i !== start))] : original.slice();
  player.set({ queue });
  playAt(S().shuffle ? 0 : start);
}

export async function playAt(i, retry, noYt) {
  const { queue } = S();
  if (i < 0 || i >= queue.length) return;
  const t = queue[i];
  player.set({ qi: i, current: t, time: 0, duration: t.duration || 0, label: '' });
  setMediaSession(t);
  const stale = () => S().current !== t;
  try {
    if (!noYt && t.src !== 'au') {
      const ids = await ytFind(t);
      if (stale()) return;
      if (ids.length) {
        const p = await loadYt().catch(() => null);
        if (stale()) return;
        if (p) {
          audio.pause();
          ytCands = ids.slice();
          player.set({ mode: 'yt', label: "TO'LIQ · YouTube" });
          p.loadVideoById(ids[0]);
          errStreak = 0; addRecent(t);
          return;
        }
      }
    }
    if (S().mode === 'yt') yt?.stopVideo?.();
    player.set({ mode: 'audio', label: t.full ? "TO'LIQ" : 'PREVIEW 30s' });
    const url = await streamUrl(t, retry);
    if (stale()) return;
    if (!url) throw new Error('no-url');
    audio.src = url;
    await audio.play();
    errStreak = 0; addRecent(t);
  } catch (e) {
    if (stale() || e.name === 'AbortError') return;
    if (e.name === 'NotAllowedError') return player.set({ playing: false });
    handleError(t);
  }
}

function handleError(t) {
  if (t.src === 'dz' && !t._retried) { t._retried = true; return playAt(S().qi, true, true); }
  if (++errStreak > 4) { errStreak = 0; player.set({ playing: false }); return toast("Treklarni ijro etib bo'lmadi"); }
  toast(`"${t.title}" mavjud emas — keyingisi`);
  next(true);
}

export async function next(auto) {
  const { queue, qi, repeat, current } = S();
  if (!queue.length) return;
  if (auto && repeat === 2) { eng.seek(0); return eng.play(); }
  if (qi < queue.length - 1) return playAt(qi + 1);
  if (repeat === 1) return playAt(0);
  if (auto && current) {
    try {
      const more = (await radioFor(current)).filter(t => !S().queue.some(q => q.id === t.id));
      if (more.length) {
        original.push(...more);
        player.set(s => ({ queue: [...s.queue, ...more] }));
        toast("Avtoijro: o'xshash qo'shiqlar");
        return playAt(qi + 1);
      }
    } catch { /* tarmoq xatosi */ }
  }
  player.set({ playing: false });
}

export function prev() {
  if (eng.time > 3 || S().qi <= 0) return eng.seek(0);
  playAt(S().qi - 1);
}

export function togglePlay() {
  if (!S().current) return playCollection('chart');
  eng.paused ? eng.play().catch(() => { }) : eng.pause();
}

export function seek(sec) { eng.seek(sec); player.set({ time: sec }); }
export function seekBy(d) { const dur = eng.duration; if (dur) seek(Math.min(dur, Math.max(0, eng.time + d))); }

export function toggleShuffle() {
  const shuffle = !S().shuffle;
  ls.set('shuffle', shuffle);
  const { current, queue } = S();
  if (current && queue.length) {
    if (shuffle) player.set({ shuffle, queue: [current, ...shuffleArr(original.filter(t => t !== current))], qi: 0 });
    else { const q = original.slice(); player.set({ shuffle, queue: q, qi: Math.max(0, q.indexOf(current)) }); }
  } else player.set({ shuffle });
}
export function toggleRepeat() { const repeat = (S().repeat + 1) % 3; ls.set('repeat', repeat); player.set({ repeat }); }
export function setVolume(v) { ls.set('volume', v); player.set({ volume: v, muted: false }); applyVolume(); }
export function toggleMute() { player.set(s => ({ muted: !s.muted })); applyVolume(); }

export function playNext(t) {
  if (!S().current) return playList([t]);
  player.set(s => { const q = s.queue.slice(); q.splice(s.qi + 1, 0, t); return { queue: q }; });
  toast("Keyingi bo'lib ijro etiladi");
}
export function enqueue(t) {
  if (!S().current) return playList([t]);
  player.set(s => ({ queue: [...s.queue, t] }));
  toast("Navbatga qo'shildi");
}
export function removeFromQueue(i) {
  player.set(s => {
    if (i === s.qi) return {};
    const q = s.queue.slice(); q.splice(i, 1);
    return { queue: q, qi: i < s.qi ? s.qi - 1 : s.qi };
  });
}

export async function playCollection(spec, shuffleIt) {
  try {
    const tracks = await getCollection(spec);
    if (!tracks.length) return toast("Bu yerda ijro etiladigan trek yo'q");
    if (shuffleIt && !S().shuffle) toggleShuffle();
    playList(tracks, shuffleIt ? Math.floor(Math.random() * tracks.length) : 0);
  } catch { toast("Yuklab bo'lmadi. Internetni tekshiring."); }
}

function setMediaSession(t) {
  document.title = `${t.title} · ${t.artist} — MEXRIFY`;
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: t.title, artist: t.artist, album: t.album || 'MEXRIFY',
      artwork: [{ src: t.coverXl || t.cover, sizes: '500x500' }],
    });
  }
}

/* ---------- Ishga tushirish ---------- */
export function initPlayer() {
  if (!audio) return;
  audio.preload = 'auto';
  applyVolume();
  audio.addEventListener('play', () => S().mode === 'audio' && player.set({ playing: true }));
  audio.addEventListener('pause', () => S().mode === 'audio' && player.set({ playing: false }));
  audio.addEventListener('ended', () => S().mode === 'audio' && next(true));
  audio.addEventListener('error', () => { if (S().mode === 'audio' && S().current && audio.src) handleError(S().current); });
  audio.addEventListener('timeupdate', () => {
    if (S().mode === 'audio') player.set({ time: audio.currentTime, duration: audio.duration || S().duration });
  });
  setInterval(() => {
    if (S().mode === 'yt' && yt?.getCurrentTime) player.set({ time: eng.time, duration: eng.duration || S().duration });
  }, 400);

  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => eng.play());
    navigator.mediaSession.setActionHandler('pause', () => eng.pause());
    navigator.mediaSession.setActionHandler('nexttrack', () => next());
    navigator.mediaSession.setActionHandler('previoustrack', prev);
  }

  document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea')) return;
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    else if (e.code === 'ArrowRight') seekBy(5);
    else if (e.code === 'ArrowLeft') seekBy(-5);
    else if (e.key === 'n' || e.key === 'N') next();
    else if (e.key === 'p' || e.key === 'P') prev();
  });
}
