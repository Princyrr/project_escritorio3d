import { useState } from 'react';
import { ArrowLeft, ScanFace, RotateCcw } from 'lucide-react';
import HologramFace from './HologramFace';
export default function HologramFacePage() {
  const [animationKey, setAnimationKey] = useState(0);
  return <main className="min-h-screen bg-slate-950 text-white">
    <header className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
      <a href="#/" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5"><ArrowLeft className="h-4 w-4" /> Voltar ao início</a>
      <span className="inline-flex items-center gap-2 text-cyan-200"><ScanFace className="h-5 w-5" /> Rosto holográfico</span>
    </header>
    <section className="mx-auto max-w-6xl px-6 pt-8 text-center">
      <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">Luz e presença</p>
      <h1 className="mt-3 text-3xl font-semibold">Seu holograma em partículas</h1>
      <p className="mt-3 text-sm text-slate-400">Mova o mouse para guiar o olhar. Clique para sorrir e piscar. Dê dois cliques rápidos para ela falar “Bem-vindos ao Observatório das Indústrias da Paraíba”, com movimento dos lábios e áudio.</p>
      <button type="button" onClick={() => setAnimationKey((key) => key + 1)} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20"><RotateCcw className="h-4 w-4" /> Repetir formação</button>
      <HologramFace key={animationKey} />
    </section>
  </main>;
}
