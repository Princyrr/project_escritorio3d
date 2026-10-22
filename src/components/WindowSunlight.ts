import * as THREE from 'three';

export function addWindowSunlight(room:THREE.Group,resources:Array<{dispose:()=>void}>) {
  const light=new THREE.SpotLight('#ffe4ac',12,9,.70,.85,2);
  light.position.set(-2.78,3.05,.35);light.target.position.set(-.25,.04,1.45);
  room.add(light,light.target);
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv;void main(){
      vec2 p=vUv;
      float border=smoothstep(0.,.12,p.x)*(1.-smoothstep(.88,1.,p.x))*smoothstep(0.,.13,p.y)*(1.-smoothstep(.85,1.,p.y));
      float frameShadow=smoothstep(.012,.036,abs(p.x-.50));
      float softFade=.68+.32*(1.-p.y);
      gl_FragColor=vec4(1.,.88,.62,border*frameShadow*softFade*.32);
    }`,
  });resources.push(material);
  const deskGeometry=new THREE.PlaneGeometry(.68,1.12);resources.push(deskGeometry);
  const deskPatch=new THREE.Mesh(deskGeometry,material);deskPatch.rotation.x=-Math.PI/2;deskPatch.position.set(-1.62,1.399,.64);deskPatch.renderOrder=1;room.add(deskPatch);
}
