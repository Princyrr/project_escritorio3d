import { useState } from 'react';
import { ArrowLeft, Building2, RotateCcw, Sparkles } from 'lucide-react';
import ParticleBuilding from './ParticleBuilding';

const EFFECTS = ['Relevo 3D', 'Holograma', 'Wireframe', 'Pontos conectados', 'Mosaico', 'Desenho progressivo', 'Profundidade e movimento'];

export default function BuildingPage() {
  const [effectCount, setEffectCount] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);

  return (
    <main className="building-page min-h-screen bg-slate-950 text-white">
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-slate-950/70 px-6 py-4 backdrop-blur-md">
        <a href="#/" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
          <ArrowLeft className="h-4 w-4" /> Voltar ao início
        </a>
        <span className="inline-flex items-center gap-2 text-sm font-medium text-cyan-200"><Building2 className="h-4 w-4" /> Edifício de partículas</span>
        <button type="button" onClick={() => setAnimationKey((key) => key + 1)} className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 transition-colors hover:bg-cyan-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
          <RotateCcw className="h-4 w-4" /> Repetir animação
        </button>
      </header>
      <section className="building-stage relative overflow-hidden" aria-label="Animação do edifício em partículas">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_right,_rgba(6,182,212,0.12),transparent_65%)]" />
        <div className="relative z-20 max-w-3xl px-8 pt-12 sm:px-12 sm:pt-12 pointer-events-none">
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-cyan-400">Movimento e luz</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Arquitetura em partículas</h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">Sua imagem ganha forma em milhares de partículas luminosas.</p>
        </div>
        <div className="relative z-20 flex flex-wrap items-center gap-3 px-8 pt-6 sm:px-12">
          <a href="#/relevo" className="rounded-lg border border-violet-300/40 bg-violet-500/15 px-4 py-2 text-sm text-violet-100 hover:bg-violet-500/25">Abrir relevo 3D</a>
          <button type="button" disabled={effectCount === EFFECTS.length} onClick={() => setEffectCount((count) => Math.min(count + 1, EFFECTS.length))} className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/40 bg-cyan-500/15 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/25 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
            <Sparkles className="h-4 w-4" /> {effectCount < EFFECTS.length ? `Acrescentar: ${EFFECTS[effectCount]}` : 'Todos os efeitos adicionados'}
          </button>
          <button type="button" onClick={() => setEffectCount(0)} disabled={effectCount === 0} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-40">Limpar efeitos</button>
          <span className="text-xs text-slate-400" aria-live="polite">{effectCount} / {EFFECTS.length} efeitos</span>
          <div className="flex w-full flex-wrap gap-2" aria-label="Efeitos ativos">{EFFECTS.slice(0, effectCount).map((effect) => <span key={effect} className="rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">{effect}</span>)}</div>
        </div>
        <div className="particle-composition">
          <ParticleBuilding key={`building-${animationKey}`} effectCount={effectCount} />
        </div>
      </section>
    </main>
  );
}
