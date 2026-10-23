// Foydalanuvchi kutubxonasi: yoqtirganlar, tarix, pleylistlar, saqlanganlar (brauzerda saqlanadi)
import { createStore, ls } from './store.js';
import { toast } from './ui.js';

export const library = createStore({
  liked: ls.get('liked', []),
  recent: ls.get('recent', []),
  playlists: ls.get('playlists', []),
  saved: ls.get('saved', []),
});
library.subscribe(() => {
  const s = library.get();
  ls.set('liked', s.liked); ls.set('recent', s.recent); ls.set('playlists', s.playlists); ls.set('saved', s.saved);
});

const strip = t => { const { _retried, ...c } = t; return c; };

export const isLiked = id => library.get().liked.some(t => t.id === id);

export function toggleLike(t) {
  const on = isLiked(t.id);
  library.set(s => ({ liked: on ? s.liked.filter(x => x.id !== t.id) : [strip(t), ...s.liked] }));
  toast(on ? 'Yoqtirganlardan olib tashlandi' : "Yoqtirgan qo'shiqlarga qo'shildi 💙");
}

export function addRecent(t) {
  library.set(s => ({ recent: [strip(t), ...s.recent.filter(x => x.id !== t.id)].slice(0, 60) }));
}
export const clearRecent = () => library.set({ recent: [] });

export function createPlaylist(name, track) {
  if (!name?.trim()) return null;
  const p = { id: Date.now().toString(36), name: name.trim(), tracks: track ? [strip(track)] : [] };
  library.set(s => ({ playlists: [...s.playlists, p] }));
  toast(track ? `"${p.name}" yaratildi va qo'shiq qo'shildi` : `"${p.name}" yaratildi`);
  return p;
}
export function addToPlaylist(pid, t) {
  const p = library.get().playlists.find(x => x.id === pid);
  if (!p) return;
  if (p.tracks.some(x => x.id === t.id)) return toast("Bu qo'shiq pleylistda allaqachon bor");
  library.set(s => ({ playlists: s.playlists.map(x => x.id === pid ? { ...x, tracks: [...x.tracks, strip(t)] } : x) }));
  toast(`"${p.name}" pleylistiga qo'shildi`);
}
export function removeFromPlaylist(pid, tid) {
  library.set(s => ({ playlists: s.playlists.map(x => x.id === pid ? { ...x, tracks: x.tracks.filter(t => t.id !== tid) } : x) }));
}
export function renamePlaylist(pid, name) {
  if (!name?.trim()) return;
  library.set(s => ({ playlists: s.playlists.map(x => x.id === pid ? { ...x, name: name.trim() } : x) }));
}
export function deletePlaylist(pid) {
  library.set(s => ({ playlists: s.playlists.filter(x => x.id !== pid) }));
}

export const isSaved = (type, id) => library.get().saved.some(s => s.type === type && String(s.id) === String(id));
export function toggleSave(item) {
  const on = isSaved(item.type, item.id);
  library.set(s => ({ saved: on ? s.saved.filter(x => !(x.type === item.type && String(x.id) === String(item.id))) : [item, ...s.saved] }));
  toast(on ? 'Kutubxonadan olib tashlandi' : 'Kutubxonaga saqlandi 💙');
}
