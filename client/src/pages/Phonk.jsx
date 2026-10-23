import { Link, useParams } from 'react-router-dom';
import Icon from '../components/Icons.jsx';
import { TrackList } from '../components/Tracks.jsx';
import { Actions, Grid, Shelf, PlaylistCard, ArtistCard } from '../components/Cards.jsx';
import { dz, au } from '../lib/api.js';
import { dzTracks, auTracks } from '../lib/music.js';

const SUBS = [['phonk', 'Hammasi'], ['drift phonk', 'Drift Phonk'], ['brazilian phonk', 'Brazilian Phonk'], ['memphis phonk', 'Memphis'], ['house phonk', 'House Phonk'], ['phonk remix', 'Remix'], ['aggressive phonk', 'Aggressive']];

export default function Phonk() {
  const { sub } = useParams();
  const q = sub || 'phonk';
  return <>
    <div className="page-head" style={{ '--hero': '#0a2f8f' }}>
      <div className="big-cover" style={{ background: 'linear-gradient(135deg,#001a66,#00c2ff)' }}><Icon name="bolt" size={110} style={{ color: '#fff' }} /></div>
      <div><div className="kind">Janr</div><h1>PHONK</h1><div className="sub">Drift, Brazilian, Memphis — eng kuchli phonk treklar. <b>To'liq</b> tinglash mumkin.</div></div>
    </div>
    <Actions spec="phonk" />
    <div className="chips">{SUBS.map(([v, l]) => <Link key={v} className={'chip' + (v === q ? ' active' : '')} to={v === 'phonk' ? '/phonk' : `/phonk/${encodeURIComponent(v)}`}>{l}</Link>)}</div>
    <Shelf title="⚡ To'liq treklar" deps={[q]} load={async () => auTracks(await au('tracks/search', { query: q, limit: 40 }))} render={d => <TrackList tracks={d} album={false} />} />
    <Shelf title="🔥 Phonk hitlar" deps={[q]} load={async () => dzTracks(await dz('search', { q, limit: 30 }))} render={d => <TrackList tracks={d} />} />
    <Shelf title="Phonk pleylistlar" deps={[q]} load={async () => (await dz('search/playlist', { q, limit: 20 })).data} render={d => <Grid row>{d.map(p => <PlaylistCard key={p.id} p={p} />)}</Grid>} />
    <Shelf title="Phonk artistlar" load={async () => (await dz('search/artist', { q: 'phonk', limit: 20 })).data} render={d => <Grid row>{d.map(a => <ArtistCard key={a.id} a={a} />)}</Grid>} />
  </>;
}
