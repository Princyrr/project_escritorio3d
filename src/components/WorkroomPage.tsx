import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Edges, OrbitControls, RoundedBox } from '@react-three/drei';
import { ArrowLeft, Monitor, RotateCcw, Sun } from 'lucide-react';
import * as THREE from 'three';

type Vec = [number, number, number];
function Block({ at, size, color, radius = .018, outline = false, rotation }: { at: Vec; size: Vec; color: string; radius?: number; outline?: boolean; rotation?: Vec }) {
  return <RoundedBox args={size} position={at} radius={radius} smoothness={3} rotation={rotation} castShadow receiveShadow><meshStandardMaterial color={color} roughness={.68} />{outline && <Edges threshold={30} color="#35342f" />}</RoundedBox>;
}
function Bar({ a, b, r = .02, color = '#424747' }: { a: Vec; b: Vec; r?: number; color?: string }) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
  return <mesh position={start.add(end).multiplyScalar(.5)} quaternion={q} castShadow><cylinderGeometry args={[r, r, new THREE.Vector3(...a).distanceTo(new THREE.Vector3(...b)), 12]} /><meshStandardMaterial color={color} roughness={.5} metalness={.15} /></mesh>;
}
function useDrawing(kind: 'wood' | 'code' | 'report' | 'mesh' | 'paper') {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');canvas.width = 768;canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    if (kind === 'wood') {
      ctx.fillStyle = '#cda67f';ctx.fillRect(0,0,768,512);
      for(let i=0;i<140;i++){const y=i*4;ctx.strokeStyle=i%3?'rgba(102,67,42,.12)':'rgba(244,224,190,.35)';ctx.lineWidth=i%3?1:2;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(240,y+Math.sin(i)*14,500,y-8,768,y+Math.sin(i*2)*10);ctx.stroke();}
    } else if(kind === 'mesh') {
      ctx.clearRect(0,0,768,512);ctx.strokeStyle='#252a2c';ctx.lineWidth=2;
      for(let x=0;x<768;x+=9){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,512);ctx.stroke();}for(let y=0;y<512;y+=9){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(768,y);ctx.stroke();}
    } else if(kind === 'paper') {
      ctx.fillStyle='#faf9ef';ctx.fillRect(0,0,768,512);ctx.fillStyle='#44494c';ctx.font='bold 27px sans-serif';ctx.fillText('OBSERVATÓRIO / NOTAS',45,65);
      for(let i=0;i<13;i++){ctx.strokeStyle='#9aa2a6';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(40,105+i*29);ctx.lineTo(720,105+i*29);ctx.stroke();ctx.fillStyle='#687181';ctx.font='italic 18px serif';ctx.fillText(['Planejamento e pesquisa','Análise dos dados da Paraíba','Novas conexões e possibilidades'][i%3],53,101+i*29);}
    } else {
      const dark=kind==='code';ctx.fillStyle=dark?'#23282d':'#eef0ee';ctx.fillRect(0,0,768,512);
      ctx.fillStyle=dark?'#343b42':'#d5dbdf';ctx.fillRect(0,0,768,33);ctx.fillStyle='#456b8c';ctx.fillRect(0,489,768,23);
      ctx.fillStyle=dark?'#191f24':'#dce2e5';ctx.fillRect(0,33,145,456);
      ctx.font='14px monospace';for(let i=0;i<17;i++){ctx.fillStyle='#919da5';ctx.fillText(i%3?'  arquivos':'⌄ projeto',12,62+i*23);}
      if(dark){for(let i=0;i<24;i++){ctx.fillStyle=['#b9c5cc','#78b8c1','#cc9d7b','#b69aca'][i%4];ctx.font='14px monospace';ctx.fillText(['import { dados } from "paraiba";','  const resultado = analisar(dados);','    return { territorio, industria };','  // conhecimento para decidir'][i%4],165+(i%4)*13,60+i*17);}}
      else {ctx.fillStyle='#394b58';ctx.font='bold 24px sans-serif';ctx.fillText('Inteligência de dados',177,89);ctx.font='14px sans-serif';ctx.fillText('Observatório da Indústria da Paraíba',178,118);for(let i=0;i<10;i++){ctx.fillStyle=i%2?'#b5c3cc':'#c9d3d9';ctx.fillRect(178,150+i*24,315-(i%3)*44,7);}ctx.fillStyle='#243848';ctx.fillRect(528,151,207,275);for(let i=0;i<6;i++){ctx.fillStyle=['#55a1b1','#afc8d8','#bb88ae'][i%3];ctx.fillRect(547+i*27,390-i*30,16,20+i*30);}}
    }
    const result=new THREE.CanvasTexture(canvas);result.colorSpace=THREE.SRGBColorSpace;
    if(kind==='wood'){result.wrapS=result.wrapT=THREE.RepeatWrapping;result.repeat.set(1.5,1);}
    return result;
  },[kind]);
  useEffect(()=>()=>texture.dispose(),[texture]);return texture;
}
function Display({ at, rotation = 0, report = false, on }: { at: Vec; rotation?: number; report?: boolean; on: boolean }) {
  const screen=useDrawing(report?'report':'code');const light=useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({clock})=>{if(light.current)light.current.opacity=on?.035+Math.sin(clock.elapsedTime*1.5)*.012:0;});
  return <group position={at} rotation={[0,rotation,0]}>
    <Block at={[0,.025,0]} size={[.27,.025,.22]} color="#25292c" radius={.012}/>
    <Bar a={[0,.03,-.025]} b={[0,.21,-.05]} r={.032}/>
    <group position={[0,.43,-.055]} rotation={[-.045,0,0]}>
      <Block at={[0,0,0]} size={[.93,.57,.065]} color="#262b2e" radius={.025} outline/>
      <mesh position={[0,.008,.034]}><planeGeometry args={[.856,.482]}/>{on?<meshBasicMaterial map={screen} toneMapped={false}/>:<meshStandardMaterial color="#1c2023" roughness={.38}/>}</mesh>
      <mesh position={[0,.008,.036]}><planeGeometry args={[.856,.482]}/><meshBasicMaterial ref={light} color="#b5d9ef" transparent depthWrite={false} opacity={0}/></mesh>
      <Block at={[0,-.263,.035]} size={[.08,.014,.003]} color="#9ba2a4" radius={.001}/>
      <mesh position={[.405,-.26,.036]}><sphereGeometry args={[.003,8,8]}/><meshBasicMaterial color={on?'#94d5ec':'#7e8382'}/></mesh>
    </group>
  </group>;
}
function Keyboard() {
  return <group rotation={[-.04,0,0]}><Block at={[0,.024,0]} size={[.69,.038,.25]} color="#292e31" radius={.014}/>{Array.from({length:5},(_,row)=>Array.from({length:15},(_,col)=><Block key={`${row}-${col}`} at={[-.313+col*.044,.047,-.095+row*.043]} size={[.034,.012,.031]} color={(row+col)%3?'#343b3e':'#434a4c'} radius={.003}/>))}</group>;
}
function DeskChair({ at, rotation=0 }: { at: Vec; rotation?:number }) {
  const mesh=useDrawing('mesh');
  return <group position={at} rotation={[0,rotation,0]}>
    <Block at={[0,.68,0]} size={[.66,.14,.65]} color="#303536" radius={.065}/>
    <group position={[0,1.08,.28]} rotation={[-.13,0,0]}>
      <Block at={[-.30,0,0]} size={[.035,.73,.05]} color="#303638"/>
      <Block at={[.30,0,0]} size={[.035,.73,.05]} color="#303638"/>
      <Block at={[0,.35,0]} size={[.60,.04,.05]} color="#303638"/>
      <Block at={[0,-.35,0]} size={[.60,.04,.05]} color="#303638"/>
      <mesh><planeGeometry args={[.57,.69]}/><meshStandardMaterial map={mesh} transparent alphaTest={.1} side={THREE.DoubleSide} color="#464d4c"/></mesh>
      <Bar a={[0,.33,0]} b={[0,.53,0]} r={.022}/>
      <Block at={[0,.61,0]} size={[.45,.19,.085]} color="#343a3b" radius={.04}/>
    </group>
    {[-1,1].map(side=><group key={side}><Bar a={[side*.26,.64,.13]} b={[side*.40,.95,.08]} r={.023}/><Block at={[side*.40,.96,-.02]} size={[.14,.055,.40]} color="#343a3c" radius={.025}/></group>)}
    <Bar a={[0,.17,0]} b={[0,.63,0]} r={.04} color="#a0a8a9"/>
    {Array.from({length:5},(_,i)=>{const a=i*Math.PI*2/5,x=Math.sin(a)*.39,z=Math.cos(a)*.39;return <group key={i}><Bar a={[0,.23,0]} b={[x,.12,z]} r={.028}/><mesh position={[x,.075,z]} rotation={[Math.PI/2,a,0]}><cylinderGeometry args={[.064,.064,.07,16]}/><meshStandardMaterial color="#262b2d"/></mesh></group>;})}
  </group>;
}
function Workstation({ at, reverse=false, dual=false, on }: { at: Vec; reverse?:boolean; dual?:boolean; on:boolean }) {
  const wood=useDrawing('wood');const paper=useDrawing('paper');
  return <group position={at} rotation={[0,reverse?Math.PI:0,0]}>
    <RoundedBox args={[2.48,.095,1.47]} position={[0,1.26,0]} radius={.025} smoothness={3} castShadow receiveShadow><meshStandardMaterial map={wood} roughness={.64}/><Edges color="#605849"/></RoundedBox>
    {[-1,1].map(side=><Block key={side} at={[side*1.12,.62,-.04]} size={[.075,1.20,1.28]} color="#6e716d" radius={.012}/>)}
    <Block at={[0,.81,-.59]} size={[2.22,.65,.035]} color="#6e716d"/>
    <Display at={[dual?-.30:0,1.31,-.29]} report={dual} on={on}/>
    {dual&&<Display at={[.67,1.31,-.27]} rotation={-.18} on={on}/>}
    <group position={[-.04,1.313,.35]}><Keyboard/></group>
    <Block at={[.63,1.316,.36]} size={[.43,.009,.36]} color="#285378" radius={.012}/>
    <mesh position={[.64,1.35,.35]} scale={[.067,.035,.10]} castShadow><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color="#282f34" roughness={.45}/></mesh>
    {!dual&&<group position={[.91,1.31,-.16]}>
      <Block at={[0,.35,0]} size={[.30,.70,.61]} color="#303535" outline/>
      <Block at={[0,.37,.313]} size={[.265,.60,.012]} color="#252c2d"/>
      {[0,1].map(i=><Block key={i} at={[0,.55-i*.095,.325]} size={[.21,.04,.009]} color="#454c4e" radius={.002}/>)}
      <mesh position={[.065,.39,.329]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.012,.012,.005,16]}/><meshStandardMaterial color="#b3bab8"/></mesh>
      {Array.from({length:7},(_,i)=><Block key={i} at={[0,.08+i*.027,.326]} size={[.20,.007,.008]} color="#121a1d" radius={.001}/>)}
    </group>}
    {!reverse&&<group position={[-.89,1.32,.34]} rotation={[0,.12,0]}>
      {[0,1,2].map(i=><mesh key={i} position={[i*.008,i*.007,0]} rotation={[-Math.PI/2,0,i*.03]} castShadow><planeGeometry args={[.40,.46]}/><meshStandardMaterial map={paper} side={THREE.DoubleSide}/></mesh>)}
      <Bar a={[-.13,.04,.08]} b={[.15,.04,-.04]} r={.008} color="#646868"/>
    </group>}
    {dual&&<group position={[1,1.32,.40]} rotation={[0,-.2,0]}><Block at={[0,.04,0]} size={[.30,.08,.25]} color="#33393a"/><Block at={[0,.10,0]} size={[.32,.08,.10]} color="#242a2b" radius={.035}/></group>}
    <DeskChair at={[0,0,1.05]} rotation={reverse?-.08:.10}/>
    <Bar a={[.05,1.50,-.36]} b={[.15,1.21,-.56]} r={.008} color="#292d32"/>
  </group>;
}
function Cobogos() {
  const cell = useMemo(()=>{
    const shape=new THREE.Shape();shape.moveTo(-.225,-.225);shape.lineTo(.225,-.225);shape.lineTo(.225,.225);shape.lineTo(-.225,.225);shape.closePath();
    const hole=new THREE.Path();hole.moveTo(0,-.165);hole.lineTo(-.165,0);hole.lineTo(0,.165);hole.lineTo(.165,0);hole.closePath();shape.holes.push(hole);
    return new THREE.ExtrudeGeometry(shape,{depth:.08,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.007,bevelThickness:.007});
  },[]);
  useEffect(()=>()=>cell.dispose(),[cell]);
  return <group position={[3.48,.1,-.1]} rotation={[0,-Math.PI/2,0]}>
    {Array.from({length:13},(_,col)=>Array.from({length:9},(_,row)=><mesh key={`${row}-${col}`} geometry={cell} position={[(col-6)*.46,.28+row*.46,-.22]} castShadow receiveShadow><meshStandardMaterial color={(row+col)%3?'#b57856':'#c38a65'} roughness={.95}/></mesh>))}
    {[-2.95,0,2.95].map(x=><Block key={x} at={[x,2.17,.05]} size={[.055,4.34,.08]} color="#c4cccb"/>)}
    {[.06,1.21,2.5,4.30].map(y=><Block key={y} at={[0,y,.05]} size={[5.96,.05,.08]} color="#d4d9d7"/>)}
    <mesh position={[0,2.2,-.055]}><planeGeometry args={[5.9,4.2]}/><meshPhysicalMaterial color="#c8e3e4" transparent opacity={.075} roughness={.1} depthWrite={false}/></mesh>
    <Block at={[0,.75,.15]} size={[5.95,.09,.25]} color="#dadcd6"/>
    <Block at={[.20,3.98,.39]} size={[2.20,.43,.36]} color="#e6e8e3" radius={.08} outline/>
    <Block at={[.20,3.83,.58]} size={[1.92,.035,.035]} color="#5a6261" radius={.005}/>
  </group>;
}
function Room({ on, warm }: { on: boolean; warm:boolean }) {
  return <>
    <color attach="background" args={['#e8e9e4']}/><fog attach="fog" args={['#e8e9e4',18,36]}/>
    <ambientLight intensity={.9}/><hemisphereLight args={['#eff5f2','#a2a299',1.5]}/>
    <directionalLight position={[7,7,-1]} intensity={warm?3:1.5} color={warm?'#fff1d4':'#d9ecff'} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-normalBias={.035}/>
    <directionalLight position={[-4,5,6]} intensity={1.0} color="#e1edff"/>
    <Block at={[0,-.08,0]} size={[7.4,.15,6.4]} color="#d8d9d3" outline/>
    <gridHelper args={[7.2,12,'#bfc3be','#bfc3be']} position={[0,.002,0]}/>
    <Block at={[0,2.15,-3.06]} size={[7.25,4.30,.13]} color="#eeeee8"/>
    <Block at={[0,.10,-2.97]} size={[7.25,.14,.035]} color="#bfc4bf"/>
    <Cobogos/>
    <Workstation at={[-1.40,0,.15]} on={on}/><Workstation at={[1.13,0,.15]} dual on={on}/>
    <Workstation at={[-1.40,0,-1.36]} reverse on={on}/><Workstation at={[1.13,0,-1.36]} reverse on={on}/>
    <Block at={[-.13,1.40,-.60]} size={[5.08,.70,.055]} color="#656965" outline/>
    <Block at={[-.13,1.41,-.60]} size={[.055,.72,2.98]} color="#747873" outline/>
    <Block at={[-2.70,1.30,-.60]} size={[.045,.90,2.98]} color="#767b76" outline/>
    <mesh position={[-3.13,.25,1.35]} castShadow><cylinderGeometry args={[.24,.18,.48,32]}/><meshStandardMaterial color="#565d5b" roughness={.9}/></mesh>
    <mesh position={[-3.13,.49,1.35]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.235,.024,12,40]}/><meshStandardMaterial color="#282f2e"/></mesh>
    <ContactShadows position={[0,.008,0]} scale={12} far={4} blur={2.2} opacity={.28} resolution={256} color="#646457"/>
  </>;
}
class RoomBoundary extends Component<{children:ReactNode},{failed:boolean}>{
  state={failed:false};static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<p className="workroom-error">Não foi possível abrir o ambiente. Verifique a aceleração gráfica do navegador.</p>:this.props.children;}
}
export default function WorkroomPage(){
  const [on,setOn]=useState(true),[warm,setWarm]=useState(true),[view,setView]=useState(0);
  return <main className="workroom-page">
    <header className="workroom-header"><a href="#/"><ArrowLeft size={16}/> Voltar ao início</a><span>OBSERVATÓRIO <b>/ AMBIENTES</b></span><span className="workroom-tag">SALA DE TRABALHO 3D</span></header>
    <section className="workroom-heading"><p>ONDE O CONHECIMENTO É CONSTRUÍDO</p><h1>Espaço de <em>conexões.</em></h1><span>Estações de trabalho, luz natural e novas perspectivas.</span></section>
    <div className="workroom-canvas" role="img" aria-label="Sala de trabalho em 3D com quatro estações, computadores, cadeiras de rodinhas e janela com cobogós de terracota">
      <RoomBoundary><Canvas key={view} shadows camera={{position:[-6.2,4.7,8.7],fov:38,near:.1,far:60}} dpr={[1,1.5]} fallback={<p>Visualização 3D indisponível.</p>}>
        <Room on={on} warm={warm}/><OrbitControls makeDefault target={[0,1.6,-.3]} minDistance={4.5} maxDistance={17} maxPolarAngle={Math.PI/2-.04} minPolarAngle={.28} minAzimuthAngle={-.85} maxAzimuthAngle={1.2} enablePan={false}/>
      </Canvas></RoomBoundary>
    </div>
    <footer className="workroom-footer"><p>Arraste para explorar a sala · Use o zoom para ver os detalhes</p><div><button onClick={()=>setOn(v=>!v)} aria-pressed={on}><Monitor size={15}/>{on?'Desligar monitores':'Ligar monitores'}</button><button onClick={()=>setWarm(v=>!v)} aria-pressed={warm}><Sun size={15}/>{warm?'Luz neutra':'Luz quente'}</button><button onClick={()=>setView(v=>v+1)}><RotateCcw size={15}/>Restaurar visão</button></div></footer>
  </main>;
}
