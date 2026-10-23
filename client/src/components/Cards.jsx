import { Link } from 'react-router-dom';
import Icon from './Icons.jsx';
import { playCollection } from '../lib/player.js';
import { num, onImgError, COVER, heroColor } from '../lib/util.js';
import { useAsync } from '../hooks.js';
import { useStore } from '../lib/store.js';
import { library, isSaved, toggleSave } from '../lib/library.js';

export function Card({ to, img, title, sub, round, play }) {
  return (
    <Link className={'card' + (round ? ' round' : '')} to={to}>
      <div className="cover"><img loading="lazy" src={img || COVER} alt="" onError={onImgError} /></div>
      {play && <button className="fab" title="Ijro" onClick={e => { e.preventDefault(); e.stopPropagation(); playCollection(play); }}><Icon name="play" /></button>}
      <h4>{title}</h4><p>{sub}</p>
    </Link>
  );
}

export const AlbumCard = ({ a, artist }) => (
  <Card to={`/album/${a.id}`} img={a.cover_medium} title={a.title}
    sub={`${a.release_date ? a.release_date.slice(0, 4) + ' · ' : ''}${(a.artist || artist)?.name || 'Albom'}`} play={`album:${a.id}`} />
);
export const ArtistCard = ({ a }) => (
  <Card to={`/artist/${a.id}`} img={a.picture_medium} title={a.name} sub={a.nb_fan ? `${num(a.nb_fan)} muxlis` : 'Artist'} round play={`artist:${a.id}`} />
);
export const PlaylistCard = ({ p }) => (
  <Card to={`/playlist/${p.id}`} img={p.picture_medium} title={p.title}
    sub={`${p.nb_tracks ? p.nb_tracks + ' trek · ' : ''}${p.user?.name || p.creator?.name || 'Pleylist'}`} play={`playlist:${p.id}`} />
);

export const Grid = ({ row, children }) => <div className={'grid' + (row ? ' row' : '')}>{children}</div>;
export const Loader = () => <div className="loader"><i /><i /><i /></div>;
const Skeleton = () => <Grid row>{Array.from({ length: 6 }, (_, i) => <div key={i} className="skel" />)}</Grid>;

// Asinxron yuklanadigan bo'lim: xato yoki bo'sh bo'lsa umuman ko'rinmaydi
export function Shelf({ title, link, load, render, deps = [] }) {
  const { data, error, loading } = useAsync(load, deps);
  if (error || (!loading && (!data || (Array.isArray(data) && !data.length)))) return null;
  return (
    <section className="section">
      <div className="section-head"><h2>{title}</h2>{link && <Link to={link}>Hammasini ko'rish</Link>}</div>
      {loading ? <Skeleton /> : render(data)}
    </section>
  );
}

export function PageHead({ kind, title, sub, img, icon, seed, round }) {
  const style = { '--hero': heroColor(seed || title) };
  if (img) style['--bgimg'] = `url("${img}")`;
  return (
    <div className={'page-head' + (round ? ' artist' : '')} style={style}>
      {icon ? <div className="big-cover">{icon}</div> : <img className="big-cover" src={img || COVER} alt="" onError={onImgError} />}
      <div><div className="kind">{kind}</div><h1>{title}</h1><div className="sub">{sub}</div></div>
    </div>
  );
}

export function Actions({ spec, children }) {
  return (
    <div className="actions">
      <button className="big-play" onClick={() => playCollection(spec)} title="Ijro"><Icon name="play" /></button>
      <button className="icon-btn" onClick={() => playCollection(spec, true)} title="Aralash ijro"><Icon name="shuffle" /></button>
      {children}
    </div>
  );
}

export function SaveButton({ item }) {
  const on = useStore(library, () => isSaved(item.type, item.id));
  return (
    <button className={'icon-btn like-btn' + (on ? ' on' : '')} onClick={() => toggleSave(item)} title={on ? 'Kutubxonadan olib tashlash' : 'Kutubxonaga saqlash'}>
      <Icon name="heart" />
    </button>
  );
}

export function ErrorBox({ onRetry, msg = "Ma'lumotni yuklab bo'lmadi. Internet aloqasini tekshirib, qayta urinib ko'ring." }) {
  return <div className="empty"><h3>Xatolik yuz berdi</h3><p>{msg}</p>{onRetry && <button className="btn" onClick={onRetry} style={{ marginTop: 20 }}>Qayta urinish</button>}</div>;
}

export function GenreGrid({ genres }) {
  return (
    <div className="genres">
      <Link className="genre" to="/phonk" style={{ background: 'linear-gradient(135deg,#001a66,#00c2ff)' }}>Phonk ⚡</Link>
      {genres.filter(g => g.id !== 0).map(g => (
        <Link key={g.id} className="genre" to={`/genre/${g.id}`} style={{ background: heroColor(g.name) }}>
          {g.name}<img loading="lazy" src={g.picture_medium} alt="" />
        </Link>
      ))}
    </div>
  );
}
