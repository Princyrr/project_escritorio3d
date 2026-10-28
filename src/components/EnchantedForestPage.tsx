import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Flower2, Moon, Pause, Play, Sparkles, Sun, Sunset, Wind, X } from 'lucide-react';
import forestArt from '../assets/enchanted-forest.png';
import './enchanted-forest.css';
import ForestParallax from './ForestParallax';

const ATMOSPHERES = [
  {name:'Aurora', icon:Sun, note:'O bosque desperta em tons de pêssego e luz.'},
  {name:'Crepúsculo', icon:Sunset, note:'Entre o azul e o violeta, a magia encontra seu lugar.'},
  {name:'Noite', icon:Moon, note:'As janelas se iluminam. Siga os pequenos pontos de luz.'},
];
const PLACES = [
  {title:'A porta do possível',tag:'UM NOVO COMEÇO',position:'14% 50%',text:'Entre raízes antigas e flores luminosas, cada caminho guarda uma nova descoberta.',detail:'Há caminhos que só aparecem quando desaceleramos. Observe as raízes, as flores e as pequenas luzes: elas apontam para uma clareira onde toda história pode começar de novo.'},
  {title:'Pequenas maravilhas',tag:'OLHE MAIS DE PERTO',position:'48% 74%',text:'Siga as luzes que dançam entre as folhas. O extraordinário mora nos detalhes.',detail:'No bosque, nada é pequeno demais para ter importância. Uma folha que brilha, uma borboleta que passa, um reflexo no caminho. São essas pequenas maravilhas que fazem a paisagem ganhar vida.'},
  {title:'Um refúgio de luz',tag:'UM LUGAR PARA FICAR',position:'87% 48%',text:'Uma janela acesa, um caminho acolhedor e um mundo inteiro para imaginar.',detail:'Depois de atravessar a clareira, o caminho coral leva a uma pequena casa. Suas janelas iluminadas anunciam um refúgio tranquilo, protegido pelos galhos de árvores antigas.'},
];
export default function EnchantedForestPage() {
  const [atmosphere,setAtmosphere]=useState(1);
  const [playing,setPlaying]=useState(()=>!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [wind,setWind]=useState(true);
  const [selected,setSelected]=useState<number|null>(null);
  const [burst,setBurst]=useState<{x:number;y:number;id:number}|null>(null);
  const hero=useRef<HTMLElement>(null),dialog=useRef<HTMLDialogElement>(null);
  const reduced=useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{window.scrollTo(0,0);},[]);
  useEffect(()=>{
    if(selected!==null)dialog.current?.showModal();
    else if(dialog.current?.open)dialog.current.close();
  },[selected]);
  useEffect(()=>{
    if(!burst)return;const timer=window.setTimeout(()=>setBurst(null),1200);return()=>clearTimeout(timer);
  },[burst]);
  return <main className={`forest-page forest-atmosphere-${atmosphere}${playing?'':' forest-paused'}${wind?'':' forest-still'}`}>
    <header className="forest-header">
      <a href="#/" className="forest-back" aria-label="Voltar à página principal"><ArrowLeft size={16}/></a>
      <a className="forest-brand" href="#/bosque"><span><Flower2 size={25}/></span><span>Lúmina<small>UM BOSQUE DE POSSIBILIDADES</small></span></a>
      <nav aria-label="Navegação do bosque"><a href="#forest-world" onClick={e=>{e.preventDefault();document.getElementById('forest-world')?.scrollIntoView({behavior:reduced.current?'auto':'smooth'});}}>O bosque</a><a href="#forest-places" onClick={e=>{e.preventDefault();document.getElementById('forest-places')?.scrollIntoView({behavior:reduced.current?'auto':'smooth'});}}>Refúgios</a><a href="#forest-details" onClick={e=>{e.preventDefault();document.getElementById('forest-details')?.scrollIntoView({behavior:reduced.current?'auto':'smooth'});}}>Descobertas</a></nav>
      <button className="forest-pill forest-header-cta" onClick={()=>document.getElementById('forest-places')?.scrollIntoView({behavior:reduced.current?'auto':'smooth'})}>Explore a magia <ArrowRight size={14}/></button>
    </header>
    <div className="forest-parallax-stage">
    <section id="forest-world" ref={hero} className="forest-hero" aria-label="Floresta encantada interativa" onPointerMove={e=>{
      if(reduced.current||!playing)return;
      const box=e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty('--forest-x',`${(e.clientX-box.left)/box.width*2-1}`);
      e.currentTarget.style.setProperty('--forest-y',`${(e.clientY-box.top)/box.height*2-1}`);
    }} onPointerLeave={()=>{hero.current?.style.setProperty('--forest-x','0');hero.current?.style.setProperty('--forest-y','0');}}>
      <img src={forestArt} className="forest-art" alt="Floresta encantada com árvores violetas, flores luminosas, céu rosado e uma casinha iluminada ao fim de um caminho coral" fetchPriority="high"/>
      <ForestParallax enabled={playing && wind && !reduced.current} />
      <div className="forest-depth-mist forest-depth-mist-far" aria-hidden="true"/><div className="forest-depth-mist forest-depth-mist-near" aria-hidden="true"/>
      <div className="forest-shade"/>
      <div className="forest-aura forest-aura-one"/><div className="forest-aura forest-aura-two"/>
      <div className="forest-particles" aria-hidden="true">{Array.from({length:42},(_,i)=><i key={i} style={{left:`${4+(i*37)%93}%`,top:`${8+(i*23)%83}%`,animationDelay:`${i*-.67}s`,animationDuration:`${5+i%6}s`,'--particle-size':`${i%7===0?5:2}px`,'--drift':`${(i%2?1:-1)*(12+i%23)}px`} as CSSProperties}/>)}</div>
      <button type="button" className="forest-magic-area" aria-label="Espalhar luzes mágicas pela floresta" onClick={e=>{const box=e.currentTarget.getBoundingClientRect();setBurst({x:e.clientX?e.clientX-box.left:box.width/2,y:e.clientY?e.clientY-box.top:box.height/2,id:Date.now()});}}/>
      {burst&&<div key={burst.id} className="forest-burst" style={{left:burst.x,top:burst.y}} aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{'--angle':`${i*30}deg`,'--distance':`${45+(i%3)*25}px`} as CSSProperties}/>)}</div>}
      <div className="forest-hero-copy"><span className="forest-eyebrow"><i/> ENTRE O REAL E O IMAGINÁRIO</span><h1>Existe um mundo<br/>esperando <em>por você.</em></h1><p>Siga a luz. Desperte a curiosidade.<br/>Descubra a beleza de se perder um pouco.</p><button className="forest-pill" onClick={()=>document.getElementById('forest-places')?.scrollIntoView({behavior:reduced.current?'auto':'smooth'})}>Comece a explorar <ArrowRight size={15}/></button></div>
      <div className="forest-controls" role="group" aria-label="Efeitos da floresta">
        {ATMOSPHERES.map(({name,icon:Icon},i)=><button key={name} type="button" onClick={()=>setAtmosphere(i)} aria-pressed={i===atmosphere} aria-label={name} title={name}><Icon size={18}/><span>{name}</span></button>)}
        <span className="forest-controls-divider"/>
        <button type="button" onClick={()=>setWind(v=>!v)} aria-pressed={wind} aria-label="Paralaxe em camadas" title="Paralaxe em camadas"><Wind size={18}/></button>
        <button type="button" onClick={()=>setPlaying(v=>!v)} aria-pressed={!playing} aria-label={playing?'Pausar efeitos':'Retomar efeitos'} title={playing?'Pausar efeitos':'Retomar efeitos'}>{playing?<Pause size={17}/>:<Play size={17}/>}</button>
      </div>
      <span className="forest-mood" aria-live="polite">{ATMOSPHERES[atmosphere].note}</span>
      <span className="forest-hero-number">01 / O BOSQUE</span>
    </section>
    </div>
    <section className="forest-places" id="forest-places">
      <div className="forest-section-heading"><p className="forest-eyebrow">CADA CAMINHO, UMA DESCOBERTA</p><h2>Um lugar para <em>se encantar.</em></h2><p>Escolha por onde começar. A curiosidade cuida do resto.</p></div>
      <div className="forest-place-grid">{PLACES.map((place,i)=><article key={place.title} className="forest-place-card">
        <button className="forest-place-art" onClick={()=>setSelected(i)} aria-label={`Conhecer ${place.title}`}><img src={forestArt} alt="" loading="lazy" style={{objectPosition:place.position}}/><span>{String(i+1).padStart(2,'0')}</span><i><ArrowRight size={22}/></i></button>
        <p className="forest-eyebrow">{place.tag}</p><h3>{place.title}</h3><p>{place.text}</p><button className="forest-text-link" onClick={()=>setSelected(i)}>Descobrir esse caminho <ArrowRight size={14}/></button>
      </article>)}</div>
    </section>
    <section className="forest-details" id="forest-details">
      <div className="forest-manifesto"><span className="forest-orbit"><Sparkles size={31}/></span><p className="forest-eyebrow">UM POUCO DE MAGIA FAZ BEM</p><h2>Deixe a imaginação<br/><em>abrir caminhos.</em></h2><p>Um bosque para observar, explorar e descobrir. Mude a luz, acompanhe as pequenas criaturas e encontre seu próprio ritmo.</p></div>
      <div className="forest-detail-column"><span>01</span><h3>A luz transforma tudo.</h3><p>Da aurora à noite, o mesmo lugar revela novas cores. Experimente as atmosferas no painel do bosque.</p><div className="forest-swatches"><i/><i/><i/><i/></div><span>02</span><h3>O detalhe faz a diferença.</h3><p>Flores, caminhos, janelas acesas e luzes flutuantes compõem uma paisagem cheia de pequenas descobertas.</p></div>
      <div className="forest-detail-column"><span>03</span><h3>A magia está nas suas mãos.</h3><p>Mova o cursor ou role a página para sentir a profundidade das camadas. Toque na floresta para espalhar um pequeno rastro de luz.</p><button className="forest-pill forest-pill-purple" onClick={()=>document.getElementById('forest-world')?.scrollIntoView({behavior:reduced.current?'auto':'smooth'})}>Voltar ao bosque <ArrowRight size={14}/></button><p className="forest-fineprint">Uma experiência visual interativa.<br/>Feita para explorar sem pressa.</p></div>
    </section>
    <footer className="forest-footer"><a href="#/" className="forest-brand"><Flower2 size={22}/><span>Lúmina</span></a><p>Um universo de pequenas possibilidades.</p><a href="#/">Voltar aos cenários <ArrowRight size={14}/></a></footer>
    <dialog className="forest-dialog" ref={dialog} onClose={()=>setSelected(null)} onClick={e=>{if(e.target===e.currentTarget)setSelected(null);}} aria-labelledby="forest-dialog-title">
      {selected!==null&&<><button className="forest-dialog-close" onClick={()=>setSelected(null)} aria-label="Fechar refúgio"><X size={20}/></button><img src={forestArt} alt="Detalhe da floresta encantada" style={{objectPosition:PLACES[selected].position}}/><div><p className="forest-eyebrow">{PLACES[selected].tag}</p><h2 id="forest-dialog-title">{PLACES[selected].title}</h2><p>{PLACES[selected].detail}</p><button className="forest-text-link" onClick={()=>setSelected(null)}>Continuar explorando <ArrowRight size={15}/></button></div></>}
    </dialog>
  </main>;
}
