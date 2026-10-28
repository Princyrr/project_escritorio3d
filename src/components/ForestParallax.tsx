import { useEffect, useRef } from 'react';

function Shrub({x,y,size=1,purple=false}: {x:number;y:number;size?:number;purple?:boolean}) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    <path d="M-115 35Q-156-19-104-48Q-134-101-74-109Q-88-165-32-157Q-10-207 29-161Q91-181 89-121Q146-111 117-60Q165-14 112 35Z" fill={purple?'url(#fl-shrub-purple)':'url(#fl-shrub-blue)'}/>
    {Array.from({length:16},(_,i)=>{const px=Math.sin(i*2.4)*(30+i*4),py=-25-(i*29)%127;return <g key={i} transform={`translate(${px} ${py}) rotate(${i*31})`}><path d="M0 0Q-28-9-20-39Q6-26 0 0Z" fill={purple?'#8874c0':'#58acba'} opacity={.23+(i%3)*.09}/><path d="M0 0L-15-28" stroke="#c0b6ed" strokeOpacity=".15"/></g>;})}
    <path d="M0 38Q-20-45 8-126M-7-29L-63-76M-2-65L55-109" fill="none" stroke={purple?'#5f4d9c':'#33788d'} strokeWidth="3"/>
  </g>;
}
function Tree({right=false}: {right?:boolean}) {
  return <g transform={right?'translate(1440 0) scale(-1 1)':undefined}>
    <path d="M-75 1030Q-35 860 44 743Q84 636 63 544Q28 449 70 353Q119 268 105 164Q88 65 115-100L230-100Q185 54 211 169Q241 298 170 381Q130 456 156 551Q184 681 116 802Q72 883 104 1030Z" fill="url(#fl-trunk)"/>
    <path d="M120 420Q182 271 294 219Q374 178 458 63L489-30L439-55Q420 102 329 144Q182 198 159 313Z" fill="url(#fl-branch)"/>
    <path d="M171 267Q145 140 25 93L-25 107L-16 151Q105 162 139 320Z" fill="url(#fl-trunk)"/>
    <path d="M237 239Q284 146 274 52L294-18L318-9Q281 140 277 216Z" fill="#34215d"/>
    <path d="M359 166Q422 175 505 118L535 76L553 88Q497 175 406 185Z" fill="#37215f"/>
    {[0,1,2,3,4].map(i=><path key={i} d={`M${12+i*15} 977Q${115+i*12} 793 ${81+i*10} 649Q${32+i*18} 516 ${101+i*9} 361Q${171+i*9} 228 ${144+i*10} -35`} fill="none" stroke={i%2?'#6b3e9b':'#302454'} strokeWidth={i%2?3:6} opacity={i%2?.55:.7}/>)}
    <path d="M120 688Q141 659 118 623Q98 651 120 688Z" fill="none" stroke="#9161b8" strokeWidth="3" opacity=".5"/>
    {Array.from({length:18},(_,i)=>{const x=70+(i*47)%400,y=-18+(i*31)%125;return <g key={i} transform={`translate(${x} ${y}) rotate(${i*38})`}><path d="M0 0Q-54-5-58-53Q-7-45 0 0Z" fill={i%3?'#302958':'#503572'}/><path d="M0 0L-44-39" stroke="#8a63aa" strokeOpacity=".25"/></g>;})}
    {[0,1,2].map(i=><path key={i} d={`M${265+i*65} ${112-i*20}Q${255+i*65} ${195-i*10} ${290+i*65} ${235-i*19}`} fill="none" stroke="#6e4c8a" strokeWidth="2"/>)}
  </g>;
}
function Mushroom({x,y,size=1,coral=false}: {x:number;y:number;size?:number;coral?:boolean}) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    <ellipse cx="0" cy="5" rx="49" ry="12" fill="#151b38" opacity=".45"/>
    <path d="M-12 0Q-5-36-17-64L15-65Q8-32 19 0Z" fill="url(#fl-stem)"/>
    <ellipse cy="-60" rx="58" ry="14" fill={coral?'#ffa97d':'#d4a9e8'}/>
    <path d="M-64-64Q-47-124-7-131Q39-133 66-65Q20-83-5-66Q-32-48-64-64Z" fill={coral?'url(#fl-cap-coral)':'url(#fl-cap-purple)'}/>
    {[[-24,-95],[4,-112],[29,-88],[-40,-75],[1,-80]].map(([cx,cy],i)=><ellipse key={i} cx={cx} cy={cy} rx={i%2?5:7} ry="3" fill="#ffe5d2" opacity=".65" transform={`rotate(-12 ${cx} ${cy})`}/>)}
    <path d="M-46-61Q-8-46 44-62" fill="none" stroke="#ffe1be" strokeWidth="2" opacity=".65"/>
    <ellipse cy="-39" rx="39" ry="26" fill={coral?'#ffb374':'#cf87f4'} opacity=".10"/>
  </g>;
}
function Butterfly({index}: {index:number}) {
  const positions=[[1010,260],[810,460],[420,175],[1160,545],[650,645],[290,570],[1040,710],[640,300]];
  const [x,y]=positions[index];
  const size=[.55,.40,.32,.48,.35,.31,.40,.28][index];
  const colors=[['#fff0b8','#efa083','#aa62a7'],['#e7e4ff','#aa9ae1','#66569e'],['#d2ffff','#81c5d5','#4b7da9']][index%3];
  const gradient=`fl-butterfly-color-${index}`;
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    <g className="fl-butterfly" style={{animationDelay:`${index*-1.7}s`,animationDuration:`${13+index%5}s`}}>
      <svg x="-52" y="-55" width="104" height="110" viewBox="-52 -55 104 110" overflow="visible">
        <defs><radialGradient id={gradient} cx="80%" cy="65%" r="90%"><stop stopColor={colors[0]}/><stop offset=".45" stopColor={colors[1]}/><stop offset="1" stopColor={colors[2]}/></radialGradient></defs>
        {[-1,1].map(side=><g key={side} transform={side===1?'scale(-1 1)':undefined}>
          <g className="fl-wing-hinge" data-wing-index={index}>
            <path d="M-1-5C-12-24-24-48-40-43C-53-39-48-14-33-5C-50 1-42 23-29 25C-16 27-7 10-1-5Z" fill={`url(#${gradient})`} stroke={colors[2]} strokeWidth="1.1"/>
            <path d="M-2-4Q-21-21-39-37M-2-4Q-21-13-44-21M-2-4Q-21 4-33 20M-2-4Q-20-1-36 6" fill="none" stroke={colors[2]} strokeWidth=".8" strokeOpacity=".5"/>
            <path d="M-10-17Q-24-39-38-39M-12 10Q-23 25-31 20" fill="none" stroke={colors[0]} strokeWidth="1" opacity=".65"/>
            {[[-39,-28],[-35,-15],[-30,12]].map(([cx,cy],i)=><ellipse key={i} cx={cx} cy={cy} rx={i===2?3:2} ry="1.5" fill={colors[0]} opacity=".8"/>)}
          </g>
        </g>)}
        <ellipse cx="0" cy="-2" rx="2.1" ry="14" fill="#675772"/>
        <ellipse cx="0" cy="-14" rx="2.9" ry="3.5" fill="#554c66"/>
        <path d="M-1-16Q-8-26-8-20M1-16Q8-26 8-20" fill="none" stroke="#bcb3d1" strokeWidth=".8"/>
      </svg>
    </g>
  </g>;
}
function Definitions(){
  return <defs>
    <linearGradient id="fl-trunk" x2="1"><stop stopColor="#171d38"/><stop offset=".45" stopColor="#342358"/><stop offset=".72" stopColor="#523177"/><stop offset="1" stopColor="#8050ac"/></linearGradient>
    <linearGradient id="fl-branch" x2="1" y2="1"><stop stopColor="#251d43"/><stop offset=".7" stopColor="#49306c"/><stop offset="1" stopColor="#68448e"/></linearGradient>
    <linearGradient id="fl-shrub-blue" x2=".3" y2="1"><stop stopColor="#4796b2"/><stop offset=".45" stopColor="#305f91"/><stop offset="1" stopColor="#192b58"/></linearGradient>
    <linearGradient id="fl-shrub-purple" x2=".4" y2="1"><stop stopColor="#8e68b7"/><stop offset=".5" stopColor="#4e498c"/><stop offset="1" stopColor="#282754"/></linearGradient>
    <linearGradient id="fl-stem" x2="1"><stop stopColor="#9273a0"/><stop offset=".5" stopColor="#f3c5ad"/><stop offset="1" stopColor="#ac7dac"/></linearGradient>
    <linearGradient id="fl-cap-purple" x2=".4" y2="1"><stop stopColor="#b77de7"/><stop offset=".6" stopColor="#794fae"/><stop offset="1" stopColor="#473c79"/></linearGradient>
    <linearGradient id="fl-cap-coral" x2=".4" y2="1"><stop stopColor="#ffc08d"/><stop offset=".5" stopColor="#df8a96"/><stop offset="1" stopColor="#ab6396"/></linearGradient>
  </defs>;
}
export default function ForestParallax({enabled}: {enabled:boolean}) {
  const host=useRef<HTMLDivElement>(null),active=useRef(enabled);
  useEffect(()=>{active.current=enabled;},[enabled]);
  useEffect(()=>{
    const hero=host.current?.closest('.forest-hero') as HTMLElement|null;if(!hero)return;
    let frame=0,target=0,current=0,visible=true,last=performance.now(),wingTime=0;
    const wings=host.current?.querySelectorAll<SVGGElement>('[data-wing-index]');
    const scroll=()=>{const stage=hero.parentElement;if(!stage)return;target=Math.max(0,Math.min(1,-stage.getBoundingClientRect().top/Math.max(1,stage.offsetHeight-hero.offsetHeight)));};
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;});observer.observe(hero);
    const animate=(now:number)=>{frame=requestAnimationFrame(animate);const delta=Math.min((now-last)/1000,.05);last=now;if(!active.current||!visible)return;current+=(target-current)*(1-Math.exp(-delta*8));hero.style.setProperty('--depth-scroll',current.toFixed(5));
      wingTime+=delta;
      wings?.forEach(wing=>{
        const index=Number(wing.dataset.wingIndex);
        const fold=.20+.78*(.5+.5*Math.cos(wingTime*Math.PI*2/(.82+index*.055)+index*.7));
        // Local SVG origin is the body, not the center of the wing's bounds.
        // Mirroring is on the parent; both wings fold around the same hinge.
        wing.setAttribute('transform',`scale(${fold.toFixed(4)} 1)`);
      });};
    window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',scroll);scroll();frame=requestAnimationFrame(animate);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',scroll);window.removeEventListener('resize',scroll);};
  },[]);
  return <div ref={host} className="fl-layer-scene" aria-hidden="true">
    <svg className="fl-definitions" width="0" height="0"><Definitions/></svg>
    <svg className="fl-art-layer fl-bushes-back" viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMid slice"><Shrub x={230} y={820} size={.9}/><Shrub x={1200} y={800} size={1.1} purple/><Shrub x={1030} y={800} size={.6}/></svg>
    <svg className="fl-art-layer fl-trees" viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMid slice"><Tree/><Tree right/></svg>
    <svg className="fl-art-layer fl-bushes-front" viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMid slice"><Shrub x={80} y={1050} size={1.4} purple/><Shrub x={265} y={1020} size={.95}/><Shrub x={1380} y={1050} size={1.5}/><Shrub x={1175} y={1070} size={1.15} purple/></svg>
    <svg className="fl-art-layer fl-mushrooms" viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMid slice"><Mushroom x={170} y={950} size={1.15}/><Mushroom x={244} y={982} size={.58} coral/><Mushroom x={1295} y={950} size={1.1} coral/><Mushroom x={1220} y={980} size={.60}/><Mushroom x={350} y={1040} size={.8}/></svg>
    <svg className="fl-art-layer fl-butterflies" viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMid slice">{Array.from({length:8},(_,i)=><Butterfly key={i} index={i}/>)}</svg>
  </div>;
}
