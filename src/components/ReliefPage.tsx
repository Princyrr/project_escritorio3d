import { useState } from 'react';
import { ArrowLeft, Box, RotateCcw, Sparkles } from 'lucide-react';
import BuildingModel from './BuildingModel';

const EFFECTS = ['Modelo original', 'Holograma', 'Textura', 'Água', 'Fumaça', 'Fogo'];

export default function ReliefPage() {
  const [reliefEnabled, setReliefEnabled] = useState(false);
  const [effect, setEffect] = useState(0);
  const [depth, setDepth] = useState(1);
  const [viewKey, setViewKey] = useState(0);
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
        <a href="#/" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5"><ArrowLeft className="h-4 w-4" /> Voltar ao início</a>
        <span className="inline-flex items-center gap-2 text-cyan-200"><Box className="h-4 w-4" /> Edifício em 3D</span>
        <a href="#/edificio" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Ver partículas</a>
      </header>
      <section className="mx-auto max-w-7xl px-6 pt-8">
        <h1 className="text-3xl font-semibold tracking-tight">Da imagem para uma maquete 3D</h1>
        <p className="mt-3 text-sm text-slate-400">Transforme a foto em uma maquete com volume, laterais, janelas e arcos. Arraste para girar e use a rolagem para aproximar.</p>
        <div className="mt-6 flex flex-wrap items-center gap-5">
          <button type="button" aria-pressed={reliefEnabled} onClick={() => setReliefEnabled((enabled) => !enabled)} className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/40 bg-cyan-500/15 px-4 py-2 text-sm text-cyan-100 transition-colors hover:bg-cyan-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"><Box className="h-4 w-4" /> {reliefEnabled ? 'Voltar à imagem plana' : 'Transformar em figura 3D'}</button>
          <label className="flex items-center gap-3 text-sm text-cyan-100">Profundidade do modelo <input aria-label="Profundidade do modelo" type="range" disabled={!reliefEnabled} min="0.5" max="2" step="0.05" value={depth} onChange={(event) => setDepth(Number(event.target.value))} className="w-40 accent-cyan-400" /><output>{Math.round(depth * 100)}%</output></label>
          <button type="button" onClick={() => { setDepth(1); setReliefEnabled(false); setEffect(0); setViewKey((key) => key + 1); }} className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20"><RotateCcw className="h-4 w-4" /> Restaurar visão</button>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setEffect((current) => (current + 1) % EFFECTS.length)} className="inline-flex items-center gap-2 rounded-lg border border-violet-300/40 bg-violet-500/15 px-4 py-2 text-sm text-violet-100 transition-colors hover:bg-violet-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300"><Sparkles className="h-4 w-4" /> Transformar em {EFFECTS[(effect + 1) % EFFECTS.length]}</button>
          <span className="text-sm text-cyan-200" aria-live="polite">Efeito atual: {EFFECTS[effect]}</span>
        </div>
        <p className="mt-3 text-xs text-slate-500">Maquete aproximada baseada na fachada da foto.</p>
        <p className="mt-3 text-xs text-slate-500">Cada clique transforma a imagem no próximo efeito. Depois do fogo, volta ao modelo original.</p>
        <p className="mt-3 text-sm text-cyan-200" aria-live="polite">{reliefEnabled ? 'Modelo 3D ativado. Arraste para ver as laterais e a parte de trás.' : 'Imagem plana. Clique em “Transformar em figura 3D” para criar o modelo.'}</p>
        <BuildingModel key={viewKey} active={reliefEnabled} depth={depth} effect={effect} />
      </section>
    </main>
  );
}
