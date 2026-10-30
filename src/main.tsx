import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import EnchantedForestPage from './components/EnchantedForestPage';
import MushroomCottagePage from './components/MushroomCottagePage';
import WorkroomPage from './components/WorkroomPage';
import AnimatedStudioPage from './components/AnimatedStudioPage';
import CollaborationPage from './components/CollaborationPage';
import './index.css';
import BuildingPage from './components/BuildingPage';
import ReliefPage from './components/ReliefPage';
import HologramFacePage from './components/HologramFacePage';
import AriaHologramPage from './components/AriaHologramPage';
import ScrollOfficePage from './components/ScrollOfficePage';
import MouseRobotPage from './components/MouseRobotPage';

function Pages() {
  const [path, setPath] = useState(window.location.hash);
  useEffect(() => {
    const navigate = () => setPath(window.location.hash);
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  if (path === '#/casa-encantada') return <MushroomCottagePage />;
  if (path === '#/bosque') return <EnchantedForestPage />;
  if (path === '#/sala-trabalho') return <WorkroomPage />;
  if (path === '#/estudio-2d') return <AnimatedStudioPage />;
  if (path === '#/colaboracao') return <CollaborationPage />;
  if (path === '#/robo') return <MouseRobotPage />;
  if (path === '#/escritorio') return <ScrollOfficePage />;
  if (path === '#/aria') return <AriaHologramPage />;
  if (path === '#/rosto') return <HologramFacePage />;
  if (path === '#/relevo') return <ReliefPage />;
  return (path === '#/edificio' || path === '#/mao') ? <BuildingPage /> : <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Pages />
  </StrictMode>
);
