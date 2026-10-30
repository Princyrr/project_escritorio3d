import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type Vec = [number, number, number];
const ivory = '#fffcf2';
function Clay({ at, size, color = ivory, rotation = [0,0,0] }: { at: Vec; size: Vec; color?: string; rotation?: Vec }) {
  return <mesh position={at} scale={size} rotation={rotation} castShadow receiveShadow><sphereGeometry args={[1,32,24]}/><meshStandardMaterial color={color} roughness={.57}/></mesh>;
}

/** Rounded, tapering volume following a curve: hair locks, feathers and the bent hat. */
function sculptTube(points: Vec[], radii: number[], flatness = 1) {
  const curve = new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'centripetal');
  const frames = curve.computeFrenetFrames(48,false), positions: number[] = [], indices: number[] = [];
  for(let row=0;row<=48;row++) {
    const t=row/48, point=curve.getPointAt(t), u=t*(radii.length-1), n=Math.min(radii.length-2,Math.floor(u));
    const radius=THREE.MathUtils.lerp(radii[n],radii[n+1],u-n);
    for(let col=0;col<=20;col++) {
      const angle=col/20*Math.PI*2;
      const v=point.clone().addScaledVector(frames.normals[row],Math.cos(angle)*radius).addScaledVector(frames.binormals[row],Math.sin(angle)*radius*flatness);
      positions.push(v.x,v.y,v.z);
      if(row<48&&col<20){const k=row*21+col;indices.push(k,k+1,k+21,k+1,k+22,k+21);}
    }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
function Lock({ points, radii, color = ivory, flatness = 1 }: {points: Vec[];radii: number[];color?:string;flatness?:number}) {
  const signature=JSON.stringify([points,radii,flatness]);
  const geometry=useMemo(()=>sculptTube(points,radii,flatness),[signature]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color={color} roughness={.56}/></mesh>;
}
function rod(points: Vec[], radius: number) { return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),40,radius,10,false); }
function roundRectangle(shape: THREE.Shape | THREE.Path, x:number,y:number,w:number,h:number,r:number) {
  shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);
}

export function CottageWizard() {
  const {robe,hat,brim,beard,buckle,staff,strap}=useMemo(()=>{
    const profile=new THREE.CatmullRomCurve3([[0,0],[.28,0],[.35,.035],[.37,.10],[.33,.35],[.27,.61],[.15,.72],[0,.72]].map(([r,y])=>new THREE.Vector3(r,y,0)));
    const robe=new THREE.LatheGeometry(profile.getPoints(60).map(p=>new THREE.Vector2(Math.max(0,p.x),p.y)),56);
    const hat=sculptTube([[0,.02,0],[-.01,.28,0],[-.09,.53,0],[-.22,.72,.01],[-.34,.73,.025]],[.345,.29,.20,.095,0]);
    const vertices:number[]=[],indices:number[]=[];
    // The brim curls continuously on both sides, with a rounded closed edge.
    for(let layer=0;layer<2;layer++)for(let row=0;row<=12;row++)for(let col=0;col<=80;col++){
      const r=row/12,a=col/80*Math.PI*2;
      vertices.push(Math.cos(a)*.54*r,.035+Math.pow(r,3)*(.055*Math.cos(2*a)+.028*Math.sin(a))+(layer?-.023:.023),Math.sin(a)*.43*r);
      if(row<12&&col<80){const k=layer*13*81+row*81+col; if(layer)indices.push(k,k+81,k+1,k+1,k+81,k+82);else indices.push(k,k+1,k+81,k+1,k+82,k+81);}
      if(!layer&&row===12&&col<80){const k=row*81+col,b=k+13*81;indices.push(k,b,k+1,k+1,b,b+1);}
    }
    const brim=new THREE.BufferGeometry();brim.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));brim.setIndex(indices);brim.computeVertexNormals();
    const beardProfile=new THREE.CatmullRomCurve3([[0,-.35],[.075,-.29],[.23,-.10],[.34,.09],[.32,.20],[.16,.23],[0,.20]].map(([r,y])=>new THREE.Vector3(r,y,0)));
    const beard=new THREE.LatheGeometry(beardProfile.getPoints(56).map(p=>new THREE.Vector2(Math.max(0,p.x),p.y)),48);
    const frame=new THREE.Shape();roundRectangle(frame,-.08,-.06,.16,.12,.012);
    const hole=new THREE.Path();roundRectangle(hole,-.052,-.034,.104,.068,.005);frame.holes.push(hole);
    const buckle=new THREE.ExtrudeGeometry(frame,{depth:.012,bevelEnabled:true,bevelSize:.006,bevelThickness:.004,bevelSegments:3,steps:1});
    const spiral:Vec[]=[[.44,.04,.14],[.49,.62,.14],[.54,1.17,.14]];
    for(let i=0;i<=42;i++){const t=i/42*Math.PI*3.45,r=.095*(1-i/48);spiral.push([.55+Math.cos(t)*r,1.26+Math.sin(t)*r,.14]);}
    const staff=rod(spiral,.019);
    const strap=rod([[-.23,.83,.11],[-.14,.70,.29],[-.19,.52,.32],[-.29,.38,.27]],.025);
    return {robe,hat,brim,beard,buckle,staff,strap};
  },[]);
  useEffect(()=>()=>{robe.dispose();hat.dispose();brim.dispose();beard.dispose();buckle.dispose();staff.dispose();strap.dispose();},[robe,hat,brim,beard,buckle,staff,strap]);
  return <group position={[1.47,.24,2.23]} rotation={[0,-.10,0]} scale={.98}>
    {[-1,1].map(side=><group key={side}>
      <Clay at={[side*.15,.16,.01]} size={[.09,.15,.10]} color="#775242"/>
      <Clay at={[side*.15,.075,.09]} size={[.125,.085,.19]} color="#6a4c40" rotation={[0,side*-.10,0]}/>
      <Clay at={[side*.15,.105,.19]} size={[.115,.045,.12]} color="#80604b"/>
    </group>)}
    <mesh geometry={robe} position={[0,.22,0]} castShadow receiveShadow><meshStandardMaterial color="#4d8da9" roughness={.64}/></mesh>
    <Clay at={[-.29,.64,.02]} size={[.115,.20,.13]} color="#4d8da9" rotation={[0,0,-.24]}/>
    <Clay at={[-.34,.46,.12]} size={[.078,.09,.075]} color="#ffdbb9"/>
    <Clay at={[.31,.68,.04]} size={[.115,.19,.12]} color="#4d8da9" rotation={[0,0,-.36]}/>
    <Clay at={[.39,.56,.16]} size={[.074,.085,.075]} color="#ffdbb9"/>
    <Clay at={[.35,.58,.22]} size={[.035,.052,.04]} color="#ffe2c2" rotation={[0,0,-.4]}/>
    <Clay at={[0,.97,.045]} size={[.323,.295,.275]} color="#ffe2c2"/>
    {[-1,1].map(side=><group key={side}>
      <Clay at={[side*.108,.990,.304]} size={[.024,.037,.019]} color="#302c32"/>
      <Clay at={[side*.108-.006,1.000,.320]} size={[.007,.009,.004]} color="#fffaf0"/>
      <Clay at={[side*.214,.913,.280]} size={[.057,.042,.020]} color="#efb3a7"/>
      <Lock points={[[side*.055,1.045,.290],[side*.11,1.054,.296],[side*.17,1.040,.271]]} radii={[.004,.021,.002]}/>
      <Lock points={[[side*.225,1.08,.06],[side*.26,.92,.15],[side*.30,.82,.18],[side*.25,.75,.21]]} radii={[.05,.058,.035,0]} color="#f5f1e6"/>
      <Lock points={[[side*.018,.884,.341],[side*.105,.879,.363],[side*.19,.848,.338],[side*.22,.882,.288]]} radii={[.02,.058,.042,0]}/>
    </group>)}
    <mesh geometry={beard} position={[0,.612,.277]} scale={[1,1,.62]} castShadow receiveShadow><meshStandardMaterial color={ivory} roughness={.62}/></mesh>
    {[-2,-1,0,1,2].map(n=><Lock key={n} points={[[n*.105,.79,.495-Math.abs(n)*.026],[n*.100,.60,.505-Math.abs(n)*.032],[n*.060,.46+Math.abs(n)*.042,.415-Math.abs(n)*.012],[n*.035,.367+Math.abs(n)*.060,.300]]} radii={[.025,.041,.030,0]} color={n%2?'#fffdf4':'#f6f2e6'} flatness={.7}/>)}
    <Clay at={[0,.923,.373]} size={[.072,.069,.078]} color="#ffdab8"/>
    <group position={[0,1.15,0]} rotation={[0,0,.10]}>
      <mesh geometry={brim} castShadow receiveShadow><meshStandardMaterial color="#cf687b" roughness={.55} side={THREE.DoubleSide}/></mesh>
      <mesh geometry={hat} castShadow receiveShadow><meshStandardMaterial color="#dd7b8b" roughness={.55}/></mesh>
      <mesh position={[0,.125,.004]}><cylinderGeometry args={[.308,.334,.085,56]}/><meshStandardMaterial color="#be6677" roughness={.68}/></mesh>
      <mesh geometry={buckle} position={[.01,.132,.33]} rotation={[-.20,0,0]} castShadow><meshStandardMaterial color="#f8cc80" metalness={.12} roughness={.42}/></mesh>
      <mesh position={[.01,.132,.35]}><boxGeometry args={[.012,.07,.012]}/><meshStandardMaterial color="#f8cc80"/></mesh>
    </group>
    <mesh geometry={staff} castShadow><meshStandardMaterial color="#b38a61" roughness={.68}/></mesh>
    <mesh geometry={strap} castShadow><meshStandardMaterial color="#94704d" roughness={.78}/></mesh>
    <group position={[-.29,.39,.29]} rotation={[0,0,.18]}>
      <Clay at={[0,0,0]} size={[.092,.115,.042]} color="#a58954"/>
      <mesh position={[0,0,.035]}><boxGeometry args={[.10,.135,.012]}/><meshStandardMaterial color="#e8c37e"/></mesh>
      <mesh position={[0,.02,.048]}><boxGeometry args={[.020,.035,.012]}/><meshStandardMaterial color="#b18b4f"/></mesh>
    </group>
  </group>;
}

/** A feather keeps a stable front/back axis instead of twisting around a tube frame. */
function featherGeometry(root: Vec, tip: Vec, width: number, bend = .04) {
  const from=new THREE.Vector3(...root),to=new THREE.Vector3(...tip);
  const middle=from.clone().lerp(to,.52);middle.y+=bend;middle.z+=.035;
  const curve=new THREE.QuadraticBezierCurve3(from,middle,to);
  const positions:number[]=[],indices:number[]=[];
  for(let row=0;row<=32;row++) {
    const t=row/32,center=curve.getPoint(t),tangent=curve.getTangent(t);
    const normal=new THREE.Vector3(-tangent.y,tangent.x,0).normalize();
    const r=Math.sin(t*Math.PI)**.48*width*(1-.18*t);
    for(let col=0;col<=20;col++) {
      const angle=col/20*Math.PI*2;
      const point=center.clone().addScaledVector(normal,Math.cos(angle)*r);
      point.z+=Math.sin(angle)*r*.43;
      positions.push(point.x,point.y,point.z);
      if(row<32&&col<20){const k=row*21+col;indices.push(k,k+1,k+21,k+1,k+22,k+21);}
    }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
function BirdWing({ side, pivot }: {side:number;pivot:React.RefObject<THREE.Group>}) {
  const feathers=useMemo(()=>{
    // Shoulder-to-tip anatomy is built directly for each side. No reflected scales
    // or quarter-turns can exchange the leading edge with the feather tips.
    const layout=[
      [.045,.08,.39,.085,.092],[.10,.18,.57,.18,.102],
      [.18,.30,.74,.32,.112],[.27,.44,.88,.50,.116],
      [.37,.60,1.00,.72,.117],[.47,.76,1.07,.95,.111],
      [.57,.91,1.07,1.16,.101],[.66,1.035,1.015,1.34,.088],
      [.73,1.11,.91,1.46,.068],
    ];
    return layout.map(([x,y,tx,ty,w],i)=>featherGeometry([side*x,y,.008+i*.004],[side*tx,ty,-.025],w,.035));
  },[side]);
  const coverts=useMemo(()=>Array.from({length:5},(_,i)=>{
    const t=i/5;return featherGeometry([side*(.07+t*.34),.12+t*.66,.082],[side*(.29+t*.40),.22+t*.70,.076],.090-i*.004,.035);
  }),[side]);
  useEffect(()=>()=>{feathers.forEach(g=>g.dispose());coverts.forEach(g=>g.dispose());},[feathers,coverts]);
  return <group ref={pivot} position={[side*.19,.09,-.015]}>
    <group rotation={[.035,side<0?-.10:.42,0]} scale={side<0?1.04:.96}>
      {feathers.map((geometry,i)=><mesh key={i} geometry={geometry} castShadow receiveShadow><meshStandardMaterial color={i%2?'#f8faf3':'#fffef8'} roughness={.58}/></mesh>)}
      <Lock points={[[side*.025,.035,-.015],[side*.19,.34,-.015],[side*.43,.74,-.02],[side*.75,1.20,-.025]]} radii={[.11,.15,.10,0]} color="#f9faf4" flatness={.8}/>
      {coverts.map((geometry,i)=><mesh key={i} geometry={geometry} castShadow receiveShadow><meshStandardMaterial color="#fffef7" roughness={.6}/></mesh>)}
      <Clay at={[side*.13,.18,.046]} size={[.11,.23,.08]} rotation={[0,0,-side*.42]}/>
    </group>
  </group>;
}
export function CottageBird({animated}:{animated:boolean}) {
  const bird=useRef<THREE.Group>(null),left=useRef<THREE.Group>(null),right=useRef<THREE.Group>(null),time=useRef(.24);
  useFrame((_,delta)=>{
    if(animated)time.current+=Math.min(delta,.05);
    const t=time.current,beat=Math.sin(t*4.6);
    if(bird.current){bird.current.position.set(-2.62+Math.sin(t*.7)*.09,4.62+Math.sin(t*1.4)*.09,.32+Math.cos(t*.7)*.07);bird.current.rotation.z=-.10+Math.sin(t*.7)*.035;}
    if(left.current){left.current.rotation.z=.12+beat*.045;left.current.rotation.x=beat*.04;}
    if(right.current){right.current.rotation.z=.10-Math.sin(t*4.6+.16)*.045;right.current.rotation.x=Math.sin(t*4.6+.16)*.04;}
  });
  return <group ref={bird} position={[-2.62,4.62,.32]} rotation={[0,0,-.04]} scale={.91}>
    <BirdWing side={-1} pivot={left}/><BirdWing side={1} pivot={right}/>
    <Clay at={[0,-.015,.04]} size={[.32,.30,.29]}/>
    <Clay at={[.045,.19,.105]} size={[.245,.225,.225]}/>
    {[-1,1].map(side=><group key={side}>
      <Clay at={[.045+side*.10,.223,.306]} size={[.025,.033,.018]} color="#4b5560"/>
      <Clay at={[.039+side*.10,.232,.322]} size={[.006,.008,.004]} color="#ffffff"/>
      <Lock points={[[side*.09,-.255,.05],[side*.09,-.36,.07],[side*.09+.06,-.38,.15]]} radii={[.017,.016,.008]} color="#dca845"/>
      {[0,1].map(i=><Lock key={i} points={[[side*.09,-.36,.07],[side*.09-.03+i*.065,-.385,.13]]} radii={[.014,.005]} color="#dca845"/>)}
    </group>)}
    <Clay at={[.045,.16,.344]} size={[.044,.034,.067]} color="#eabd51"/>
    <group position={[-.22,-.07,-.16]} rotation={[.20,-.64,-.14]}>
      {[-1.5,-.5,.5,1.5].map(n=><Clay key={n} at={[n*.065,0,-.14]} size={[.055,.045,.25-Math.abs(n)*.015]} color="#df899d" rotation={[0,n*.23,0]}/>)}
    </group>
  </group>;
}
