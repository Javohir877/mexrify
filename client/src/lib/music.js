// Turli manbalardagi treklarni yagona formatga keltirish
import { dz, au, itunesSearch, AUDIUS } from './api.js';
import { COVER } from './util.js';
import { library } from './library.js';

export function fromDz(t, alb) {
  const a = t.album || alb || {};
  return {
    id: 'dz' + t.id, rid: t.id, src: 'dz', full: false,
    title: t.title, artist: t.artist?.name || alb?.artist?.name, artistId: t.artist?.id || alb?.artist?.id,
    album: a.title, albumId: a.id,
    cover: a.cover_medium || t.artist?.picture_medium || COVER, coverXl: a.cover_xl || a.cover_big || a.cover_medium,
    duration: t.duration, preview: t.preview, explicit: !!t.explicit_lyrics,
  };
}
export function fromAu(t) {
  const art = t.artwork || {};
  return {
    id: 'au' + t.id, rid: t.id, src: 'au', full: true,
    title: t.title, artist: t.user?.name, auUser: t.user?.id, album: t.genre || 'Audius',
    cover: art['480x480'] || art['150x150'] || COVER, coverXl: art['1000x1000'] || art['480x480'],
    duration: t.duration, explicit: false,
  };
}
export function fromIt(t) {
  return {
    id: 'it' + t.trackId, rid: t.trackId, src: 'it', full: false,
    title: t.trackName, artist: t.artistName, album: t.collectionName,
    cover: (t.artworkUrl100 || '').replace('100x100', '300x300') || COVER,
    coverXl: (t.artworkUrl100 || '').replace('100x100', '1000x1000'),
    duration: (t.trackTimeMillis || 0) / 1000, preview: t.previewUrl, explicit: t.trackExplicitness === 'explicit',
  };
}

export const dzTracks = d => (d.data || []).filter(t => t.readable !== false).map(t => fromDz(t));
const auPlayable = t => t && !t.is_stream_gated && t.is_streamable !== false && !t.is_delete;
export const auTracks = d => (d || []).filter(auPlayable).map(fromAu);
export const itTracks = async (q, limit) => (await itunesSearch(q, limit)).map(fromIt);

export async function streamUrl(t, refresh) {
  if (t.src === 'au') return `${AUDIUS}/tracks/${t.rid}/stream?app_name=MEXRIFY`;
  if (t.src === 'dz' && (refresh || !t.preview)) {
    const d = await dz('track/' + t.rid);
    t.preview = d.preview;
  }
  return t.preview;
}

export async function getCollection(spec) {
  const [type, id] = spec.split(':');
  switch (type) {
    case 'album': { const a = await dz('album/' + id); return a.tracks.data.filter(t => t.readable !== false).map(t => fromDz(t, a)); }
    case 'playlist': { const p = await dz('playlist/' + id); return dzTracks(p.tracks); }
    case 'artist': return dzTracks(await dz(`artist/${id}/top`, { limit: 50 }));
    case 'genre': return dzTracks(await dz(`chart/${id}/tracks`, { limit: 100 }));
    case 'chart': return dzTracks(await dz('chart/0/tracks', { limit: 100 }));
    case 'auuser': return auTracks(await au(`users/${id}/tracks`, { limit: 50 }));
    case 'phonk': return auTracks(await au('tracks/search', { query: 'phonk', limit: 50 }));
    case 'my': return (library.get().playlists.find(p => p.id === id)?.tracks || []).slice();
    case 'liked': return library.get().liked.slice();
    case 'recent': return library.get().recent.slice();
    default: return [];
  }
}

// Navbat tugaganda o'xshash qo'shiqlar
export async function radioFor(t) {
  if (t.src === 'dz' && t.artistId) return dzTracks(await dz(`artist/${t.artistId}/radio`, { limit: 25 }));
  if (t.src === 'au') return auTracks(await au('tracks/trending', { limit: 25 }));
  return itTracks(t.artist || t.title, 25);
}
