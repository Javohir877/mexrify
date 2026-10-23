import { Link, useParams } from 'react-router-dom';
import { TrackList } from '../components/Tracks.jsx';
import { PageHead, Actions, SaveButton, Loader, ErrorBox, Grid, Shelf, AlbumCard, ArtistCard } from '../components/Cards.jsx';
import { useAsync } from '../hooks.js';
import { dz, au } from '../lib/api.js';
import { dzTracks, auTracks, getCollection } from '../lib/music.js';
import { num } from '../lib/util.js';

export function Artist() {
  const { id } = useParams();
  const { data: a, error, loading } = useAsync(() => dz('artist/' + id), [id]);
  if (loading) return <Loader />;
  if (error) return <ErrorBox />;
  return <>
    <PageHead kind="Artist" title={a.name} img={a.picture_xl} round seed={a.name} sub={<><b>{num(a.nb_fan)}</b> muxlis · {num(a.nb_album)} albom</>} />
    <Actions spec={'artist:' + id}><SaveButton item={{ type: 'artist', id: a.id, title: a.name, sub: 'Artist', cover: a.picture_medium }} /></Actions>
    <Shelf title="Mashhur treklar" deps={[id]} load={async () => (await getCollection('artist:' + id)).slice(0, 20)} render={d => <TrackList tracks={d} />} />
    <Shelf title="Diskografiya" deps={[id]} load={async () => (await dz(`artist/${id}/albums`, { limit: 50 })).data} render={d => <Grid row>{d.map(x => <AlbumCard key={x.id} a={x} artist={a} />)}</Grid>} />
    <Shelf title="O'xshash artistlar" deps={[id]} load={async () => (await dz(`artist/${id}/related`, { limit: 20 })).data} render={d => <Grid row>{d.map(x => <ArtistCard key={x.id} a={x} />)}</Grid>} />
    <Shelf title={`${a.name} — to'liq treklar (Audius)`} deps={[id]}
      load={async () => auTracks(await au('tracks/search', { query: a.name, limit: 20 })).filter(x => `${x.artist} ${x.title}`.toLowerCase().includes(a.name.toLowerCase()))}
      render={d => <TrackList tracks={d} album={false} />} />
  </>;
}

export function Album() {
  const { id } = useParams();
  const { data, error, loading } = useAsync(async () => {
    const [a, tracks] = await Promise.all([dz('album/' + id), getCollection('album:' + id)]);
    return { a, tracks };
  }, [id]);
  if (loading) return <Loader />;
  if (error) return <ErrorBox />;
  const { a, tracks } = data;
  const total = tracks.reduce((s, t) => s + (t.duration || 0), 0);
  return <>
    <PageHead kind={a.record_type === 'single' ? 'Singl' : 'Albom'} title={a.title} img={a.cover_xl} seed={a.title}
      sub={<><Link to={`/artist/${a.artist?.id}`}><b>{a.artist?.name}</b></Link> · {(a.release_date || '').slice(0, 4)} · {a.nb_tracks} ta qo'shiq, {Math.round(total / 60)} daq</>} />
    <Actions spec={'album:' + id}><SaveButton item={{ type: 'album', id: a.id, title: a.title, sub: a.artist?.name, cover: a.cover_medium }} /></Actions>
    <TrackList tracks={tracks} album={false} />
    <p className="note" style={{ marginTop: 20 }}>{a.release_date}<br />© {a.label}</p>
    <br />
    <Shelf title={`${a.artist?.name} — boshqa albomlar`} deps={[id]}
      load={async () => (await dz(`artist/${a.artist.id}/albums`, { limit: 20 })).data.filter(x => x.id !== a.id)}
      render={d => <Grid row>{d.map(x => <AlbumCard key={x.id} a={x} artist={a.artist} />)}</Grid>} />
  </>;
}

export function Playlist() {
  const { id } = useParams();
  const { data: p, error, loading } = useAsync(() => dz('playlist/' + id), [id]);
  if (loading) return <Loader />;
  if (error) return <ErrorBox />;
  return <>
    <PageHead kind="Pleylist" title={p.title} img={p.picture_xl} seed={p.title}
      sub={<>{p.description && <>{p.description}<br /></>}<b>{p.creator?.name || 'Deezer'}</b> · {num(p.fans)} saqlagan · {p.nb_tracks} ta qo'shiq</>} />
    <Actions spec={'playlist:' + id}><SaveButton item={{ type: 'playlist', id: p.id, title: p.title, sub: p.creator?.name, cover: p.picture_medium }} /></Actions>
    <TrackList tracks={dzTracks(p.tracks)} />
  </>;
}

export function AudiusUser() {
  const { id } = useParams();
  const { data, error, loading } = useAsync(async () => {
    const [u, tracks] = await Promise.all([au('users/' + id), getCollection('auuser:' + id)]);
    return { u, tracks };
  }, [id]);
  if (loading) return <Loader />;
  if (error) return <ErrorBox />;
  const { u, tracks } = data;
  return <>
    <PageHead kind="Mustaqil artist · Audius" title={u.name} round seed={u.handle} img={u.profile_picture?.['1000x1000'] || u.profile_picture?.['480x480']}
      sub={<><b>{num(u.follower_count)}</b> obunachi · {u.track_count} trek</>} />
    <Actions spec={'auuser:' + id} />
    {u.bio && <><p className="artist-bio">{u.bio}</p><br /></>}
    <TrackList tracks={tracks} album={false} />
  </>;
}
