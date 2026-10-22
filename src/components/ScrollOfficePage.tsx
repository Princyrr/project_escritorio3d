import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft } from 'lucide-react';
import ScrollOfficeScene from './ScrollOfficeScene';
import StandingCharacterSection from './StandingCharacterSection';

export default function ScrollOfficePage() {
  const page = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    window.scrollTo(0, 0);
    let request = 0;
    const update = () => {
      if (!page.current) return;
      const bounds = page.current.getBoundingClientRect();
      setProgress(Math.max(0, Math.min(1, -bounds.top / Math.max(1, bounds.height - window.innerHeight))));
      request = 0;
    };
    const schedule = () => { if (!request) request = requestAnimationFrame(update); };
    window.addEventListener('scroll', schedule, { passive: true }); window.addEventListener('resize', schedule); update();
    return () => { window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); cancelAnimationFrame(request); };
  }, []);
  const timelineProgress = progress * 1.22;
  const originalProgress = Math.min(1, timelineProgress / 0.62);
  const restoreValue = Math.max(0, Math.min(1, (timelineProgress - 0.65) / 0.15));
  const restoration = restoreValue * restoreValue * (3 - 2 * restoreValue);
  const laboratoryProgress = Math.max(0, Math.min(1, (timelineProgress - 0.84) / 0.34));
  const narrativeProgress = Math.min(1, originalProgress / 0.68);
  const poseProgress = Math.min(1, narrativeProgress / 0.76);
  const hologramProgress = Math.max(0, Math.min(1, (originalProgress - 0.70) / 0.28)) * (1 - restoration);
  const transitionValue = Math.max(0, Math.min(1, (narrativeProgress - 0.22) / 0.58));
  const transition = transitionValue * transitionValue * (3 - 2 * transitionValue);
  return <main ref={page} className="office-page">
    <div className="office-sticky office-two-scenes" style={{background:`rgb(${Math.round(8+laboratoryProgress*2)},${Math.round(39+laboratoryProgress*8)},${Math.round(95+laboratoryProgress*4)})`}}>
      <div className="office-background" style={{ transform: `translate(${transition * 65}vw, ${-transition * 110}vh)` }} />
      <div className="office-original-content" style={{ transform: `translate(${transition * 65}vw, ${-transition * 110}vh)`, opacity: 1 - Math.max(0, (transition - 0.75) / 0.25), visibility: transition < 0.999 ? 'visible' : 'hidden' }}>
      <header className="office-header">
        <a href="#/" className="office-back"><ArrowLeft size={17} /> Voltar ao início</a>
        <span className="office-nav">OBSERVATÓRIO DA INDÚSTRIA</span>
        <span className="office-pill">ROLE PARA EXPLORAR</span>
      </header>
      <div className="office-copy">
        <p className="office-eyebrow">INTELIGÊNCIA PARA A PARAÍBA</p>
        <h1>Observatório<br />da Indústria<br />da Paraíba</h1>
        <span className="office-label">CENTRO DE INTELIGÊNCIA ESTRATÉGICA</span>
        <p className="office-description">Conectamos dados e conhecimento para compreender a indústria e apoiar o desenvolvimento da Paraíba.</p>
        <div className="office-scroll"><ArrowDown size={18} /><span>{poseProgress < 0.9 ? 'Continue rolando' : 'Continue para a próxima cena'}</span></div>
        <div className="office-progress" role="progressbar" aria-label="Movimento do personagem" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(originalProgress * 100)}><div style={{ width: `${originalProgress * 100}%` }} /></div>
      </div>
      <span className="office-caption">DADOS, CONHECIMENTO E DESENVOLVIMENTO.</span>
      </div>
      <div aria-hidden={laboratoryProgress>.34} style={{opacity:1-Math.min(1,laboratoryProgress*3)}}><StandingCharacterSection progress={transition} hologramProgress={hologramProgress} restoring={timelineProgress>=0.65} /></div>
      <div className="laboratory-layer" style={{opacity:Math.max(0,(laboratoryProgress-.12)/.50),visibility:laboratoryProgress>.01?'visible':'hidden'}}>
        <header className="office-header"><a href="#/" className="office-back"><ArrowLeft size={17}/> Voltar ao início</a><span className="office-nav">SALA DE DADOS</span><span className="office-pill">DO DIGITAL AO REAL</span></header>
        <section className="laboratory-copy"><p className="office-eyebrow">INFORMAÇÃO QUE GANHA FORMA</p><h2>Dados que<br/>ganham forma.</h2><span className="office-label">SOLUÇÕES VISUAIS</span><p className="office-description">Transformamos dados em plataformas, painéis, dashboards e diagramações que tornam a informação clara, acessível e útil para decidir.</p></section>
      </div>
      <ScrollOfficeScene progress={poseProgress} transition={transition} hologramProgress={hologramProgress} laboratoryProgress={laboratoryProgress} />
    </div>
  </main>;
}
