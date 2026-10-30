import { Component, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { ArrowLeft, MoveUpRight, Pause, Play, RotateCcw, Sparkles } from 'lucide-react';
import MushroomCottageScene from './MushroomCottageScene';
import './mushroom-cottage.css';

class CottageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p className="cottage-unavailable">Este pequeno mundo precisa da aceleração gráfica do navegador para aparecer.</p> : this.props.children; }
}
export default function MushroomCottagePage() {
  const [animated, setAnimated] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [enchanted, setEnchanted] = useState(false);
  const [view, setView] = useState(0);
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return <main className={`cottage-page${enchanted ? ' cottage-page--enchanted' : ''}`}>
    <header className="cottage-header">
      <a href="#/" className="cottage-back"><ArrowLeft size={16} /> Voltar aos cenários</a>
      <span className="cottage-brand"><span /> PEQUENOS MUNDOS</span>
      <span className="cottage-edition">ESTUDO Nº 11 <MoveUpRight size={13} /></span>
    </header>
    <section className="cottage-intro" aria-labelledby="cottage-title">
      <p>UM REFÚGIO ENTRE COGUMELOS</p>
      <h1 id="cottage-title">Onde a magia <em>mora.</em></h1>
      <span>Uma pequena casa. Um grande mundo para imaginar.</span>
    </section>
    <div className="cottage-world" role="group" aria-label="Cenário 3D interativo: casa em forma de ovo com lareira acesa, cogumelos coloridos, flores, árvores, pássaro branco e um pequeno mago">
      <CottageBoundary><Canvas key={view} shadows="percentage" dpr={[1, 1.5]} camera={{ position: [3, 4.8, 12], fov: 39, near: .1, far: 100 }} gl={{ antialias: true }} fallback={<p className="cottage-unavailable">A visualização 3D não está disponível neste navegador.</p>}>
        <Suspense fallback={null}><MushroomCottageScene animated={animated} enchanted={enchanted} /></Suspense>
      </Canvas></CottageBoundary>
      <span className="cottage-world-label"><i /> UM LUGAR PARA DESACELERAR</span>
    </div>
    <footer className="cottage-footer">
      <div className="cottage-hint"><span>Explore sem pressa.</span><p>Arraste para girar · Aproxime para descobrir os detalhes</p></div>
      <div className="cottage-controls">
        <button className="cottage-magic" onClick={() => setEnchanted(v => !v)} aria-pressed={enchanted}><Sparkles size={16} />{enchanted ? 'Voltar à luz do dia' : 'Um toque de magia'}</button>
        <button onClick={() => setAnimated(v => !v)} aria-pressed={!animated}>{animated ? <Pause size={15} /> : <Play size={15} />}<span>{animated ? 'Pausar' : 'Animar'}</span></button>
        <button onClick={() => setView(v => v + 1)} aria-label="Restaurar a visão do cenário" title="Restaurar visão"><RotateCcw size={16} /></button>
      </div>
    </footer>
  </main>;
}
