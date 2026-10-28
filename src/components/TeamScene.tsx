import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';

type Vec = [number,number,number];
type Volume = { center: Vec; size: Vec; power?: number };
function Sculpt({ volumes, color, blend = .045 }: { volumes: Volume[]; color: string; blend?: number }) {
  const signature = JSON.stringify({volumes,blend});
  const geometry = useMemo(() => {
    const data = JSON.parse(signature) as {volumes:Volume[];blend:number};
    const min=new THREE.Vector3(Infinity,Infinity,Infinity),max=new THREE.Vector3(-Infinity,-Infinity,-Infinity);
    data.volumes.forEach(({center,size})=>{for(let axis=0;axis<3;axis++){min.setComponent(axis,Math.min(min.getComponent(axis),center[axis]-size[axis]-.12));max.setComponent(axis,Math.max(max.getComponent(axis),center[axis]+size[axis]+.12));}});
    const span=max.clone().sub(min),material=new THREE.MeshBasicMaterial();
    const n=58,iso=new MarchingCubes(n,material,false,false,55000);iso.isolation=0;
    for(let z=0;z<n;z++)for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const px=min.x+span.x*x/n,py=min.y+span.y*y/n,pz=min.z+span.z*z/n;
      let distance=10;
      for(const volume of data.volumes){
        const dx=(px-volume.center[0])/volume.size[0],dy=(py-volume.center[1])/volume.size[1],dz=(pz-volume.center[2])/volume.size[2];
        const power=volume.power ?? 2;
        const d=(Math.pow(Math.pow(Math.abs(dx),power)+Math.pow(Math.abs(dy),power)+Math.pow(Math.abs(dz),power),1/power)-1)*Math.min(...volume.size);
        const h=Math.max(data.blend-Math.abs(distance-d),0)/data.blend;
        distance=Math.min(distance,d)-h*h*data.blend*.25;
      }
      iso.field[z*n*n+y*n+x]=-distance;
    }
    iso.update();
    const count=iso.geometry.drawRange.count;
    const geometry=new THREE.BufferGeometry();
    const source=iso.geometry.attributes.position;
    const positions=new Float32Array(count*3);
    for(let i=0;i<count;i++){
      positions[i*3]=min.x+(source.getX(i)+1)*.5*span.x;
      positions[i*3+1]=min.y+(source.getY(i)+1)*.5*span.y;
      positions[i*3+2]=min.z+(source.getZ(i)+1)*.5*span.z;
    }
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    // Copy smooth field normals, correcting for the nonuniform bounds.
    const normals=new Float32Array(count*3),normal=new THREE.Vector3();const sourceNormals=iso.geometry.attributes.normal;
    for(let i=0;i<count;i++){normal.set(sourceNormals.getX(i)/span.x,sourceNormals.getY(i)/span.y,sourceNormals.getZ(i)/span.z).normalize();normals.set([normal.x,normal.y,normal.z],i*3);}
    geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));geometry.computeBoundingSphere();
    iso.geometry.dispose();material.dispose();return geometry;
  }, [signature]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color={color} roughness={.78}/></mesh>;
}
function sweep(points: Vec[], radius: number, taper=1): Volume[] {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'catmullrom',.25);
  return Array.from({length:17},(_,i)=>{const t=i/16,p=curve.getPoint(t),r=radius*(1+(taper-1)*t);return {center:[p.x,p.y,p.z],size:[r,r,r]} as Volume;});
}
function Form({at,size,color,rotation}: {at:Vec;size:Vec;color:string;rotation?:Vec}) {
  return <mesh position={at} scale={size} rotation={rotation} castShadow receiveShadow><sphereGeometry args={[1,40,32]}/><meshStandardMaterial color={color} roughness={.69}/></mesh>;
}
function Curve({points,radius,color,taper=1}: {points:Vec[];radius:number;color:string;taper?:number}) {
  const geometry=useMemo(()=>{
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'catmullrom',.25);
    const geometry=new THREE.TubeGeometry(curve,40,radius,16,false);
    const pos=geometry.attributes.position;
    for(let row=0;row<=40;row++){const t=row/40,center=curve.getPointAt(t),factor=1+(taper-1)*t;for(let col=0;col<=16;col++){const i=row*17+col;pos.setXYZ(i,center.x+(pos.getX(i)-center.x)*factor,center.y+(pos.getY(i)-center.y)*factor,center.z+(pos.getZ(i)-center.z)*factor);}}
    geometry.computeVertexNormals();return geometry;
  },[points,radius,taper]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color={color} roughness={.73}/></mesh>;
}
function Trim({at,size,color,rotation}: {at:Vec;size:Vec;color:string;rotation?:Vec}) {
  return <RoundedBox args={size} position={at} rotation={rotation} radius={Math.min(...size)*.35} smoothness={5} castShadow><meshStandardMaterial color={color} roughness={.65}/></RoundedBox>;
}
function Glasses({female=false}: {female?:boolean}) {
  const rim=useMemo(()=>{
    const points:Vec[]=[];
    for(let i=0;i<=64;i++){const angle=i/64*Math.PI*2;points.push([Math.sign(Math.cos(angle))*Math.pow(Math.abs(Math.cos(angle)),.52)*.141,Math.sign(Math.sin(angle))*Math.pow(Math.abs(Math.sin(angle)),.60)*.111,0]);}
    return points;
  },[]);
  return <group position={[0,.015,.286]}>
    {[-1,1].map(side=><group key={side} position={[side*.165,0,0]} rotation={[0,side*.11,0]}>
      <Curve points={rim} radius={.014} color={female?'#344b52':'#294552'}/>
      <mesh position={[0,0,-.004]}><circleGeometry args={[.106,40]}/><meshPhysicalMaterial color="#c9e8ed" transparent opacity={.10} roughness={.1} depthWrite={false}/></mesh>
      <Curve points={[[side*.136,.045,0],[side*.155,.055,-.08],[side*.15,.04,-.22]]} radius={.011} color="#263c45"/>
    </group>)}
    <Curve points={[[-.027,.035,0],[0,.057,.01],[.027,.035,0]]} radius={.012} color="#294552"/>
  </group>;
}
function Hair({female=false,right=false}: {female?:boolean;right?:boolean}) {
  const geometry=useMemo(()=>{
    const geometry=new THREE.SphereGeometry(1,80,64,0,Math.PI*2,0,Math.PI*.64);
    const vertices=geometry.attributes.position;
    for(let i=0;i<vertices.count;i++){
      const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i);
      const sweep=(female?.028:right?.10:.075)*Math.pow(Math.max(0,y),2);
      const groove=.004*Math.cos(Math.atan2(z,x)*23+y*10);
      vertices.setXYZ(i,x*(.287+groove)-sweep,y*(female?.16:.22)+.18+(!female?.075*Math.pow(Math.max(0,y),2)*Math.exp(-Math.pow((x+.2)/.8,2))+.085*Math.pow(Math.max(0,z),2)*(1-Math.max(0,y)):0),z*(.245+groove)-.025);
    }
    geometry.computeVertexNormals();return geometry;
  },[female,right]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  const color=female?'#493128':'#52392c';
  return <>
    <mesh geometry={geometry} castShadow><meshStandardMaterial color={color} roughness={.58}/></mesh>
    {female?<>
      <Sculpt color={color} blend={.04} volumes={[{center:[0,-.03,-.225],size:[.225,.255,.11]}, {center:[-.25,-.17,-.09],size:[.092,.10,.10]},{center:[.25,-.17,-.09],size:[.092,.10,.10]}]}/>
      {[-1,1].map(side=><Curve key={side} points={[[side*.018,.335,.015],[side*.15,.28,.19],[side*.27,.15,.10],[side*.265,-.03,.015]]} radius={.027} taper={.6} color="#50382d"/>)}
    </>:<>
      <Form at={[-.24,.09,-.065]} size={[.040,.12,.085]} color={color}/>
      <Form at={[.24,.09,-.065]} size={[.040,.12,.085]} color={color}/>
      {Array.from({length:7},(_,i)=><Curve key={i} points={[[.225-i*.030,.17,.15],[.17-i*.033,.33+i*.010,.18],[-.02-i*.027,.435-i*.004,.055],[-.20-i*.005,.26,-.09]]} radius={.009} color={i%2?'#80604b':'#654835'}/>)}
    </>}
  </>;
}
function Face({female=false,right=false}: {female?:boolean;right?:boolean}) {
  const skin=female?'#e1a17c':'#e9b38a';
  const geometry=useMemo(()=>{
    const geometry=new THREE.SphereGeometry(1,96,80);
    const vertices=geometry.attributes.position;
    for(let i=0;i<vertices.count;i++){
      const nx=vertices.getX(i),ny=vertices.getY(i),nz=vertices.getZ(i);
      const jaw=1-.20*Math.pow(Math.max(0,-ny),1.2);
      const x=nx*.275*jaw,y=ny*.345,z=nz*.238;
      const front=Math.max(0,nz);
      const nose=.075*Math.exp(-Math.pow(x/.050,2)-Math.pow((y+.035)/.073,2));
      const cheeks=.016*(Math.exp(-Math.pow((x-.14)/.09,2))+Math.exp(-Math.pow((x+.14)/.09,2)))*Math.exp(-Math.pow((y+.07)/.10,2));
      vertices.setXYZ(i,x,y,z+front*front*(nose+cheeks));
    }
    geometry.computeVertexNormals();return geometry;
  },[]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <>
    <mesh geometry={geometry} castShadow receiveShadow><meshPhysicalMaterial color={skin} roughness={.65} clearcoat={.04}/></mesh>
    {[-1,1].map(side=><group key={side}>
      <Form at={[side*.275,-.008,-.015]} size={[.048,.082,.044]} color={skin}/>
      <Form at={[side*.293,-.008,.018]} size={[.015,.042,.012]} color="#c38262"/>
      <Form at={[side*.128,.028,.215]} size={[.065,.046,.025]} color="#fff6df"/>
      <Form at={[side*.125,.030,.237]} size={[.027,.034,.011]} color="#73523a"/>
      <Form at={[side*.124,.031,.247]} size={[.014,.024,.006]} color="#25332f"/>
      <Form at={[side*.116,.044,.252]} size={[.007,.008,.003]} color="#ffffff"/>
      <Curve points={[[side*.064,.127,.225],[side*.125,.145,.225],[side*.191,.127,.192]]} radius={female?.010:.013} color="#4e382d"/>
      <Curve points={[[side*.069,.054,.227],[side*.129,.069,.238],[side*.187,.052,.215]]} radius={.006} color="#b77e60"/>
    </group>)}
    <Curve points={[[-.093,-.144,.210],[-.045,-.166,.229],[0,-.172,.235],[.05,-.162,.224],[.096,-.137,.205]]} radius={.010} color="#ae6e55"/>
    <Curve points={[[-.067,-.151,.224],[0,-.161,.242],[.071,-.146,.218]]} radius={.006} color="#fff4de"/>
    {right&&<Curve points={[[-.105,-.261,.115],[0,-.287,.15],[.105,-.261,.115]]} radius={.010} color="#7b5943"/>}
    <group scale={[.86,.83,.88]} position={[0,.018,-.002]}><Glasses female={female}/></group><Hair female={female} right={right}/>
  </>;
}
function ClothBody({color,shirt=false,female=false}: {color:string;shirt?:boolean;female?:boolean}) {
  const geometry=useMemo(()=>{
    const positions:number[]=[],uv:number[]=[],indices:number[]=[];
    const rows=44,cols=72;
    for(let row=0;row<=rows;row++){
      const t=row/rows;
      const width=(shirt?.20:(female?.325:.365))*(1-.09*Math.sin(t*Math.PI));
      const depth=shirt?.163:.218;
      for(let col=0;col<=cols;col++){
        const u=col/cols;
        const angle=shirt?u*Math.PI*2:.34+u*(Math.PI*2-.68);
        const shoulder=Math.pow(Math.max(0,(t-.78)/.22),1.4);
        const x=Math.sin(angle)*width;
        const y=1.35+t*1.08-shoulder*Math.abs(Math.sin(angle))*.16;
        const z=Math.cos(angle)*depth+(shirt?.065:-.005);
        positions.push(x,y,z);uv.push(u,t);
        if(row<rows&&col<cols){const i=row*(cols+1)+col;indices.push(i,i+cols+1,i+1,i+1,i+cols+1,i+cols+2);}
      }
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
  },[shirt,female]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh geometry={geometry} castShadow receiveShadow><meshPhysicalMaterial color={color} roughness={.84} sheen={.35} sheenColor={color} side={THREE.DoubleSide}/></mesh>;
}
function Lapel({side,color}: {side:number;color:string}) {
  const geometry=useMemo(()=>{
    const shape=new THREE.Shape();shape.moveTo(.10,.02);shape.lineTo(.135,.46);shape.lineTo(.29,.36);shape.lineTo(.23,.25);shape.lineTo(.27,.21);shape.lineTo(.10,.02);
    return new THREE.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:true,bevelSegments:3,bevelSize:.009,bevelThickness:.008,curveSegments:16});
  },[]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <group position={[0,1.98,.205]} scale={[side,1,1]}>
    <mesh geometry={geometry} castShadow><meshStandardMaterial color={color} roughness={.85}/></mesh>
    <Curve points={[[.137,.44,.025],[.286,.36,.025],[.225,.25,.025],[.265,.21,.025],[.108,.03,.025]]} radius={.0035} color={color}/>
  </group>;
}
function Hands({side,skin}: {side:number;skin:string}) {
  return <group position={[-side*.32,2.14,side===1?.46:.36]} rotation={[0,0,side*.19]}>
    <Sculpt color={skin} blend={.015} volumes={[
      {center:[0,0,0],size:[.13,.060,.072]},
      ...[0,1,2,3].map(i=>({center:[-side*.058,.025-i*.023,.039] as Vec,size:[.10-i*.004,.020,.027] as Vec})),
      {center:[side*.04,-.041,.012],size:[.053,.061,.04]},
    ]}/>
  </group>;
}
function Character({kind,animated}: {kind:'woman'|'center'|'right';animated:boolean}) {
  const woman=kind==='woman',right=kind==='right';
  const jacket=woman?'#238d86':right?'#294e5d':'#21aaa4';
  const shirt=woman?'#82c9bf':right?'#b1804c':'#714977';
  const pants=woman?'#303e50':'#294757',skin=woman?'#e2a580':'#e9b58c';
  const head=useRef<THREE.Group>(null);const timer=useRef(0);
  useFrame((_,delta)=>{if(animated)timer.current+=Math.min(delta,.05);if(head.current){head.current.rotation.z=(woman?-.07:right?.045:0)+Math.sin(timer.current*.6)*.012;head.current.rotation.y=Math.sin(timer.current*.4)*.018;}});
  return <group>
    <ClothBody color={jacket} female={woman}/>
    <ClothBody color={shirt} shirt female={woman}/>
    <Form at={[0,2.50,-.015]} size={[.093,.19,.098]} color={skin}/>
    {woman&&<Trim at={[0,2.42,.005]} size={[.21,.17,.20]} color={shirt}/>}
    <Lapel side={-1} color={woman?'#237f79':right?'#315462':'#289e98'}/><Lapel side={1} color={woman?'#237f79':right?'#315462':'#289e98'}/>
    {[-1,1].map(side=><group key={side}>
      <Curve points={[[side*.19,2.23,-.04],[side*.345,2.25,.025],[side*.425,2.21,.08],[side*.45,2.01,.22],[side*.26,2.015,side===1?.40:.32],[-side*.235,2.12,side===1?.44:.35]]} radius={woman?.112:.127} taper={.80} color={jacket}/>
      <Trim at={[side*.25,1.60,.163]} size={[.18,.17,.016]} color={jacket} rotation={[0,side*.3,side*.03]}/>
      <Trim at={[side*.25,1.68,.178]} size={[.19,.021,.016]} color={woman?'#227c78':right?'#25444f':'#25978f'}/>
      <Curve points={[[side*.165,1.62,.222],[side*.16,1.51,.225],[side*.33,1.51,.184],[side*.34,1.62,.18]]} radius={.0025} color={jacket}/>
    </group>)}
    {right&&[0,1,2,3].map(i=><Form key={i} at={[0,2.35-i*.14,.284]} size={[.012,.012,.009]} color="#5a4437"/>)}
    <Sculpt color={pants} blend={.065} volumes={[
      {center:[0,1.36,-.025],size:[.27,.16,.17],power:2.6},
      ...[-1,1].flatMap(side=>sweep([[side*.17,1.38,-.015],[side*(right&&side===1?.40:.22),.87,.02],[side*.25,.17,.04]],woman?.113:.134,.74)),
    ]}/>
    {[-1,1].map(side=><group key={side}>
      <Form at={[side*.25,.08,.18]} size={[.137,.102,.255]} color={woman?'#239e9b':right?'#285164':'#465363'}/>
      <Form at={[side*.25,.025,.18]} size={[.14,.032,.258]} color="#e2d9bf"/>
      {[0,1,2,3].map(i=><Curve key={i} points={[[side*.25-.064,.178,.13+i*.035],[side*.25,.191,.145+i*.035],[side*.25+.064,.178,.13+i*.035]]} radius={.006} color="#c8c9b9"/>)}
      <Hands side={side} skin={skin}/>
    </group>)}
    {!woman&&!right&&<group position={[.30,2.125,.47]} rotation={[0,0,-.20]}><Trim at={[0,0,0]} size={[.074,.12,.10]} color="#293846"/><Trim at={[0,0,.058]} size={[.060,.078,.015]} color="#8b9da7"/><Trim at={[0,0,.07]} size={[.044,.060,.006]} color="#283d4a"/></group>}
    <group ref={head} position={[0,2.91,-.005]}><Face female={woman} right={right}/></group>
  </group>;
}
function Team({animated,progress}: {animated:boolean;progress:number}) {
  return <group position={[0,-.2+(1-progress)*.24,0]} scale={.95+progress*.05}>
    <group position={[-1.01,0,-.08]} scale={.86} rotation={[0,.12,-.025]}><Character kind="woman" animated={animated}/></group>
    <group position={[0,0,.12]}><Character kind="center" animated={animated}/></group>
    <group position={[1.04,0,-.06]} scale={.97} rotation={[0,-.14,-.025]}><Character kind="right" animated={animated}/></group>
  </group>;
}
function TeamCamera() {
  const {camera,size}=useThree();
  useEffect(()=>{if(camera instanceof THREE.PerspectiveCamera){const fitWidth=3.6/(2*Math.tan(camera.fov*Math.PI/360)*(size.width/size.height));camera.position.set(0,1.85,Math.max(7.2,fitWidth));camera.updateProjectionMatrix();}},[camera,size.width,size.height]);
  return null;
}
class TeamBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?<p>Não foi possível exibir os personagens em 3D.</p>:this.props.children;}}
export default function TeamScene({animated}: {animated:boolean}) {
  const section=useRef<HTMLElement>(null);const [visible,setVisible]=useState(false);const [progress,setProgress]=useState(0);
  useEffect(()=>{
    const element=section.current;if(!element)return;
    const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{rootMargin:'180px'});observer.observe(element);
    let frame=0;const update=()=>{frame=0;const rect=element.getBoundingClientRect();setProgress(THREE.MathUtils.clamp((window.innerHeight-rect.top)/(window.innerHeight*.85),0,1));};
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);update();
    return()=>{observer.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);cancelAnimationFrame(frame);};
  },[]);
  return <section ref={section} className="studio-team-section" aria-label="Equipe em três dimensões">
    <div className="studio-team-heading"><p>PESSOAS QUE CONECTAM POSSIBILIDADES</p><h2>Conhecimento tem <em>rosto.</em></h2><span>Perspectivas diferentes. Um propósito em comum.</span></div>
    <div className="studio-team-canvas" role="img" aria-label="Três personagens 3D de braços cruzados e óculos: mulher de blazer verde, homem de blazer turquesa e homem de terno azul com camisa caramelo">
      {visible&&<TeamBoundary><Canvas shadows camera={{position:[0,1.85,7.2],fov:30}} dpr={[1,1.5]} fallback={<p>Visualização 3D indisponível.</p>}>
        <ambientLight intensity={.65}/><hemisphereLight args={['#f4f6ef','#a8a7a3',.9]}/>
        <directionalLight position={[-3,6,5]} intensity={2.1} color="#fff1dc" castShadow shadow-mapSize={[1024,1024]}/><directionalLight position={[4,3,-2]} intensity={1.3} color="#d0f2f5"/>
        <TeamCamera />
        <Team animated={animated} progress={progress}/><ContactShadows position={[0,-.23,0]} opacity={.35} scale={8} blur={2.5} far={4} color="#686560"/>
        <OrbitControls target={[0,1.48,0]} enablePan={false} enableZoom={false} minAzimuthAngle={-.55} maxAzimuthAngle={.55} minPolarAngle={1.25} maxPolarAngle={1.65}/>
      </Canvas></TeamBoundary>}
    </div>
    <p className="studio-team-caption">INTELIGÊNCIA • COLABORAÇÃO • TRANSFORMAÇÃO</p>
  </section>;
}
