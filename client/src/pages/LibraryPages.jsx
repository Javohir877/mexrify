import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icons.jsx';
import { TrackList } from '../components/Tracks.jsx';
import { PageHead, Actions, Card, Grid, ErrorBox } from '../components/Cards.jsx';
import { useStore } from '../lib/store.js';
import { library, clearRecent, createPlaylist, renamePlaylist, deletePlaylist } from '../lib/library.js';

const BigIcon = ({ name, cls }) => <span className={cls} style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#1a3cff,#22d3ff)' }}><Icon name={name} size={90} /></span>;

export function Liked() {
  const liked = useStore(library, s => s.liked);
  return <>
    <PageHead kind="Pleylist" title="Yoqtirgan qo'shiqlar" icon={<BigIcon name="heart" />} seed="liked" sub={`${liked.length} ta qo'shiq`} />
    {liked.length ? <><Actions spec="liked" /><TrackList tracks={liked} /></>
      : <div className="empty"><h3>Yoqtirgan qo'shiqlaringiz shu yerda chiqadi</h3><p>Qo'shiqlarni ♥ tugmasi orqali saqlang.</p><Link className="btn" to="/search" style={{ marginTop: 20 }}>Qo'shiq topish</Link></div>}
  </>;
}

export function Recent() {
  const recent = useStore(library, s => s.recent);
  return <>
    <PageHead kind="Tarix" title="Yaqinda tinglangan" icon={<BigIcon name="clock" />} seed="recent" sub={`${recent.length} ta qo'shiq`} />
    {recent.length ? <><Actions spec="recent"><button className="icon-btn" onClick={clearRecent} title="Tozalash"><Icon name="trash" /></button></Actions><TrackList tracks={recent} /></>
      : <div className="empty"><h3>Hali hech narsa tinglamadingiz</h3><Link className="btn" to="/" style={{ marginTop: 20 }}>Musiqa tinglash</Link></div>}
  </>;
}

export function MyPlaylist() {
  const { id } = useParams();
  const navigate = useNavigate();
  const p = useStore(library, s => s.playlists.find(x => x.id === id));
  if (!p) return <ErrorBox msg="Pleylist topilmadi" />;
  return <>
    <PageHead kind="Mening pleylistim" title={p.name} img={p.tracks[0]?.coverXl || p.tracks[0]?.cover} seed={p.id} sub={`${p.tracks.length} ta qo'shiq`} />
    <Actions spec={'my:' + id}>
      <button className="icon-btn" title="Nomini o'zgartirish" onClick={() => renamePlaylist(id, prompt('Yangi nom:', p.name))}><Icon name="edit" /></button>
      <button className="icon-btn" title="O'chirish" onClick={() => { if (confirm(`"${p.name}" pleylistini o'chirasizmi?`)) { deletePlaylist(id); navigate('/library'); } }}><Icon name="trash" /></button>
    </Actions>
    {p.tracks.length ? <TrackList tracks={p.tracks} playlistId={id} />
      : <div className="empty"><h3>Pleylist bo'sh</h3><p>Qo'shiq yonidagi ⋯ tugmasi orqali qo'shing.</p><Link className="btn" to="/search" style={{ marginTop: 20 }}>Qo'shiq topish</Link></div>}
  </>;
}

export function Library() {
  const { liked, playlists, saved } = useStore(library);
  const navigate = useNavigate();
  const items = [
    { to: '/liked', title: "Yoqtirgan qo'shiqlar", sub: `${liked.length} ta qo'shiq`, play: 'liked', img: liked[0]?.cover },
    { to: '/recent', title: 'Yaqinda tinglangan', sub: 'Tarix', play: 'recent' },
    ...playlists.map(p => ({ to: `/my/${p.id}`, img: p.tracks[0]?.cover, title: p.name, sub: `${p.tracks.length} ta qo'shiq`, play: `my:${p.id}` })),
    ...saved.map(s => ({ to: `/${s.type}/${s.id}`, img: s.cover, title: s.title, sub: s.sub, round: s.type === 'artist', play: `${s.type}:${s.id}` })),
  ];
  const create = () => {
    const p = createPlaylist(prompt('Pleylist nomi:', `Mening pleylistim #${playlists.length + 1}`));
    if (p) navigate('/my/' + p.id);
  };
  return <>
    <div className="lib-hero"><h1>Kutubxonam</h1><p>Saqlangan pleylistlar, albomlar va artistlar</p></div>
    <button className="btn" onClick={create} style={{ marginBottom: 24 }}>+ Yangi pleylist</button>
    <Grid>{items.map(i => <Card key={i.to} {...i} />)}</Grid>
  </>;
}
