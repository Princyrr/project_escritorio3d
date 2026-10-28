import { useState } from 'react';
import { ArrowLeft, Pause, Play } from 'lucide-react';

function Leaves({ flip = false }: { flip?: boolean }) {
  return <g transform={flip ? 'translate(800 0) scale(-1 1)' : undefined}>
    {Array.from({ length: 12 }, (_, i) => {
      const x = 25 + (i % 4) * 28, y = 665 - Math.floor(i / 4) * 95;
      return <g key={i} className="studio-leaf" style={{ animationDelay: `${i * -.43}s`, transformOrigin: `${x + 40}px ${y + 60}px` }}>
        <path d={`M${x+40} ${y+60} Q${x-38} ${y-25} ${x+8} ${y-128} Q${x+78} ${y-37} ${x+40} ${y+60}`} fill={`url(#leaf${i%3})`} transform={`rotate(${(i%4)*27-34} ${x+40} ${y+60})`} />
        <path d={`M${x+40} ${y+60} Q${x+23} ${y-15} ${x+8} ${y-128}`} fill="none" stroke="#bcb2ff" strokeWidth="1.5" opacity=".38" />
      </g>;
    })}
  </g>;
}

function Person({ flip = false }: { flip?: boolean }) {
  return <g transform={flip ? 'translate(800 0) scale(-1 1)' : undefined}>
    <ellipse cx="244" cy="695" rx="92" ry="12" fill="#5140aa" opacity=".22" />
    <path d="M186 592 L172 692 M242 592 L270 693 M159 590 L139 689" stroke="#8681c6" strokeWidth="7" />
    <path d="M188 558 Q226 543 257 570 L283 658 L261 664 L225 599 L194 600Z" fill="url(#trousers)" />
    <path d="M181 581 Q182 610 218 620 L220 679 L243 680 L246 607 L222 574Z" fill="#252172" />
    <path d="M260 661 L283 657 L298 674 Q296 683 264 680Z M218 677 L241 675 L250 691 Q245 699 217 696Z" fill="#171951" stroke="#9699dd" strokeWidth="2" />
    <path d="M177 477 Q196 463 218 474 Q243 480 246 524 L228 572 Q195 585 168 560 L157 514Z" fill="url(#shirt)" />
    <path d="M213 492 Q230 501 242 532 L286 540 L286 552 Q246 560 227 548 L205 523" fill="url(#shirt)" stroke="#455fe0" strokeWidth="2" />
    <g className="studio-hand"><path d="M280 540 Q291 533 303 540 L311 547 Q297 557 281 551Z" fill="#e8a4b2" /></g>
    <path d="M192 476 L194 458 L211 457 L217 478" fill="#cb85a4" />
    <g className="studio-head" style={{transformOrigin:'201px 459px'}}>
      <path d="M182 428 Q197 410 216 428 L220 450 L211 466 L193 463 L185 448Z" fill="#e7a1b0" />
      <path d="M181 444 Q168 417 190 414 Q214 403 222 424 L216 438 L203 432 L194 451Z" fill="#10153b" />
      <path d="M210 434 L225 433 L225 443 L212 444Z" fill="#3e3091" /><path d="M216 435 L222 435" stroke="#91d7ff" strokeWidth="2" />
    </g>
    <path d="M137 527 Q134 519 146 519 L186 524 Q198 525 201 540 L210 588 Q210 599 196 600 L158 589Z" fill="url(#chair)" stroke="#d790ec" strokeWidth="5" />
    <path d="M159 589 Q205 607 231 590" stroke="#bb80e2" strokeWidth="7" fill="none" />
  </g>;
}

function Laptop({ flip = false }: { flip?: boolean }) {
  return <g transform={flip ? 'translate(800 0) scale(-1 1)' : undefined}>
    <path d="M238 504 L252 462 L322 468 L309 510Z" fill="#1d2274" stroke="#d9f1ff" strokeWidth="3" />
    <path d="M249 503 L259 472 L312 476 L303 504Z" fill="#34318d" />
    {Array.from({length:7},(_,i)=><path key={i} d={`M${259+i*6} 497 l3 -${8+(i*7)%20}`} stroke="#9cddff" strokeWidth="2" className="studio-chart-bar" style={{animationDelay:`${i*-.2}s`}} />)}
    <path d="M238 504 L309 510 L326 521 L249 516Z" fill="#b8c7f4" stroke="#edf8ff" strokeWidth="1.5" />
    <path d="M255 509 L300 513" stroke="#676ec0" strokeWidth="3" />
  </g>;
}

function Card({ x, y, kind, index }: { x: number; y: number; kind: number; index: number }) {
  return <g className="studio-card" style={{animationDelay:`${index*-.7}s`}} transform={`translate(${x} ${y})`}>
    <rect width="78" height="59" rx="8" fill="url(#card)" filter="url(#shadow)" />
    {kind === 0 ? <g>{[0,1,2,3,4].map(i=><rect key={i} x={12+i*11} y={42-(i*9)%27} width="6" height={8+(i*9)%27} rx="2" fill={i%2?'#ac6de3':'#52b4e9'} />)}</g> : kind === 1 ? <g><circle cx="39" cy="29" r="18" fill="#8067e5" /><path d="M39 29 L39 11 A18 18 0 0 1 57 29Z" fill="#f4ae79" /><circle cx="39" cy="29" r="8" fill="#d8efff" /></g> : <g>{[0,1,2,3].map(i=><rect key={i} x="12" y={12+i*10} width={49-(i%2)*17} height="4" rx="2" fill={i%2?'#9ab6e8':'#8077d0'} />)}</g>}
  </g>;
}

export default function AnimatedStudioPage() {
  const [playing, setPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  return <main className={`studio2d-page ${playing ? '' : 'studio2d-paused'}`}>
    <header className="studio2d-header"><a href="#/"><ArrowLeft size={16} /> Voltar ao início</a><span>ESTÚDIO DE DADOS · ILUSTRAÇÃO ANIMADA</span><button onClick={()=>setPlaying(v=>!v)} type="button" aria-pressed={!playing}>{playing?<Pause size={15}/>:<Play size={15}/>} {playing?'Pausar':'Retomar'}</button></header>
    <section className="studio2d-layout"><div className="studio2d-copy"><p>PESSOAS + DADOS + POSSIBILIDADES</p><h1>Grandes ideias.<br/><em>Novas conexões.</em></h1><p>O conhecimento ganha vida quando compartilhamos perspectivas.</p><a href="#/colaboracao">Explorar também em 3D ↗</a><span className="studio2d-note">Uma ilustração em movimento</span></div>
    <svg className="studio2d-art" viewBox="0 0 800 800" role="img" aria-label="Ilustração 2D animada de duas pessoas com notebooks, um grande painel de dados e vegetação azul e violeta">
      <defs>
        <linearGradient id="backdrop" x2="1" y2="1"><stop stopColor="#a8a9f1"/><stop offset=".5" stopColor="#82d5f8"/><stop offset="1" stopColor="#d09cf1"/></linearGradient>
        <radialGradient id="pinkGlow"><stop stopColor="#ffc1dc" stopOpacity=".95"/><stop offset="1" stopColor="#ffc1dc" stopOpacity="0"/></radialGradient>
        <linearGradient id="screen" x2=".6" y2="1"><stop stopColor="#99dcfa"/><stop offset="1" stopColor="#af8ce5"/></linearGradient>
        <linearGradient id="sidebar" x2=".7" y2="1"><stop stopColor="#575ee0"/><stop offset="1" stopColor="#cc83d8"/></linearGradient>
        <linearGradient id="card" x2="1" y2="1"><stop stopColor="#f0fcff"/><stop offset="1" stopColor="#bddef8"/></linearGradient>
        <linearGradient id="shirt" x2="1" y2=".6"><stop stopColor="#154bc8"/><stop offset="1" stopColor="#38309a"/></linearGradient>
        <linearGradient id="trousers" x2="1" y2="1"><stop stopColor="#343093"/><stop offset="1" stopColor="#171950"/></linearGradient>
        <linearGradient id="chair" x2="1" y2="1"><stop stopColor="#4740b6"/><stop offset="1" stopColor="#272477"/></linearGradient>
        <linearGradient id="leaf0" x2="1" y2="1"><stop stopColor="#435bd6"/><stop offset="1" stopColor="#292580"/></linearGradient>
        <linearGradient id="leaf1" x2="1" y2="1"><stop stopColor="#c768dc"/><stop offset="1" stopColor="#6545c4"/></linearGradient>
        <linearGradient id="leaf2" x2="1" y2="1"><stop stopColor="#559ce8"/><stop offset="1" stopColor="#4551bf"/></linearGradient>
        <linearGradient id="table" x2="0" y2="1"><stop stopColor="#b5f6ff"/><stop offset=".6" stopColor="#68d6f4"/><stop offset="1" stopColor="#a2a7f6"/></linearGradient>
        <filter id="shadow" x="-40%" y="-40%" width="180%" height="200%"><feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#4539a9" floodOpacity=".16"/></filter>
      </defs>
      <rect width="800" height="800" rx="28" fill="url(#backdrop)"/><circle cx="760" cy="45" r="340" fill="url(#pinkGlow)"/>
      <path d="M0 570 Q400 530 800 570V800H0Z" fill="#c4bafa" opacity=".55"/>
      {[0,1,2,3,4].map(i=><path key={i} d={`M0 ${605+i*44} H800 M${400+(i-2)*130} 560 L${400+(i-2)*300} 800`} stroke="#eee4ff" strokeOpacity=".22" fill="none"/>)}
      <Leaves/><Leaves flip/>
      <ellipse cx="400" cy="706" rx="238" ry="23" fill="#7660c7" opacity=".16"/>
      <path d="M385 421 L369 492 H436 L417 421" fill="#3a35ab"/><ellipse cx="402" cy="494" rx="81" ry="10" fill="#5443be"/>
      <rect x="180" y="177" width="440" height="270" rx="17" fill="#2725a8" filter="url(#shadow)"/><rect x="187" y="185" width="426" height="254" rx="11" fill="url(#screen)"/>
      <path d="M188 210H612" stroke="#3038ac" strokeWidth="5"/><path d="M204 199 H249" stroke="#e1f5ff" strokeWidth="3"/>
      {[0,1,2,3].map(i=><circle key={i} cx={562+i*12} cy="199" r="2.5" fill="#e1fcff"/>)}
      <rect x="198" y="221" width="81" height="205" rx="7" fill="url(#sidebar)"/>
      {Array.from({length:10},(_,i)=><g key={i}><circle cx="207" cy={234+i*13} r="2" fill="#a9e7ff"/><path d={`M215 ${234+i*13}h${35+(i%3)*8}`} stroke="#d0d7ff" strokeWidth="2"/></g>)}
      <circle cx="243" cy="384" r="13" fill="none" stroke="#d4e4ff" strokeWidth="5"/><path d="M243 371A13 13 0 0 1 256 384" stroke="#67d9eb" strokeWidth="5" fill="none"/>
      {[0,1].map(i=><g key={i}><rect x="292" y={225+i*55} width="304" height="46" rx="7" fill="url(#card)"/><circle cx="317" cy={248+i*55} r="12" fill={i?'#81c4ed':'#9a80df'}/><path d={`M338 ${239+i*55}h96 m-96 7h149 m-149 9h72`} stroke="#4d6fbb" strokeWidth="3"/><path d={`M531 ${239+i*55}h42 m-42 10h32`} stroke="#79afdb" strokeWidth="3"/></g>)}
      <rect x="292" y="337" width="304" height="81" rx="7" fill="url(#card)"/>
      {[0,1,2].map(i=><path key={i} d={`M307 ${353+i*22}H580`} stroke="#d2dff5" fill="none"/>)}
      <path className="studio-line" d="M308 401L331 376L355 394L379 361L402 387L426 371L450 379L473 351L496 374L522 345L546 366L577 341" stroke="#db62bd" strokeWidth="3" fill="none"/>
      <g className="studio-card"><rect x="548" y="241" width="105" height="85" rx="8" fill="#7771da" fillOpacity=".72" stroke="#c5eaff"/>{[0,1,2,3,4,5].map(i=><rect key={i} x={560+i*13} y={307-(i*13)%49} width="7" height={10+(i*13)%49} rx="2" fill="#dcfaff" className="studio-chart-bar" style={{animationDelay:`${i*-.3}s`}}/>)}<path d="M558 312H642" stroke="#d0efff"/></g>
      <ellipse cx="400" cy="551" rx="252" ry="33" fill="#adbbf6" opacity=".4"/><path d="M156 519Q400 548 644 519V541Q400 575 156 541Z" fill="url(#table)"/><ellipse cx="400" cy="519" rx="244" ry="24" fill="url(#table)" stroke="#c0f7ff" strokeWidth="3"/>
      <path d="M350 552L334 642 M451 552L467 642" stroke="#a4a0dc" strokeWidth="10"/><ellipse cx="400" cy="520" rx="22" ry="7" fill="#333693" stroke="#dbf9ff" strokeWidth="2"/>
      <Laptop/><Laptop flip/><Person/><Person flip/>
      <Card x={120} y={244} kind={1} index={0}/><Card x={101} y={344} kind={0} index={1}/><Card x={560} y={346} kind={2} index={2}/><Card x={530} y={118} kind={2} index={3}/><Card x={208} y={130} kind={2} index={4}/>
      {Array.from({length:16},(_,i)=><g key={i} className="studio-sparkle" style={{animationDelay:`${i*-.4}s`}} transform={`translate(${70+(i*137)%660} ${75+(i*83)%380})`}><path d="M-4 0H4M0-4V4" stroke={i%2?'#e5fcff':'#ffdbff'} strokeWidth="1.5"/></g>)}
    </svg></section>
  </main>;
}
