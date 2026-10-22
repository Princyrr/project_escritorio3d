import { useState } from 'react';
import { ArrowLeft, MousePointer2 } from 'lucide-react';
import MouseRobot from './MouseRobot';

export default function MouseRobotPage() {
  const [tracking, setTracking] = useState(true);
  return <main className="min-h-screen bg-[#e5e5e3] text-zinc-900">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 px-6 py-4">
      <a href="#/" className="inline-flex items-center gap-2 text-sm"><ArrowLeft size={16} /> Voltar ao início</a>
      <span className="text-xs font-medium uppercase tracking-[0.25em]">Atlas · Robot Lab</span>
      <button type="button" aria-pressed={tracking} onClick={() => setTracking(value => !value)} className="inline-flex items-center gap-2 rounded-full border border-black/20 px-4 py-2 text-sm hover:bg-black/5"><MousePointer2 size={15} /> {tracking ? 'Pausar movimento' : 'Acompanhar mouse'}</button>
    </header>
    <section className="mx-auto max-w-5xl px-4 pt-8 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Uma presença interativa</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Ele olha para você.</h1>
      <p className="mt-3 text-sm text-zinc-600">Mova o mouse pela página e observe a cabeça acompanhar seu movimento.</p>
      <MouseRobot tracking={tracking} />
      <p className="pb-6 text-xs text-zinc-500">Movimento suave, com limites naturais. A preferência por movimento reduzido é respeitada.</p>
    </section>
  </main>;
}
