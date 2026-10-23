import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icons.jsx';
import { ChartGrid, TrackCards } from '../components/Tracks.jsx';
import { Grid, Shelf, Loader, ArtistCard, AlbumCard, PlaylistCard } from '../components/Cards.jsx';
import { useAsync } from '../hooks.js';
import { useStore } from '../lib/store.js';
import { dz, au } from '../lib/api.js';
import { dzTracks, auTracks } from '../lib/music.js';
import { library, isLiked, toggleLike } from '../lib/library.js';
import { playList } from '../lib/player.js';
import { greeting } from '../lib/util.js';

const MOODS = [
  ['⚡', 'Phonk', '/phonk', '#00c2ff,#001a66'], ['🌙', 'Chill', '/search/chill lofi', '#3b82f6,#1e1b4b'],
  ['🏋️', 'Sport', '/search/workout', '#06b6d4,#0c4a6e'], ['💙', 'Romantik', '/search/love songs', '#6366f1,#1e3a8a'],
  ['🎉', 'Party', '/search/party hits', '#0ea5e9,#312e81'], ['🎧', 'Fokus', '/search/lofi study', '#38bdf8,#172554'],
  ['🚗', 'Avto', '/search/car music bass', '#2563eb,#020617'], ['🎤', 'Rap', '/search/rap', '#60a5fa,#1e293b'],
  ['🇺🇿', "O'zbekcha", '/search/uzbek', '#22d3ee,#1d4ed8'], ['🎻', 'Klassika', '/search/classical', '#93c5fd,#1e3a8a'],
];

// Bosh sahifadagi aylanuvchi banner (TOP-5)
function Stage({ list }) {
  const [k, setK] = useState(0);
  useStore(library, s => s.liked); // "Saqlash" holati yangilanishi uchun
  useEffect(() => {
    const id = setInterval(() => setK(x => (x + 1) % list.length), 7000);
    return () => clearInterval(id);
  }, [list.length, k]);
  const t = list[k];
  const art = t.coverXl || t.cover;
  return (
    <div className="stage">
      <div className="stage-bg" style={{ backgroundImage: `url("${art}")` }} />
      <img className="stage-art" src={art} alt="" />
      <div className="dots">{list.map((_, j) => <button key={j} className={j === k ? 'on' : ''} onClick={() => setK(j)} />)}</div>
      <div className="stage-info" key={t.id}>
        <span className="eyebrow">#{k + 1} dunyo chartida</span>
        <h1>{t.title}</h1>
        <p>{t.artist} · {t.album}</p>
        <div className="stage-btns">
          <button className="pill-btn" onClick={() => playList(list, k)}><Icon name="play" /> Tinglash</button>
          <button className={'pill-btn ghost' + (isLiked(t.id) ? ' on' : '')} onClick={() => toggleLike(t)}><Icon name="heart" /> Saqlash</button>
          {t.artistId && <Link className="pill-btn ghost" to={`/artist/${t.artistId}`}><Icon name="user" /> Artist</Link>}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const chart = useAsync(() => dz('chart/0/tracks', { limit: 20 }).then(dzTracks), []);
  const recent = useStore(library, s => s.recent);

  return <>
    <div className="feature">
      {chart.data?.length ? <Stage list={chart.data.slice(0, 5)} /> : <div className="stage">{chart.loading && <div className="skel" style={{ position: 'absolute', inset: 0, height: 'auto', borderRadius: 0 }} />}</div>}
      <div className="side-list">
        <h3>{greeting()} 👋 · Hozir trendda</h3>
        {chart.data ? <ChartGrid tracks={chart.data.slice(5, 11)} side start={5} /> : <Loader />}
      </div>
    </div>

    <div className="moods">
      {MOODS.map(([e, l, to, g]) => <Link key={l} className="mood" to={to}><span style={{ background: `linear-gradient(135deg,${g})` }}>{e}</span>{l}</Link>)}
    </div>

    {recent.length > 0 && (
      <section className="section">
        <div className="section-head"><h2>Davom ettiring</h2><Link to="/recent">Tarix</Link></div>
        <Grid row><TrackCards tracks={recent.slice(0, 12)} /></Grid>
      </section>
    )}

    {chart.data?.length > 0 && (
      <section className="section">
        <div className="section-head"><h2>🌍 Dunyo TOP 20</h2><Link to="/chart">Hammasini ko'rish</Link></div>
        <ChartGrid tracks={chart.data} />
      </section>
    )}

    <Shelf title="⚡ Phonk — to'liq treklar" link="/phonk" load={async () => auTracks(await au('tracks/search', { query: 'phonk', limit: 20 }))} render={d => <Grid row><TrackCards tracks={d} /></Grid>} />
    <Shelf title="Mashhur pleylistlar" load={async () => (await dz('chart/0/playlists', { limit: 20 })).data} render={d => <Grid row>{d.map(p => <PlaylistCard key={p.id} p={p} />)}</Grid>} />
    <Shelf title="Top albomlar" load={async () => (await dz('chart/0/albums', { limit: 20 })).data} render={d => <Grid row>{d.map(a => <AlbumCard key={a.id} a={a} />)}</Grid>} />
    <Shelf title="Top artistlar" load={async () => (await dz('chart/0/artists', { limit: 20 })).data} render={d => <Grid row>{d.map(a => <ArtistCard key={a.id} a={a} />)}</Grid>} />
    <Shelf title="🇺🇿 O'zbek musiqasi" link="/search/uzbek" load={async () => (await dz('search/playlist', { q: 'uzbek', limit: 20 })).data} render={d => <Grid row>{d.map(p => <PlaylistCard key={p.id} p={p} />)}</Grid>} />
    <Shelf title="🎧 Trenddagi mustaqil artistlar (to'liq)" load={async () => auTracks(await au('tracks/trending', { limit: 20 }))} render={d => <Grid row><TrackCards tracks={d} /></Grid>} />
  </>;
}
