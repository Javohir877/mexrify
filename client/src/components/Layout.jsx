import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icons.jsx';
import { useStore } from '../lib/store.js';
import { library, isLiked, toggleLike, createPlaylist, addToPlaylist, removeFromPlaylist } from '../lib/library.js';
import { ui, closeMenu, toggleQueue, setFull, toast } from '../lib/ui.js';
import {
  player, togglePlay, next, prev, seek, toggleShuffle, toggleRepeat, setVolume, toggleMute,
  playNext, enqueue, removeFromQueue, playAt,
} from '../lib/player.js';
import { fmt, onImgError, COVER } from '../lib/util.js';

/* ---------------- Yuqori panel ---------------- */
export function Header() {
  const likedCount = useStore(library, s => s.liked.length);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onSearch = pathname.startsWith('/search');
  const [q, setQ] = useState('');
  const timer = useRef();

  useEffect(() => {
    if (onSearch) setQ(decodeURIComponent(pathname.split('/')[2] || ''));
    else setQ('');
  }, [pathname, onSearch]);

  const change = v => {
    setQ(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate('/search/' + encodeURIComponent(v.trim()), { replace: onSearch }), 450);
  };

  const nav = ({ isActive }) => (isActive ? 'active' : '');
  return (
    <header className="header">
      <Link className="logo" to="/">
        <span className="logo-mark"><svg viewBox="0 0 64 64"><path d="M18 44V20l14 14 14-14v24" /></svg></span>
        <span className="logo-text">MEXRIFY</span>
      </Link>
      <nav className="nav">
        <NavLink to="/" end className={nav}>Asosiy</NavLink>
        <NavLink to="/browse" className={nav}>Kashf etish</NavLink>
        <NavLink to="/phonk" className={nav}>Phonk ⚡</NavLink>
        <NavLink to="/chart" className={nav}>Chartlar</NavLink>
        <NavLink to="/library" className={nav}>Kutubxona</NavLink>
      </nav>
      <label className="search-box">
        <Icon name="search" />
        <input type="search" value={q} placeholder="Qo'shiq, artist yoki albom..." autoComplete="off"
          onChange={e => change(e.target.value)} onClick={() => !onSearch && navigate('/search')} />
      </label>
      <Link className="head-liked" to="/liked" title="Yoqtirganlar"><Icon name="heart" /><span>{likedCount}</span></Link>
    </header>
  );
}

export function MobileNav() {
  const nav = ({ isActive }) => (isActive ? 'active' : '');
  return (
    <nav className="mobile-nav">
      <NavLink to="/" end className={nav}><Icon name="home" />Asosiy</NavLink>
      <NavLink to="/search" className={nav}><Icon name="search" />Qidiruv</NavLink>
      <NavLink to="/phonk" className={nav}><Icon name="bolt" />Phonk</NavLink>
      <NavLink to="/library" className={nav}><Icon name="library" />Kutubxona</NavLink>
    </nav>
  );
}

/* ---------------- Range (progress/ovoz) ---------------- */
function Range({ value, max, onInput, onCommit, className = '' }) {
  const [drag, setDrag] = useState(null);
  const v = drag ?? value;
  const pct = max ? (v / max) * 100 : 0;
  return (
    <input type="range" className={'range ' + className} min="0" max={max || 0} step="any" value={v} style={{ '--p': pct + '%' }}
      onChange={e => { setDrag(+e.target.value); onInput?.(+e.target.value); }}
      onPointerUp={e => { onCommit?.(+e.target.value); setDrag(null); }}
      onKeyUp={e => { onCommit?.(+e.target.value); setDrag(null); }} />
  );
}

/* ---------------- Suzuvchi pleyer ---------------- */
export function Dock() {
  const t = useStore(player, s => s.current);
  const playing = useStore(player, s => s.playing);
  const time = useStore(player, s => s.time);
  const duration = useStore(player, s => s.duration);
  const shuffle = useStore(player, s => s.shuffle);
  const repeat = useStore(player, s => s.repeat);
  const volume = useStore(player, s => s.volume);
  const muted = useStore(player, s => s.muted);
  const label = useStore(player, s => s.label);
  const liked = useStore(library, () => (t ? isLiked(t.id) : false));
  const queueOpen = useStore(ui, s => s.queueOpen);
  const fullOpen = useStore(ui, s => s.fullOpen);
  const [scrub, setScrub] = useState(null);

  const titleTo = t ? (t.src === 'dz' && t.albumId ? `/album/${t.albumId}` : `/search/${encodeURIComponent(t.title)}`) : '/';
  const artistTo = t ? (t.src === 'dz' && t.artistId ? `/artist/${t.artistId}` : t.src === 'au' ? `/auuser/${t.auUser}` : `/search/${encodeURIComponent(t.artist || '')}`) : '/';

  return (
    <footer className="dock">
      <div className="now">
        <div className="vinyl" onClick={() => t && setFull(true)}><img className="np-cover" src={t?.cover || COVER} alt="" onError={onImgError} /></div>
        <div className="np-meta">
          <Link className="np-title" to={titleTo}>{t?.title || 'MEXRIFY'}</Link>
          <Link className="np-artist" to={artistTo}>{t?.artist || "Qo'shiq tanlang"}</Link>
        </div>
        <button className={'icon-btn like-btn' + (liked ? ' on' : '')} onClick={() => t && toggleLike(t)} title="Yoqtirish"><Icon name="heart" /></button>
      </div>
      <div className="controls">
        <div className="ctrl-btns">
          <button className={'icon-btn' + (shuffle ? ' on' : '')} id="shuffleBtn" onClick={toggleShuffle} title="Aralash"><Icon name="shuffle" /></button>
          <button className="icon-btn" id="prevBtn" onClick={prev} title="Oldingi"><Icon name="prev" /></button>
          <button className="play-btn" onClick={togglePlay} title={playing ? 'Pauza' : 'Ijro'}><Icon name={playing ? 'pause' : 'play'} /></button>
          <button className="icon-btn" onClick={() => next()} title="Keyingi"><Icon name="next" /></button>
          <button className={'icon-btn' + (repeat ? ' on' : '') + (repeat === 2 ? ' one' : '')} id="repeatBtn" onClick={toggleRepeat}
            title={['Takrorlash', 'Hammasini takrorlash', 'Bittasini takrorlash'][repeat]}><Icon name="repeat" /><span className="rep-one">1</span></button>
        </div>
        <div className="progress-row">
          <span>{fmt(scrub ?? time)}</span>
          <Range value={time} max={duration} className="seek" onInput={setScrub} onCommit={v => { seek(v); setScrub(null); }} />
          <span>{fmt(duration)}</span>
        </div>
      </div>
      <div className="extra">
        {label && <span className="src-tag">{label}</span>}
        <button className={'icon-btn' + (queueOpen ? ' on' : '')} onClick={toggleQueue} title="Navbat"><Icon name="queue" /></button>
        <button className="icon-btn" onClick={toggleMute} title="Ovoz" style={{ opacity: muted || !volume ? 0.5 : 1 }}><Icon name="volume" /></button>
        <Range value={muted ? 0 : volume} max={100} className="vol" onInput={setVolume} />
        <button className="icon-btn" onClick={() => setFull(!fullOpen)} title="Kattalashtirish"><Icon name="expand" /></button>
      </div>
    </footer>
  );
}

/* ---------------- Navbat ---------------- */
export function QueuePanel() {
  const open = useStore(ui, s => s.queueOpen);
  const queue = useStore(player, s => s.queue);
  const qi = useStore(player, s => s.qi);
  const shuffle = useStore(player, s => s.shuffle);
  const current = queue[qi];
  const Item = ({ t, i }) => (
    <div className={'q-item' + (i === qi ? ' cur' : '')} onClick={e => !e.target.closest('button') && playAt(i)}>
      <img src={t.cover} alt="" onError={onImgError} />
      <div className="t-text"><div className="t-title"><span className="ell">{t.title}</span></div><div className="t-artist">{t.artist}</div></div>
      {i !== qi && <button className="icon-btn" onClick={() => removeFromQueue(i)} title="Olib tashlash"><Icon name="close" /></button>}
    </div>
  );
  const upcoming = queue.slice(qi + 1, qi + 81);
  return (
    <aside className={'queue-panel' + (open ? ' open' : '')}>
      <div className="queue-head"><h3>Navbat</h3><button className="icon-btn" onClick={toggleQueue}><Icon name="close" /></button></div>
      <div id="queueList">
        {current ? <>
          <div className="q-label">Hozir ijroda</div><Item t={current} i={qi} />
          <div className="q-label">Keyingi{shuffle ? ' (aralash)' : ''}</div>
          {upcoming.length ? upcoming.map((t, k) => <Item key={t.id + k} t={t} i={qi + 1 + k} />) : <p className="note" style={{ padding: 8 }}>Navbat bo'sh — oxirida avtoijro yoqiladi</p>}
        </> : <div className="empty"><p>Navbat bo'sh</p></div>}
      </div>
    </aside>
  );
}

/* ---------------- To'liq ekran ---------------- */
const BARS = Array.from({ length: 36 }, (_, i) => ({ animationDelay: `${(i * 137 % 100) / 100}s`, animationDuration: `${0.6 + (i * 53 % 50) / 100}s` }));
export function Fullscreen() {
  const open = useStore(ui, s => s.fullOpen);
  const t = useStore(player, s => s.current);
  useEffect(() => {
    const k = e => e.key === 'Escape' && setFull(false);
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, []);
  if (!open || !t) return null;
  return (
    <div className="fullscreen open">
      <div className="fs-bg" style={{ backgroundImage: `url("${t.coverXl || t.cover}")` }} />
      <button className="icon-btn fs-close" onClick={() => setFull(false)}><Icon name="down" /></button>
      <div className="fs-inner">
        <div className="fs-disc"><img className="fs-cover" src={t.coverXl || t.cover} alt="" onError={onImgError} /></div>
        <div className="fs-meta"><h2>{t.title}</h2><p>{t.artist}</p></div>
        <div className="viz">{BARS.map((s, i) => <i key={i} style={s} />)}</div>
      </div>
    </div>
  );
}

/* ---------------- Kontekst menyu ---------------- */
export function ContextMenu() {
  const menu = useStore(ui, s => s.menu);
  const playlists = useStore(library, s => s.playlists);
  const ref = useRef();
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useLayoutEffect(() => {
    if (!menu || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ left: Math.max(8, Math.min(menu.x, innerWidth - r.width - 8)), top: Math.max(8, Math.min(menu.y, innerHeight - r.height - 8)) });
  }, [menu]);
  useEffect(() => {
    if (!menu) return;
    const close = e => !ref.current?.contains(e.target) && closeMenu();
    const t = setTimeout(() => document.addEventListener('mousedown', close));
    document.getElementById('main')?.addEventListener('scroll', closeMenu, { once: true });
    return () => { clearTimeout(t); document.removeEventListener('mousedown', close); };
  }, [menu]);

  if (!menu) return null;
  const { track: t, playlistId } = menu;
  const act = fn => () => { fn(); closeMenu(); };
  const share = () => {
    const link = t.src === 'dz' ? `https://www.deezer.com/track/${t.rid}` : t.src === 'au' ? `https://audius.co/tracks/${t.rid}` : `${t.title} — ${t.artist}`;
    navigator.clipboard?.writeText(link).then(() => toast('Havola nusxalandi'), () => toast(link));
  };
  return (
    <div className="menu open" ref={ref} style={pos}>
      <button onClick={act(() => playNext(t))}><Icon name="next" /> Keyingi bo'lib ijro etish</button>
      <button onClick={act(() => enqueue(t))}><Icon name="queue" /> Navbatga qo'shish</button>
      <button onClick={act(() => toggleLike(t))}><Icon name="heart" /> {isLiked(t.id) ? 'Yoqtirganlardan olib tashlash' : "Yoqtirganlarga qo'shish"}</button>
      {playlistId && <button onClick={act(() => removeFromPlaylist(playlistId, t.id))}><Icon name="trash" /> Pleylistdan olib tashlash</button>}
      <hr /><div className="note" style={{ padding: '6px 12px' }}>Pleylistga qo'shish</div>
      <button onClick={act(() => createPlaylist(prompt('Pleylist nomi:', `Mening pleylistim #${playlists.length + 1}`), t))}><Icon name="plus" /> Yangi pleylist</button>
      {playlists.map(p => <button key={p.id} onClick={act(() => addToPlaylist(p.id, t))}><Icon name="queue" /> {p.name}</button>)}
      <hr />
      {t.src === 'dz' && t.artistId && <Link to={`/artist/${t.artistId}`} onClick={closeMenu}><Icon name="user" /> Artistga o'tish</Link>}
      {t.src === 'au' && t.auUser && <Link to={`/auuser/${t.auUser}`} onClick={closeMenu}><Icon name="user" /> Artistga o'tish</Link>}
      {t.src === 'dz' && t.albumId && <Link to={`/album/${t.albumId}`} onClick={closeMenu}><Icon name="disc" /> Albomga o'tish</Link>}
      <button onClick={act(share)}><Icon name="link" /> Havolani nusxalash</button>
    </div>
  );
}

export function Toast() {
  const t = useStore(ui, s => s.toast);
  return <div className={'toast' + (t ? ' show' : '')}>{t?.msg}</div>;
}
