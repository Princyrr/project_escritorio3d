import { ArrowLeft } from 'lucide-react';

export default function StandingCharacterSection({ progress, hologramProgress }: { progress: number; hologramProgress: number; restoring?: boolean }) {
  return <div className="standing-layer" aria-hidden={progress < 0.05} style={{ opacity: progress, visibility: progress > 0.001 ? 'visible' : 'hidden' }}>
    <header className="office-header">
      <a href="#/" className="office-back" style={{ pointerEvents: progress > 0.8 ? 'auto' : 'none' }}><ArrowLeft size={17} /> Voltar ao início</a>
      <span className="office-nav">INTELIGÊNCIA ESTRATÉGICA</span>
      <span className="office-pill">EXPLORE AS POSSIBILIDADES</span>
    </header>
    <section className="standing-section" aria-label="Transformação de dados em informações relevantes" style={{ transform: `translateY(${(1 - progress) * 45}px)` }}>
      <p className="office-eyebrow">DO DADO À DECISÃO</p>
      <h2>Dados em<br />informações<br />relevantes.</h2>
      <span className="office-label">DECISÕES MAIS RÁPIDAS E ASSERTIVAS</span>
      <p className="office-description">Transformamos dados em informações relevantes para apoiar empresas, instituições e gestores na tomada de decisões mais rápidas e assertivas.</p>
      <span className="sr-only" role="progressbar" aria-label="Transformação em holograma" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(hologramProgress * 100)} />
    </section>
  </div>;
}
