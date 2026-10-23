import { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Header, MobileNav, Dock, QueuePanel, Fullscreen, ContextMenu, Toast } from './components/Layout.jsx';
import { useStore } from './lib/store.js';
import { player } from './lib/player.js';
import { ui, closeMenu } from './lib/ui.js';
import Home from './pages/Home.jsx';
import Search from './pages/Search.jsx';
import Phonk from './pages/Phonk.jsx';
import { Chart, Browse, Genre } from './pages/Discover.jsx';
import { Artist, Album, Playlist, AudiusUser } from './pages/Details.jsx';
import { Liked, Recent, MyPlaylist, Library } from './pages/LibraryPages.jsx';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.getElementById('main')?.scrollTo(0, 0);
    closeMenu();
  }, [pathname]);
  return null;
}

// CSS animatsiyalari uchun body sinflari
function BodyClasses() {
  const playing = useStore(player, s => s.playing);
  const yt = useStore(player, s => s.mode === 'yt');
  const full = useStore(ui, s => s.fullOpen);
  useEffect(() => {
    const b = document.body.classList;
    b.toggle('playing', playing); b.toggle('paused', !playing);
    b.toggle('yt-on', yt); b.toggle('fs-on', full);
  }, [playing, yt, full]);
  return null;
}

function YtBox() {
  const on = useStore(player, s => s.mode === 'yt');
  // YouTube iframe'ni React boshqarmaydi — u #ytHost ichiga qo'lda qo'shiladi
  return <div className={'yt-box' + (on ? ' open' : '')}><div id="ytHost" /></div>;
}

export default function App() {
  return (
    <HashRouter>
      <ScrollTop />
      <BodyClasses />
      <div className="aurora"><i /><i /><i /></div>
      <main className="main" id="main">
        <Header />
        <div className="view">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chart" element={<Chart />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/genre/:id" element={<Genre />} />
            <Route path="/phonk/:sub?" element={<Phonk />} />
            <Route path="/search/:q?" element={<Search />} />
            <Route path="/artist/:id" element={<Artist />} />
            <Route path="/album/:id" element={<Album />} />
            <Route path="/playlist/:id" element={<Playlist />} />
            <Route path="/auuser/:id" element={<AudiusUser />} />
            <Route path="/liked" element={<Liked />} />
            <Route path="/recent" element={<Recent />} />
            <Route path="/my/:id" element={<MyPlaylist />} />
            <Route path="/library" element={<Library />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </div>
      </main>
      <QueuePanel />
      <Dock />
      <MobileNav />
      <Fullscreen />
      <YtBox />
      <ContextMenu />
      <Toast />
    </HashRouter>
  );
}
