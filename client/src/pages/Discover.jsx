import { useParams } from 'react-router-dom';
import { ChartGrid, TrackList } from '../components/Tracks.jsx';
import { PageHead, Actions, Loader, ErrorBox, GenreGrid, Grid, Shelf, ArtistCard } from '../components/Cards.jsx';
import { useAsync } from '../hooks.js';
import { dz } from '../lib/api.js';
import { getCollection } from '../lib/music.js';

export function Chart() {
  const { data, error, loading } = useAsync(() => getCollection('chart'), []);
  return <>
    <PageHead kind="Chart" title="Dunyo TOP 100" sub="Hozir butun dunyoda eng ko'p tinglanayotgan qo'shiqlar" icon={<span style={{ fontSize: 90 }}>🌍</span>} seed="chart" />
    <Actions spec="chart" />
    {loading ? <Loader /> : error ? <ErrorBox /> : <ChartGrid tracks={data} />}
  </>;
}

export function Browse() {
  const { data, error, loading } = useAsync(() => dz('genre').then(d => d.data), []);
  return <>
    <div className="lib-hero"><h1>Kashf etish</h1><p>Har qanday uslubdagi musiqani toping</p></div>
    {loading ? <Loader /> : error ? <ErrorBox /> : <GenreGrid genres={data} />}
  </>;
}

export function Genre() {
  const { id } = useParams();
  const { data: g, error, loading } = useAsync(() => dz('genre/' + id), [id]);
  if (loading) return <Loader />;
  if (error) return <ErrorBox />;
  return <>
    <PageHead kind="Janr" title={g.name} img={g.picture_xl} seed={g.name} sub="Ushbu janrdagi eng mashhur treklar va artistlar" />
    <Actions spec={'genre:' + id} />
    <Shelf title="Top treklar" deps={[id]} load={() => getCollection('genre:' + id)} render={d => <TrackList tracks={d} />} />
    <Shelf title="Artistlar" deps={[id]} load={async () => (await dz(`genre/${id}/artists`)).data} render={d => <Grid>{d.map(a => <ArtistCard key={a.id} a={a} />)}</Grid>} />
  </>;
}
