import { useState } from 'react';
import { ArrowLeft, Orbit, RotateCcw } from 'lucide-react';
import AriaHologram from './AriaHologram';

export default function AriaHologramPage() {
  const [rotating, setRotating] = useState(false);
  const [viewKey, setViewKey] = useState(0);
  return <main className="min-h-screen bg-slate-950 text-white">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
      <a href="#/" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5"><ArrowLeft className="h-4 w-4" /> Voltar ao início</a>
      <span className="text-cyan-200">Aria · Modelo 3D</span>
      <a href="#/rosto" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Ver rosto de partículas</a>
    </header>
    <section className="mx-auto max-w-6xl px-6 pt-8 text-center">
      <h1 className="text-3xl font-semibold">Aria com textura</h1>
      <p className="mt-3 text-sm text-slate-400">Modelo sólido com a textura holográfica enviada. Arraste para girar e use a rolagem para aproximar.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button type="button" aria-pressed={rotating} onClick={() => setRotating((value) => !value)} className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20"><Orbit className="h-4 w-4" /> {rotating ? 'Parar rotação' : 'Girar automaticamente'}</button>
        <button type="button" onClick={() => { setRotating(false); setViewKey((value) => value + 1); }} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"><RotateCcw className="h-4 w-4" /> Restaurar visão</button>
      </div>
      <AriaHologram key={viewKey} rotating={rotating} />
    </section>
  </main>;
}
