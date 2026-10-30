import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function flameGeometry(height: number, width: number, bend: number, core = false) {
  const positions: number[] = [], colors: number[] = [], indices: number[] = [];
  for(let row=0;row<=48;row++) {
    const t=row/48;
    const radius=row===48?0:width*(.10+Math.sin(Math.PI*t)**.75)*(1-t)**.38;
    for(let col=0;col<=40;col++) {
      const angle=col/40*Math.PI*2;
      positions.push(Math.cos(angle)*radius+bend*t*t,height*t,Math.sin(angle)*radius*.60);
      const color=new THREE.Color(core?'#ffdd43':'#ff9c16').lerp(new THREE.Color(core?'#fff398':'#ffe447'),Math.min(1,t*1.7));
      color.multiplyScalar(.89+.11*Math.sin(angle));colors.push(color.r,color.g,color.b);
      if(row<48&&col<40){const k=row*41+col;indices.push(k,k+1,k+41,k+1,k+42,k+41);}
    }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

export default function CottageFire({animated}:{animated:boolean}) {
  const flames=useRef<(THREE.Group|null)[]>([]),sparks=useRef<THREE.Group>(null),time=useRef(0);
  const geometries=useMemo(()=>[flameGeometry(1.17,.30,.14),flameGeometry(.64,.15,-.13),flameGeometry(.75,.15,.14),flameGeometry(.77,.14,-.06,true)],[]);
  useEffect(()=>()=>geometries.forEach(geometry=>geometry.dispose()),[geometries]);
  useFrame((_,delta)=>{
    if(animated)time.current+=Math.min(delta,.05);
    const t=time.current;
    flames.current.forEach((group,i)=>{if(group){group.scale.y=.96+Math.sin(t*(3.0+i*.4)+i)*.05;group.rotation.z=Math.sin(t*(1.9+i*.3)+i)*.035;}});
    sparks.current?.children.forEach((spark,i)=>{
      const progress=(t*.22+i*.21)%1;
      spark.position.set(Math.sin(t*.8+i*1.6)*(.20+i*.018),.38+progress*1.02,.13);
      spark.scale.setScalar(Math.sin(progress*Math.PI)*.8+.15);
    });
  });
  return <group position={[0,.37,.40]}>
    <mesh position={[0,.055,.04]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.37,40]}/><meshBasicMaterial color="#e77b1c"/></mesh>
    {[0,1,2].map(i=><group key={i} position={[0,.035+i*.035,.10+(i-1)*.11]} rotation={[0,(i-1)*.16,i%2?.055:-.06]}>
      <mesh rotation={[0,0,Math.PI/2]} castShadow><capsuleGeometry args={[.060,.57,6,20]}/><meshStandardMaterial color={i%2?'#ac6934':'#bf7939'} roughness={.87}/></mesh>
      {[-1,1].map(side=><group key={side} position={[side*.335,0,0]} rotation={[0,Math.PI/2,0]}>
        <mesh><circleGeometry args={[.048,20]}/><meshStandardMaterial color="#e4b05f" side={THREE.DoubleSide}/></mesh>
        <mesh position={[0,0,side*.001]}><torusGeometry args={[.025,.003,5,24]}/><meshStandardMaterial color="#a56832"/></mesh>
      </group>)}
    </group>)}
    {geometries.map((geometry,i)=><group key={i} ref={value=>{flames.current[i]=value;}} position={[[0,.105,.025],[-.245,.10,.02],[.24,.10,0],[0,.11,.185]][i] as [number,number,number]}>
      <mesh geometry={geometry}><meshBasicMaterial vertexColors toneMapped={false}/></mesh>
    </group>)}
    <group ref={sparks}>{Array.from({length:5},(_,i)=><mesh key={i} rotation={[0,0,i*.4-.3]}><sphereGeometry args={[.032,12,10]}/><meshBasicMaterial color="#ffdd45"/></mesh>)}</group>
  </group>;
}
