import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TrackList, TrackCards } from '../components/Tracks.jsx';
import { Grid, Loader, GenreGrid, ArtistCard, AlbumCard, PlaylistCard } from '../components/Cards.jsx';
import { useAsync } from '../hooks.js';
import { dz, au } from '../lib/api.js';
import { dzTracks, auTracks, itTracks } from '../lib/music.js';
import { ls } from '../lib/store.js';

const TABS = [['all', 'Hammasi'], ['tracks', "Qo'shiqlar"], ['artists', 'Artistlar'], ['albums', 'Albomlar'], ['playlists', 'Pleylistlar'], ['full', "To'liq treklar"]];
const settle = p => p.then(v => v, () => []);

async function searchAll(q) {
  const [tr, ar, al, pl, full] = await Promise.all([
    settle(dz('search', { q, limit: 50 }).then(dzTracks).catch(() => itTracks(q, 50))),
    settle(dz('search/artist', { q, limit: 20 }).then(d => d.data)),
    settle(dz('search/album', { q, limit: 20 }).then(d => d.data)),
    settle(dz('search/playlist', { q, limit: 20 }).then(d => d.data)),
    settle(au('tracks/search', { query: q, limit: 30 }).then(auTracks)),
  ]);
  return { tr, ar, al, pl, full };
}

const Sec = ({ title, children }) => <section className="section"><div className="section-head"><h2>{title}</h2></div>{children}</section>;

function Results({ q }) {
  const [tab, setTab] = useState('all');
  const { data: s, loading } = useAsync(() => searchAll(q), [q]);
  useEffect(() => setTab('all'), [q]);
  if (loading) return <Loader />;
  const nothing = !s.tr.length && !s.ar.length && !s.al.length && !s.pl.length && !s.full.length;
  return <>
    <div className="chips">{TABS.map(([k, l]) => <button key={k} className={'chip' + (k === tab ? ' active' : '')} onClick={() => setTab(k)}>{l}</button>)}</div>
    {nothing ? <div className="empty"><h3>"{q}" bo'yicha hech narsa topilmadi</h3><p>Imloni tekshiring yoki boshqa so'z bilan qidiring.</p></div>
      : tab === 'all' ? <>
        <div className="top-wrap">
          {s.ar[0] && <Sec title="Eng yaxshi natija"><ArtistCard a={s.ar[0]} /></Sec>}
          {s.tr.length > 0 && <Sec title="Qo'shiqlar"><TrackList tracks={s.tr.slice(0, 5)} head={false} album={false} /></Sec>}
        </div>
        {s.ar.length > 0 && <Sec title="Artistlar"><Grid row>{s.ar.map(a => <ArtistCard key={a.id} a={a} />)}</Grid></Sec>}
        {s.full.length > 0 && <Sec title="⚡ To'liq treklar (Audius)"><Grid row><TrackCards tracks={s.full} /></Grid></Sec>}
        {s.al.length > 0 && <Sec title="Albomlar"><Grid row>{s.al.map(a => <AlbumCard key={a.id} a={a} />)}</Grid></Sec>}
        {s.pl.length > 0 && <Sec title="Pleylistlar"><Grid row>{s.pl.map(p => <PlaylistCard key={p.id} p={p} />)}</Grid></Sec>}
      </>
        : tab === 'tracks' ? <TrackList tracks={s.tr} />
          : tab === 'artists' ? <Grid>{s.ar.map(a => <ArtistCard key={a.id} a={a} />)}</Grid>
            : tab === 'albums' ? <Grid>{s.al.map(a => <AlbumCard key={a.id} a={a} />)}</Grid>
              : tab === 'playlists' ? <Grid>{s.pl.map(p => <PlaylistCard key={p.id} p={p} />)}</Grid>
                : <><p className="note" style={{ marginBottom: 12 }}>Audius'dagi mustaqil artistlarning treklari — to'liq uzunlikda.</p><TrackList tracks={s.full} album={false} /></>}
  </>;
}

export default function Search() {
  const q = (useParams().q || '').trim();
  const genres = useAsync(() => (q ? Promise.resolve([]) : dz('genre').then(d => d.data)), [q]);
  const [hist, setHist] = useState(() => ls.get('searches', []));

  useEffect(() => {
    if (!q) return;
    const h = [q, ...ls.get('searches', []).filter(x => x.toLowerCase() !== q.toLowerCase())].slice(0, 12);
    ls.set('searches', h); setHist(h);
  }, [q]);

  if (q) return <Results q={q} />;
  return <>
    {hist.length > 0 && <Sec title="So'nggi qidiruvlar"><div className="chips">{hist.map(h => <Link key={h} className="chip" to={`/search/${encodeURIComponent(h)}`}>{h}</Link>)}</div></Sec>}
    <Sec title="Hammasini ko'rib chiqing">{genres.loading ? <Loader /> : <GenreGrid genres={genres.data || []} />}</Sec>
  </>;
}
