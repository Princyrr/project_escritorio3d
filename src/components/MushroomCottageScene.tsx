import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CottageWizard as Wizard, CottageBird as Bird } from './CottageCharacters';
import CottageFire from './CottageFire';

type Vec = [number, number, number];
type SceneProps = { animated: boolean; enchanted: boolean };
const cream = '#fff6dc';
const cavityOrange = '#b7471f';
const leaf = '#8abf57';
function gardenRoute(z: number) {
  const t=THREE.MathUtils.clamp((z-.73)/2.72,0,1);
  return {center:.60*Math.sin(2*Math.PI*t)*Math.sin(Math.PI*t)-.20*t,width:.32+t*.21};
}
function onGardenPath(x:number,z:number,margin=0) {
  const route=gardenRoute(z);return z>.65&&z<3.55&&Math.abs(x-route.center)<route.width+margin;
}
const random = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

function Pebble({ at, size, color = cream, rotation = [0, 0, 0] }: { at: Vec; size: Vec; color?: string; rotation?: Vec }) {
  return <mesh position={at} scale={size} rotation={rotation} castShadow receiveShadow><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color={color} roughness={.8} /></mesh>;
}
function Stem({ points, radius = .035, color = '#bd8968' }: { points: Vec[]; radius?: number; color?: string }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 20, radius, 7, false), [points, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} castShadow><meshStandardMaterial color={color} roughness={.8} /></mesh>;
}
function Leaf({ at, direction, length = .3, width = .10, color = leaf }: { at: Vec; direction: Vec; length?: number; width?: number; color?: string }) {
  const geometry = useMemo(() => {
    const vertices: number[] = [], indices: number[] = [];
    for (let row = 0; row <= 12; row++) {
      const t = row / 12, w = Math.sin(Math.PI * t) ** .8;
      for (let col = 0; col <= 6; col++) {
        const v = col / 3 - 1; vertices.push(v * w, t, Math.sin(t * Math.PI) * (1 - v * v) * .23);
        if (row < 12 && col < 6) { const n = row * 7 + col; indices.push(n, n + 1, n + 7, n + 1, n + 8, n + 7); }
      }
    }
    const result = new THREE.BufferGeometry(); result.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); result.setIndex(indices); result.computeVertexNormals(); return result;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...direction).normalize());
  return <mesh geometry={geometry} position={at} quaternion={rotation} scale={[width, length, width]} castShadow><meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={.65} /></mesh>;
}
function Foliage({ at, scale = 1, color = leaf, tilt = 0 }: { at: Vec; scale?: number; color?: string; tilt?: number }) {
  return <group position={at} rotation={[0, 0, tilt]} scale={scale}>
    {[0, 1, 2, 3].map(frond => <group key={frond} rotation={[.1 + frond * .14, frond * 1.6, .15]}>
      <Stem points={[[0, 0, 0], [.10, .42, 0], [.45, .76, 0], [.89, .72, 0]]} radius={.013} color="#79a748" />
      {Array.from({ length: 8 }, (_, i) => { const t = i / 8, x = .02 + t * .80, y = .16 + Math.sin(t * 1.5) * .59;
        return [-1, 1].map(side => <Leaf key={`${i}-${side}`} at={[x, y, 0]} direction={[.35, .6 - t * .6, side * .9]} length={.30 * (1 - t * .55)} width={.115 * (1 - t * .5)} color={color} />);
      })}
    </group>)}
  </group>;
}
function Sprig({ at, scale = 1 }: { at: Vec; scale?: number }) {
  return <group position={at} scale={scale}>
    <Stem points={[[0, 0, 0], [-.04, .65, 0], [.06, 1.35, 0]]} radius={.023} color="#d98c77" />
    {[0, 1, 2, 3].map(i => <group key={i} position={[0, .35 + i * .25, 0]}>
      <Stem points={[[0, 0, 0], [i % 2 ? -.15 : .15, .14, 0], [i % 2 ? -.19 : .19, .29, 0]]} radius={.015} color="#df9682" />
      <Pebble at={[i % 2 ? -.19 : .19, .30, 0]} size={[.065, .09, .065]} color="#f4b394" />
    </group>)}
  </group>;
}
function Flower({ at, scale = 1, color = '#ffb2b3' }: { at: Vec; scale?: number; color?: string }) {
  return <group position={at} scale={scale}>
    <Stem points={[[0, 0, 0], [.03, .18, 0], [0, .34, .01]]} radius={.014} color="#83aa59" />
    <Pebble at={[.07, .13, 0]} size={[.105, .035, .045]} color="#9ac367" rotation={[0, 0, .5]} />
    <group position={[0, .35, 0]} rotation={[.70, 0, 0]}>
      {Array.from({ length: 5 }, (_, i) => { const a = i * Math.PI * 2 / 5; return <Pebble key={i} at={[Math.cos(a) * .085, .015, Math.sin(a) * .085]} size={[.085, .035, .06]} rotation={[0, -a, 0]} color={color} />; })}
      <Pebble at={[0, .045, 0]} size={[.045, .032, .045]} color="#ffcf69" />
    </group>
  </group>;
}

function Mushroom({ at, scale = 1, color = '#ee7c88', tall = false, lean = 0, golden = false }: { at: Vec; scale?: number; color?: string; tall?: boolean; lean?: number; golden?: boolean }) {
  const { cap, samples } = useMemo(() => {
    const control = tall ? [[.98, 0], [1.01, .045], [.85, .15], [.60, .37], [.46, .70], [.31, 1.05], [.16, 1.17], [0, 1.19]] : [[.98, 0], [.99, .035], [.87, .13], [.60, .27], [.31, .34], [0, .36]];
    const curve = new THREE.CatmullRomCurve3(control.map(([r, y]) => new THREE.Vector3(r, y, 0)), false, 'centripetal');
    const samples = curve.getPoints(64).map(v => new THREE.Vector2(Math.max(0, v.x), v.y));
    const cap = new THREE.LatheGeometry(samples, 64);
    const positions = cap.getAttribute('position'), colors: number[] = [];
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i), t = THREE.MathUtils.smoothstep(y, .02, tall ? .42 : .19);
      const c = new THREE.Color(golden ? '#f8c765' : color === '#77c5dd' ? '#a0ddeb' : '#f3a7a0').lerp(new THREE.Color(color), t); colors.push(c.r, c.g, c.b);
    }
    cap.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); return { cap, samples };
  }, [tall, color, golden]);
  useEffect(() => () => cap.dispose(), [cap]);
  return <group position={at} scale={scale} rotation={[0, 0, lean]}>
    <Stem points={[[0, .05, 0], [.025, .50, -.015], [0, 1.08, 0]]} radius={.105} color="#f6dfb5" />
    <Pebble at={[0, 1.015, 0]} size={[.95, .16, .95]} color="#f7deb5" />
    {Array.from({ length: 32 }, (_, i) => { const a = i * Math.PI * 2 / 32;
      return <Stem key={i} points={[[Math.cos(a) * .13, .91, Math.sin(a) * .13], [Math.cos(a) * .55, .91, Math.sin(a) * .55], [Math.cos(a) * .93, 1.04, Math.sin(a) * .93]]} radius={.010} color="#bd9679" />;
    })}
    <mesh geometry={cap} position={[0, 1.08, 0]} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={.52} /></mesh>
    {Array.from({ length: tall ? 10 : 19 }, (_, i) => {
      const a = i * 2.399, r = .16 + random(i + 12) * .65;
      let k = samples.findIndex(v => v.x < r); if (k < 1) k = 1;
      const a0 = samples[k - 1], a1 = samples[k], t = (r - a0.x) / (a1.x - a0.x);
      const y = THREE.MathUtils.lerp(a0.y, a1.y, t), slope = (a1.y - a0.y) / (a1.x - a0.x);
      const normal = new THREE.Vector3(-slope * Math.cos(a), 1, -slope * Math.sin(a)).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      const radius = .032 + random(i + 17) * .043;
      return <mesh key={i} position={[Math.cos(a) * r + normal.x * .004, 1.08 + y + normal.y * .004, Math.sin(a) * r + normal.z * .004]} quaternion={q} scale={[radius, .012, radius * .85]}><sphereGeometry args={[1, 14, 10]} /><meshStandardMaterial color="#fff5e6" roughness={.7} /></mesh>;
    })}
  </group>;
}
function Tree({ at, scale = 1, color = '#92d159' }: { at: Vec; scale?: number; color?: string }) {
  const crown = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([[0, 0], [.46, .02], [.65, .19], [.53, .48], [.36, .93], [.23, 1.23], [0, 1.36]].map(([r,y]) => new THREE.Vector3(r,y,0)));
    return new THREE.LatheGeometry(curve.getPoints(48).map(v => new THREE.Vector2(Math.max(0,v.x),v.y)),48);
  }, []);
  useEffect(() => () => crown.dispose(), [crown]);
  return <group position={at} scale={scale}>
    <Stem points={[[0, 0, 0], [-.08, 1.2, 0], [.09, 2.65, 0]]} radius={.115} color="#ba7e5b" />
    <Stem points={[[0, 1.0, 0], [.45, 1.5, .03], [.76, 1.94, 0]]} radius={.075} color="#ba7e5b" />
    <Stem points={[[0, 1.7, 0], [-.23, 2.18, 0], [-.28, 2.4, 0]]} radius={.045} color="#ba7e5b" />
    <mesh geometry={crown} position={[.03, 2.1, 0]} receiveShadow><meshStandardMaterial color={color} roughness={.63} /></mesh>
    <mesh geometry={crown} position={[.65, 1.85, .03]} scale={[1,.48,.85]} receiveShadow><meshStandardMaterial color={color} roughness={.63} /></mesh>
  </group>;
}

const eggRadius = (y: number) => 1.78 * Math.sqrt(Math.max(0, 1 - ((y - 2.0) / 2.75) ** 2));
function Cottage({ animated, enchanted }: SceneProps) {
  const light = useRef<THREE.PointLight>(null), fireTime = useRef(0);
  const shell = useMemo(() => {
    const points = [new THREE.Vector2(0, .17)];
    for (let i = 0; i <= 100; i++) { const y = .18 + i / 100 * 4.57; points.push(new THREE.Vector2(eggRadius(y), y)); }
    const geometry = new THREE.LatheGeometry(points, 144);
    const positions = geometry.getAttribute('position'), indices = geometry.getIndex()!, kept: number[] = [];
    // Cut a real opening in the curved shell; the interior remains visible when orbiting.
    for (let i = 0; i < indices.count; i += 3) {
      const ids = [indices.getX(i), indices.getX(i + 1), indices.getX(i + 2)];
      const x = ids.reduce((sum, id) => sum + positions.getX(id), 0) / 3;
      const y = ids.reduce((sum, id) => sum + positions.getY(id), 0) / 3;
      const z = ids.reduce((sum, id) => sum + positions.getZ(id), 0) / 3;
      if (!(z > 0 && (x / .72) ** 2 + ((y - 1.24) / 1.02) ** 2 < 1)) kept.push(...ids);
    }
    geometry.setIndex(kept); return geometry;
  }, []);
  const doorway = useMemo(() => {
    const points = Array.from({ length: 121 }, (_, i) => {
      const a = i / 120 * Math.PI * 2, x = Math.cos(a) * .73, y = 1.24 + Math.sin(a) * 1.03;
      return new THREE.Vector3(x, y, Math.sqrt(Math.max(.1, eggRadius(y) ** 2 - x * x)) * .80 + .02);
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), 120, .044, 8, true);
  }, []);
  const passage = useMemo(() => {
    const positions: number[] = [], indices: number[] = [];
    for (let depth = 0; depth <= 12; depth++) {
      const t = depth / 12;
      for (let i = 0; i <= 120; i++) {
        const a = i / 120 * Math.PI * 2;
        const x = Math.cos(a) * .73 * (1 - t * .09), y = 1.24 + Math.sin(a) * 1.03 * (1 - t * .07);
        const front = Math.sqrt(Math.max(.1, eggRadius(y) ** 2 - x * x)) * .8;
        positions.push(x, y, THREE.MathUtils.lerp(front, .10, t));
        if(depth < 12 && i < 120){const k=depth*121+i;indices.push(k,k+1,k+121,k+1,k+122,k+121);}
      }
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
  }, []);
  useEffect(() => () => { shell.dispose(); doorway.dispose(); passage.dispose(); }, [shell, doorway, passage]);
  useFrame((_,delta) => {
    if(animated)fireTime.current+=Math.min(delta,.05);
    if(light.current)light.current.intensity=3.2+Math.sin(fireTime.current*5)*.25;
  });
  return <group position={[0, 0, -.48]}>
    <mesh geometry={shell} scale={[1, 1, .8]} castShadow receiveShadow><meshStandardMaterial color="#fffdf1" roughness={.63} side={THREE.FrontSide} /></mesh>
    <mesh geometry={passage}><meshBasicMaterial color={cavityOrange} toneMapped={false} side={THREE.DoubleSide} /></mesh>
    <mesh geometry={doorway} castShadow><meshStandardMaterial color="#efd7ab" roughness={.75} /></mesh>
    <mesh position={[0,1.24,-.38]} scale={[.88,1.01,.40]}><sphereGeometry args={[1,32,24]}/><meshBasicMaterial color={cavityOrange} toneMapped={false}/></mesh>
    <mesh position={[0,.265,.49]} receiveShadow><boxGeometry args={[1.25,.07,1.00]}/><meshStandardMaterial color="#c66b2e" roughness={1}/></mesh>
    <Pebble at={[0,.285,1.07]} size={[.43,.035,.10]} color="#e3bf82" />
    <pointLight ref={light} position={[0, 1.1, .58]} color={enchanted ? '#ffc46b' : '#ffab45'} intensity={5} distance={4} decay={2} />
    <CottageFire animated={animated}/>
    <Pebble at={[.83, 2.95, 1.03]} size={[.07, .11, .025]} color="#a3c968" rotation={[0, .2, -.7]} />
  </group>;
}

function Butterfly({ at, scale = 1, color = '#fff9ed' }: { at: Vec; scale?: number; color?: string }) {
  return <group position={at} scale={scale} rotation={[.15, .1, -.3]}>
    {[-1,1].map(side=><group key={side} rotation={[0,side*.35,0]}><Pebble at={[side*.11,.1,0]} size={[.105,.21,.035]} color={color} rotation={[0,0,-side*.45]}/><Pebble at={[side*.09,-.06,0]} size={[.085,.12,.025]} color={color} rotation={[0,0,side*.5]}/></group>)}
    <Pebble at={[0,0,.03]} size={[.028,.14,.027]} color={color}/>
  </group>;
}
function GardenDetails() {
  return <>
    {[0,1,2,3,4].map(i=><Leaf key={i} at={[1.03+i*.12,.40+i*.15,.87]} direction={[i%2?.8:-.5,.7,.25]} length={.42} width={.16} color="#87b871"/>)}
    <Sprig at={[-1.8,.22,.22]} scale={1.4}/><Sprig at={[1.58,.22,.58]} scale={1.05}/>
    <Pebble at={[-1.62,1.05,.96]} size={[.49,1.02,.41]} color="#9fd467" rotation={[0,0,.15]}/>
    <Pebble at={[-2.44,.81,.62]} size={[.39,.68,.36]} color="#7fb5c6"/>
    <Pebble at={[2.16,.65,.54]} size={[.46,.49,.38]} color="#80b5c1"/>
    <Pebble at={[2.81,1.08,-1.48]} size={[.48,1.05,.40]} color="#9bc3cb"/>
    {[0,1,2,3,4].map(i=><Pebble key={i} at={[-1.89+(i%2)*.27,.62+i*.24,1.31]} size={[.041,.055,.022]} color={i%2?'#e8f3da':'#a9df95'}/>)}
    <Stem points={[[-1.02,.23,1.63],[-1.08,1.30,1.65],[-1.25,1.88,1.64]]} radius={.025} color="#b67e54"/>
    <Pebble at={[-1.27,1.70,1.65]} size={[.074,.15,.072]} color="#f9cf6c"/>
    <Butterfly at={[.47,3.0,1.01]} scale={.69}/><Butterfly at={[-1.37,4.82,-.2]} scale={.44}/>
    <Butterfly at={[3.14,3.61,-.76]} scale={.27}/>
    {[-1,1].map(side=><group key={side} position={[side*2.75,.23,2.11]}>
      <Flower at={[0,0,0]} scale={2.0} color="#e8f4ff"/><Flower at={[.17,0,.27]} scale={1.15} color="#f4d0b2"/>
    </group>)}
    {Array.from({length:28},(_,i)=>{const side=i%2?1:-1,x=side*(1.35+random(i+5)*1.8),z=.8+random(i+61)*1.85;return <group key={i} position={[x,.23,z]}>
      <Stem points={[[0,0,0],[.015,.18+random(i)*.18,0]]} radius={.009} color="#7fba54"/>
      <Pebble at={[.015,.20+random(i)*.18,0]} size={[.035,.045,.033]} color={['#f1ac9a','#f5ce83','#ef8da1'][i%3]}/>
    </group>;})}
  </>;
}
function Cloud({ at, scale = 1 }: { at: Vec; scale?: number }) {
  return <group position={at} scale={scale}>{[[-.24, 0, 0, .23], [0, .1, 0, .31], [.27, -.02, 0, .22]].map(([x, y, z, r], i) => <Pebble key={i} at={[x, y, z]} size={[r, r * .78, r * .68]} />)}</group>;
}
function GardenPath() {
  const geometry=useMemo(()=>{
    const positions:number[]=[],indices:number[]=[];
    for(let i=0;i<=80;i++){
      const z=.73+i/80*2.72,{center,width}=gardenRoute(z);
      positions.push(center-width,.255,z,center+width,.255,z);
      if(i<80){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}
    }
    const mesh=new THREE.BufferGeometry();mesh.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));mesh.setIndex(indices);mesh.computeVertexNormals();return mesh;
  },[]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <group>
    <mesh geometry={geometry} receiveShadow><meshStandardMaterial color="#f5d9a1" roughness={1}/></mesh>
    {Array.from({length:13},(_,i)=>{
      const z=.91+i*.19,{center}=gardenRoute(z),x=center+Math.sin(i*2.3)*.10;
      return <Pebble key={i} at={[x,.273,z]} size={[.075+random(i)*.038,.022,.052+random(i+4)*.026]} rotation={[0,i*.8,0]} color={['#d0b78f','#bac0ad','#dec49a'][i%3]}/>;
    })}
    {Array.from({length:22},(_,i)=>{
      const z=.89+Math.floor(i/2)*.22,{center,width}=gardenRoute(z),side=i%2?1:-1;
      return <Pebble key={i} at={[center+side*(width-.025),.262,z]} size={[.040,.021,.055]} rotation={[0,i*.5,0]} color={i%3?'#d6c098':'#acb79f'}/>;
    })}
  </group>;
}
function Grass() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const dummy = new THREE.Object3D(); let count = 0;
    for (let i = 0; i < 10000; i++) {
      const a = random(i + 5) * Math.PI * 2, r = Math.sqrt(random(i + 2200)) * 3.42, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (onGardenPath(x,z,.035) || (Math.abs(x) < 1.38 && z < .6 && z > -1.45)) continue;
      dummy.position.set(x, .20, z); dummy.scale.set(.019 + random(i + 7) * .016, .018 + random(i + 8) * .026, .018); dummy.rotation.set(random(i) * .3, a, (random(i + 2) - .5) * .4); dummy.updateMatrix();
      mesh.current.setMatrixAt(count, dummy.matrix); mesh.current.setColorAt(count, new THREE.Color('#6fae38').lerp(new THREE.Color('#a6ce5c'),random(i+3))); count++;
    }
    mesh.current.count = count; mesh.current.instanceMatrix.needsUpdate = true; if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, []);
  return <instancedMesh ref={mesh} args={[undefined, undefined, 10000]}><sphereGeometry args={[1, 6, 5]} /><meshStandardMaterial roughness={1} /></instancedMesh>;
}
function Fireflies({ animated, enchanted }: SceneProps) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => Float32Array.from(Array.from({ length: 65 }, (_, i) => [(random(i) - .5) * 6.5, .7 + random(i + 80) * 4.4, (random(i + 160) - .5) * 4.8]).flat()), []);
  useFrame(({ clock }) => { if (ref.current && animated) ref.current.rotation.y = Math.sin(clock.elapsedTime * .13) * .18; });
  return <points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial color={enchanted ? '#ffe7a0' : '#fff9df'} size={enchanted ? .055 : .033} transparent opacity={enchanted ? .95 : .6} sizeAttenuation depthWrite={false} /></points>;
}
function Framing() {
  const { camera, size } = useThree();
  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const distance = Math.max(12.2, 4.45 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * size.width / size.height));
    camera.position.set(distance * .08, 2.3 + distance * .19, distance * .98); camera.lookAt(0, 2.3, 0); camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

export default function MushroomCottageScene({ animated, enchanted }: SceneProps) {
  return <>
    <color attach="background" args={[enchanted ? '#708d9e' : '#a1dcec']} />
    <ambientLight intensity={enchanted ? .55 : .75} color="#ffffff" />
    <hemisphereLight args={['#effbff', '#a8bd8b', enchanted ? .8 : 1.05]} />
    <directionalLight position={[-4, 8, 6]} intensity={enchanted ? 1.35 : 2.0} color="#fff4d9" castShadow shadow-mapSize={[1024, 1024]} shadow-radius={4} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={7} shadow-camera-bottom={-5} shadow-normalBias={.025} shadow-bias={-.0001} />
    <directionalLight position={[5, 4, -3]} intensity={.8} color="#def8ff" />
    <group position={[0, -.15, 0]}>
      <mesh position={[0, .005, 0]} receiveShadow castShadow><cylinderGeometry args={[3.62, 3.62, .28, 96]} /><meshStandardMaterial color="#efd6a4" roughness={.86} /></mesh>
      <mesh position={[0, .151, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[3.57, 96]} /><meshStandardMaterial color="#8dbc4b" roughness={1} /></mesh>
      <GardenPath />
      {[[-2, 0, 1.1], [2.1, 0, .8], [-2, 0, -1.1], [1.9, 0, -1.4]].map(([x, , z], i) => <Pebble key={i} at={[x, .16, z]} size={[1.25, .09, 1.5]} color={i % 2 ? '#a2c75b' : '#91bc4d'} />)}
      <Grass />
      <Cottage animated={animated} enchanted={enchanted} />
      <Tree at={[2.02, .22, -1.15]} scale={1.26} /><Tree at={[-2.08, .20, -1.65]} scale={1.00} color="#83bb66" />
      <Mushroom at={[-2.5, .23, -.65]} scale={1.40} tall lean={.15} />
      <Mushroom at={[2.48, .23, .15]} scale={1.02} tall color="#ee8e88" golden lean={-.12} />
      <Mushroom at={[-2.83, .22, .85]} scale={.77} color="#ed838e" lean={-.1} />
      <Mushroom at={[2.64, .23, 1.65]} scale={.73} color="#f09a9c" />
      <Mushroom at={[-1.67, .20, 2.35]} scale={.38} color="#e88894" />
      <Mushroom at={[-2.02, .20, 1.60]} scale={.67} tall color="#77c5dd" lean={.06} />
      <Mushroom at={[2.91, .18, -1.30]} scale={.8} color="#b1d982" />
      {[[-2.8, 1.8, .55, '#9fc1c6'], [-2, -.2, .64, '#90b9c0'], [2.7, -.1, .65, '#9cc4ca'], [2.9, -1.9, .8, '#afc7ca'], [-1.40, 2.96, .43, '#a8c4bf'], [.64, 3.08, .35, '#9cbcb8']].map(([x, z, s, c], i) => <Pebble key={i} at={[Number(x), .22, Number(z)]} size={[Number(s), Number(s) * .58, Number(s) * .7]} color={String(c)} />)}
      {[[-2.3, 1.9, 1.1], [-3.0, .3, .9], [2.87, 1.82, .9], [-1.8, -.5, 1], [1.70, 1.1, .75], [3.0, -.15, .8], [-1.8, 2.5, .75]].map(([x, z, s], i) => <Foliage key={i} at={[x, .22, z]} scale={s} tilt={i % 2 ? -.45 : .5} color={i % 2 ? '#a4cf79' : '#88b968'} />)}
      {Array.from({ length: 24 }, (_, i) => { const a = i * 2.399, r = 1.5 + random(i + 4) * 1.7, x=Math.cos(a)*r,z=Math.sin(a)*r; if(onGardenPath(x,z,.30))return null; return <Flower key={i} at={[x, .23, z]} scale={.65 + random(i + 24) * .8} color={['#f4a9a1', '#fff9e2', '#a9d9e7', '#f3c687'][i % 4]} />; })}

      <GardenDetails />
      <Wizard />
      <Stem points={[[2.7, .3, -1.3], [3.1, 2.1, -1.7], [3.15, 3.4, -1.3], [2.4, 3.8, -1.2], [1.95, 3.25, -1.15]]} radius={.027} color="#88b78a" />
      {[0, 1, 2, 3].map(i => <Pebble key={i} at={[3.12 - i * .08, 2.1 + i * .39, -1.55]} size={[.21, .07, .08]} color="#a6d477" rotation={[0, 0, -.5 + i * .4]} />)}
      <Bird animated={animated} />
      <Cloud at={[-.82, 5.35, -.8]} scale={.95} /><Cloud at={[.78, 5.55, -1.4]} scale={.8} /><Cloud at={[2.12, 4.75, -1.45]} scale={1.05} /><Cloud at={[3.12, 4.27, -1.2]} scale={.7} />
      <Fireflies animated={animated} enchanted={enchanted} />
    </group>
    <ContactShadows position={[0,-.30,0]} opacity={.28} scale={11} blur={2.8} far={8} resolution={256} frames={1} color="#527c8a" />
    <Framing />
    <OrbitControls makeDefault target={[0, 2.3, 0]} enablePan={false} minDistance={7.8} maxDistance={25} minPolarAngle={.65} maxPolarAngle={1.54} minAzimuthAngle={-.7} maxAzimuthAngle={.9} />
  </>;
}
