import { useState } from 'react';
import { ArrowLeft, MoveUpRight, Pause, Play, RotateCcw } from 'lucide-react';
import CollaborationScene from './CollaborationScene';
import TeamScene from './TeamScene';

export default function CollaborationPage() {
  const [animated, setAnimated] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [sceneKey, setSceneKey] = useState(0);
  return <main className="collaboration-page">
    <div className="studio-first-scene">
    <header className="collaboration-header">
      <a href="#/" className="collaboration-back"><ArrowLeft size={16} /> Voltar ao início</a>
      <span className="collaboration-brand">OBSERVATÓRIO <span>DA INDÚSTRIA</span></span>
      <span className="collaboration-badge"><span /> AMBIENTE 3D</span>
    </header>
    <section className="collaboration-intro">
      <p className="collaboration-eyebrow">PESSOAS, TECNOLOGIA E INFORMAÇÃO <MoveUpRight size={14} /></p>
      <h1>Conexões que viram <em>ideias.</em></h1>
      <p>Um espaço para conectar pessoas e transformar dados em novas possibilidades.</p>
    </section>
    <CollaborationScene key={sceneKey} animated={animated} />
    <footer className="collaboration-footer">
      <p><span className="collaboration-hint-dot" /> Arraste para explorar <span className="collaboration-divider">/</span> Role para conhecer a equipe</p>
      <div className="collaboration-actions">
        <button type="button" onClick={() => setAnimated(value => !value)} aria-pressed={!animated}>{animated ? <Pause size={15} /> : <Play size={15} />}{animated ? 'Pausar animação' : 'Retomar animação'}</button>
        <button type="button" onClick={() => setSceneKey(key => key + 1)}><RotateCcw size={15} /> Restaurar visão</button>
      </div>
    </footer>
    <p className="studio-scroll-cue">Role para conhecer a equipe ↓</p>
    </div>
    <TeamScene animated={animated} />
  </main>;
}
