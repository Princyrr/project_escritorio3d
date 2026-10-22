import * as THREE from 'three';

export function createDeskCup(resources:Array<{dispose:()=>void}>) {
  const group=new THREE.Group();
  const ceramic=new THREE.MeshStandardMaterial({color:'#faf7ed',roughness:.25});
  const coffee=new THREE.MeshStandardMaterial({color:'#382117',roughness:.3});
  const accent=new THREE.MeshStandardMaterial({color:'#2c7d9f',roughness:.3});resources.push(ceramic,coffee,accent);
  const add=(geometry:THREE.BufferGeometry,material:THREE.Material)=>{resources.push(geometry);const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;};
  const saucer=add(new THREE.CylinderGeometry(.185,.17,.018,48),ceramic);saucer.position.y=.009;
  const profile=[[0,.020],[.075,.020],[.102,.035],[.12,.205],[.12,.245],[.104,.245],[.104,.205],[.088,.052],[0,.052]].map(([x,y])=>new THREE.Vector2(x,y));
  add(new THREE.LatheGeometry(profile,64),ceramic);
  const handle=add(new THREE.TorusGeometry(.072,.018,12,40),ceramic);handle.position.set(-.145,.14,0);
  const surface=add(new THREE.CircleGeometry(.103,48),coffee);surface.rotation.x=-Math.PI/2;surface.position.y=.218;
  const rim=add(new THREE.TorusGeometry(.113,.007,10,64),accent);rim.rotation.x=Math.PI/2;rim.position.y=.245;
  const band=add(new THREE.CylinderGeometry(.111,.109,.024,48,1,true),accent);band.position.y=.119;
  const timeUniform={value:0};
  // Camera-facing translucent ribbons: soft edges, gentle curls and a
  // gradual dissolve instead of opaque tubes floating above the coffee.
  for(let i=0;i<3;i++){
    const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
      uniforms:{uTime:timeUniform,uPhase:{value:i*2.1}},
      vertexShader:`uniform float uTime;uniform float uPhase;varying vec2 vUv;
        void main(){
          vUv=uv;float h=uv.y;
          vec3 center=vec3((uPhase/2.1-1.)*.034,.245+h*.60,(uPhase/2.1-1.)*.014);
          center.x+=sin(h*8.-uTime*.85+uPhase)*(.008+h*.025);
          center.z+=sin(h*6.-uTime*.65+uPhase)*h*.018;
          vec4 view=modelViewMatrix*vec4(center,1.);
          view.x+=(uv.x-.5)*(.045+h*.13);
          gl_Position=projectionMatrix*view;
        }`,
      fragmentShader:`uniform float uTime;uniform float uPhase;varying vec2 vUv;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
        void main(){
          float x=vUv.x-.5,h=vUv.y;
          float soft=exp(-x*x*20.)*(1.-smoothstep(.32,.50,abs(x)));
          float fade=smoothstep(0.,.13,h)*(1.-smoothstep(.48,1.,h));
          float drift=noise(vec2(vUv.x*3.+uPhase,h*6.-uTime*.65));
          float curl=.70+.30*sin(h*11.-uTime*1.4+uPhase);
          float alpha=soft*fade*(.40+.60*drift)*curl*.46;
          gl_FragColor=vec4(.79,.84,.87,alpha);
        }`,
    });resources.push(material);
    const geometry=new THREE.PlaneGeometry(1,1,1,32);resources.push(geometry);
    const steam=new THREE.Mesh(geometry,material);steam.frustumCulled=false;steam.renderOrder=2;group.add(steam);
  }
  return {group,update(time:number){timeUniform.value=time;}};
}
