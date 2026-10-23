import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import Icon from './Icons.jsx';
import { useStore } from '../lib/store.js';
import { player, playList, togglePlay } from '../lib/player.js';
import { library, toggleLike } from '../lib/library.js';
import { apiState } from '../lib/api.js';
import { openMenu } from '../lib/ui.js';
import { fmt, onImgError } from '../lib/util.js';

export function ArtistLink({ t }) {
  if (t.src === 'dz' && t.artistId) return <Link to={`/artist/${t.artistId}`}>{t.artist}</Link>;
  if (t.src === 'au' && t.auUser) return <Link to={`/auuser/${t.auUser}`}>{t.artist}</Link>;
  return <Link to={`/search/${encodeURIComponent(t.artist || '')}`}>{t.artist}</Link>;
}
const AlbumLink = ({ t }) => t.src === 'dz' && t.albumId ? <Link to={`/album/${t.albumId}`}>{t.album}</Link> : <>{t.album}</>;

export function useFull() {
  const youtube = useStore(apiState, s => s.youtube);
  return t => t.full || (youtube && t.src !== 'au');
}
export function Tags({ t }) {
  const isFull = useFull();
  const full = isFull(t);
  return <>{t.explicit && <span className="tag explicit">E</span>}<span className={'tag' + (full ? ' full' : '')}>{full ? 'FULL' : '30s'}</span></>;
}

// Trek bosilganda: o'sha ro'yxatni shu trekdan boshlab ijro etish (yoki pauza)
function useRowClick(tracks) {
  const currentId = useStore(player, s => s.current?.id);
  return [currentId, (e, i) => {
    if (e.target.closest('a, button')) return;
    if (tracks[i].id === currentId) togglePlay(); else playList(tracks, i);
  }];
}
const menuAt = (e, t, extra) => {
  e.preventDefault(); e.stopPropagation();
  const r = e.currentTarget.getBoundingClientRect?.();
  const x = e.type === 'contextmenu' ? e.clientX : r.left - 200;
  const y = e.type === 'contextmenu' ? e.clientY : r.bottom + 4;
  openMenu({ track: t, x, y, ...extra });
};

export function TrackList({ tracks, head = true, album = true, playlistId }) {
  const [currentId, onRow] = useRowClick(tracks);
  const likedArr = useStore(library, s => s.liked);
  const liked = useMemo(() => new Set(likedArr.map(t => t.id)), [likedArr]);
  if (!tracks?.length) return <div className="empty"><p>Treklar topilmadi</p></div>;
  return (
    <div className="tracks">
      {head && <div className="tracks-head"><span style={{ textAlign: 'center' }}>#</span><span>Nomi</span><span>{album ? 'Albom' : ''}</span><span /><span style={{ textAlign: 'right' }}><Icon name="clock" size={16} /></span><span /></div>}
      {tracks.map((t, i) => (
        <div key={t.id + ':' + i} className={'track' + (t.id === currentId ? ' playing' : '')} onClick={e => onRow(e, i)} onContextMenu={e => menuAt(e, t, { playlistId })}>
          <div className="t-num"><span className="n">{i + 1}</span><Icon name="play" /></div>
          <div className="t-main">
            <img loading="lazy" src={t.cover} alt="" onError={onImgError} />
            <div className="t-text">
              <div className="t-title"><span className="ell">{t.title}</span><Tags t={t} /></div>
              <div className="t-artist"><ArtistLink t={t} /></div>
            </div>
          </div>
          <div className="t-album">{album && <AlbumLink t={t} />}</div>
          <button className={'icon-btn t-like' + (liked.has(t.id) ? ' on' : '')} onClick={() => toggleLike(t)} title="Yoqtirish"><Icon name="heart" /></button>
          <div className="t-dur">{fmt(t.duration)}</div>
          <button className="icon-btn t-more" onClick={e => menuAt(e, t, { playlistId })} title="Ko'proq"><Icon name="more" /></button>
        </div>
      ))}
    </div>
  );
}

export function ChartGrid({ tracks, side = false, start = 0 }) {
  const [currentId, onRow] = useRowClick(tracks);
  return (
    <div className={side ? '' : 'chart-grid'}>
      {tracks.map((t, i) => (
        <div key={t.id} className={'crow' + (t.id === currentId ? ' playing' : '')} onClick={e => onRow(e, i)} onContextMenu={e => menuAt(e, t)}>
          <span className="rank">{start + i + 1}</span>
          <img loading="lazy" src={t.cover} alt="" onError={onImgError} />
          <div className="t-text">
            <div className="t-title"><span className="ell">{t.title}</span>{!side && <Tags t={t} />}</div>
            <div className="t-artist"><ArtistLink t={t} /></div>
          </div>
          {!side && <span className="c-dur">{fmt(t.duration)}</span>}
        </div>
      ))}
    </div>
  );
}

export function TrackCards({ tracks }) {
  const [currentId, onRow] = useRowClick(tracks);
  const isFull = useFull();
  return tracks.map((t, i) => (
    <div key={t.id} className={'card' + (t.id === currentId ? ' playing' : '')} onClick={e => onRow(e, i)} onContextMenu={e => menuAt(e, t)}>
      <div className="cover"><img loading="lazy" src={t.cover} alt="" onError={onImgError} /></div>
      <span className="fab"><Icon name={t.id === currentId ? 'pause' : 'play'} /></span>
      <h4>{t.title}</h4><p>{t.artist}{isFull(t) ? ' · FULL' : ''}</p>
    </div>
  ));
}
