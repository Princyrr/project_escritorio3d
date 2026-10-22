import * as THREE from 'three';

export function createLaboratoryPresenter(resources:Array<{dispose:()=>void}>) {
  const group=new THREE.Group();
  const makeMaterial=(color:string)=>{const m=new THREE.MeshStandardMaterial({color,roughness:.8});resources.push(m);return m;};
  const shirt=makeMaterial('#368d9c'),skin=makeMaterial('#d8a17d'),trousers=makeMaterial('#23364e'),shoes=makeMaterial('#172638');
  const sphere=new THREE.SphereGeometry(1,24,20);resources.push(sphere);
  const ellipsoid=(parent:THREE.Object3D,material:THREE.Material,position:number[],scale:number[])=>{
    const mesh=new THREE.Mesh(sphere,material);mesh.position.fromArray(position);mesh.scale.fromArray(scale);mesh.castShadow=true;parent.add(mesh);return mesh;
  };
  const limb=(parent:THREE.Object3D,material:THREE.Material,from:THREE.Vector3,to:THREE.Vector3,radius:number)=>{
    const geometry=new THREE.CylinderGeometry(radius,radius,from.distanceTo(to),16);resources.push(geometry);
    const mesh=new THREE.Mesh(geometry,material);mesh.position.copy(from).add(to).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),to.clone().sub(from).normalize());parent.add(mesh);mesh.castShadow=true;return mesh;
  };
  for(const side of [-1,1]){
    limb(group,trousers,new THREE.Vector3(side*.17,.16,0),new THREE.Vector3(side*.16,1.18,0),.115);
    ellipsoid(group,shoes,[side*.17,.12,-.07],[.15,.10,.25]);
  }
  // A continuous shirt silhouette with a full hem over the trouser waist.
  const torsoGeometry=new THREE.LatheGeometry([
    new THREE.Vector2(0,1.08),new THREE.Vector2(.27,1.08),
    new THREE.Vector2(.30,1.13),new THREE.Vector2(.31,1.43),
    new THREE.Vector2(.32,1.66),new THREE.Vector2(.30,1.75),new THREE.Vector2(.24,1.82),
    new THREE.Vector2(.15,1.85),new THREE.Vector2(0,1.85),
  ],40);resources.push(torsoGeometry);
  const torso=new THREE.Mesh(torsoGeometry,shirt);torso.scale.z=.78;torso.castShadow=true;group.add(torso);
  ellipsoid(group,trousers,[0,1.09,0],[.285,.19,.205]);
  limb(group,skin,new THREE.Vector3(0,1.83,0),new THREE.Vector3(0,2.02,0),.12);
  // Independent clean-shaven face and short auburn hair, without the main character's quiff.
  const head=new THREE.Group();head.position.set(0,2.28,0);group.add(head);
  ellipsoid(head,skin,[0,0,0],[.355,.435,.35]);
  for(const side of [-1,1])ellipsoid(head,skin,[side*.34,-.035,0],[.065,.10,.06]);
  ellipsoid(head,skin,[0,-.03,-.345],[.055,.075,.055]);
  const hair=makeMaterial('#a15e35');
  const hairGeometry=new THREE.SphereGeometry(1,40,28,0,Math.PI*2,0,1.97);resources.push(hairGeometry);
  const hairVertices=hairGeometry.attributes.position;
  for(let i=0;i<hairVertices.count;i++){
    const x=hairVertices.getX(i),y=hairVertices.getY(i),z=hairVertices.getZ(i);
    const radial=Math.hypot(x,z),theta=Math.acos(THREE.MathUtils.clamp(y,-1,1));
    if(radial<.00001)continue;
    const back=THREE.MathUtils.smoothstep(z/radial,-.2,.7);
    const extendedTheta=theta+.62*back*Math.pow(theta/1.97,3);
    hairVertices.setXYZ(i,x/radial*Math.sin(extendedTheta),Math.cos(extendedTheta),z/radial*Math.sin(extendedTheta));
  }
  hairGeometry.computeVertexNormals();hairGeometry.computeBoundingSphere();
  const hairCap=new THREE.Mesh(hairGeometry,hair);hairCap.scale.set(.368,.445,.36);hairCap.position.set(0,.045,.025);hairCap.castShadow=true;head.add(hairCap);
  const eyeMaterial=makeMaterial('#344139');
  for(const side of [-1,1])ellipsoid(head,eyeMaterial,[side*.13,.035,-.326],[.028,.04,.018]);
  // Each arm is one smooth surface, including its elbow, wrist and rounded hand.
  const continuousArm=(parent:THREE.Group,points:THREE.Vector3[],sleeveEnd:number)=>{
    const curve=new THREE.CatmullRomCurve3(points);
    const segments=48,sides=16;
    const geometry=new THREE.TubeGeometry(curve,segments,1,sides,false);resources.push(geometry);
    const vertices=geometry.attributes.position;
    for(let ring=0;ring<=segments;ring++){
      const t=ring/segments,center=curve.getPointAt(t);
      const radius=t<.12?.135*Math.sin(t/.12*Math.PI/2):t<.38?THREE.MathUtils.lerp(.135,.095,(t-.12)/.26):t<.78?THREE.MathUtils.lerp(.095,.074,(t-.38)/.40):t<.90?THREE.MathUtils.lerp(.074,.088,(t-.78)/.12):.088*Math.sqrt(Math.max(0,1-Math.pow((t-.90)/.10,2)));
      for(let j=0;j<=sides;j++){
        const index=ring*(sides+1)+j;
        vertices.setXYZ(index,center.x+(vertices.getX(index)-center.x)*radius,center.y+(vertices.getY(index)-center.y)*radius,center.z+(vertices.getZ(index)-center.z)*radius);
      }
    }
    geometry.computeVertexNormals();geometry.computeBoundingSphere();
    const sleeveIndices=Math.round(segments*sleeveEnd)*sides*6;
    geometry.clearGroups();geometry.addGroup(0,sleeveIndices,0);geometry.addGroup(sleeveIndices,segments*sides*6-sleeveIndices,1);
    const mesh=new THREE.Mesh(geometry,[shirt,skin]);mesh.castShadow=true;parent.add(mesh);
  };
  // Both relaxed arms start inside the shirt and follow its shoulder contour.
  for(const side of [-1,1]){
    continuousArm(group,[
      new THREE.Vector3(side*.19,1.79,0),
      new THREE.Vector3(side*.32,1.68,0),
      new THREE.Vector3(side*.37,1.35,-.015),
      new THREE.Vector3(side*.37,.98,-.025),
    ],.40);
  }
  // Match the monitor's blue conversation bubble, with its tail pointing to the speaker.
  const bubbleCanvas=document.createElement('canvas');bubbleCanvas.width=256;bubbleCanvas.height=170;
  const bubbleContext=bubbleCanvas.getContext('2d')!;
  const drawBubble=(time:number)=>{
    bubbleContext.clearRect(0,0,256,170);
    bubbleContext.fillStyle='#218bda';bubbleContext.beginPath();bubbleContext.arc(128,74,65,0,Math.PI*2);bubbleContext.fill();
    bubbleContext.beginPath();bubbleContext.moveTo(169,118);bubbleContext.lineTo(195,142);bubbleContext.lineTo(183,106);bubbleContext.closePath();bubbleContext.fill();
    for(let dot=0;dot<3;dot++){
      const pulse=.5+.5*Math.sin(time*5-dot*.9);
      bubbleContext.fillStyle=`rgba(255,255,255,${.5+.5*pulse})`;
      bubbleContext.beginPath();bubbleContext.arc(103+dot*25,74-pulse*3,6,0,Math.PI*2);bubbleContext.fill();
    }
  };
  drawBubble(0);
  const bubbleTexture=new THREE.CanvasTexture(bubbleCanvas);bubbleTexture.colorSpace=THREE.SRGBColorSpace;resources.push(bubbleTexture);
  const bubbleMaterial=new THREE.SpriteMaterial({map:bubbleTexture,transparent:true,depthWrite:false,opacity:0});resources.push(bubbleMaterial);
  const messageBubble=new THREE.Sprite(bubbleMaterial);messageBubble.position.set(-.42,3.12,0);messageBubble.scale.set(.60,.398,1);messageBubble.visible=false;group.add(messageBubble);
  let lastBubbleFrame=-Infinity;
  let explainingStarted:number|null=null;
  group.position.set(1.62,.25,1.02);group.rotation.y=0;group.scale.setScalar(1.12);
  return {group,update(time:number,seated:number,reducedMotion=false){
    const explaining=THREE.MathUtils.smoothstep(seated,.80,1);
    if(explaining>.05)explainingStarted??=time;else explainingStarted=null;
    const phase=Math.max(0,time-(explainingStarted??time))%16;
    const appear=THREE.MathUtils.smoothstep(phase,6,6.5);
    const disappear=1-THREE.MathUtils.smoothstep(phase,9.5,10);
    const amount=reducedMotion?1:appear*disappear;
    bubbleMaterial.opacity=explaining*amount;
    messageBubble.visible=bubbleMaterial.opacity>.001;
    messageBubble.position.y=3.12+(reducedMotion?0:Math.sin(time*1.6)*.04+(1-appear)*-.12);
    const size=reducedMotion?1:.85+.15*appear;
    messageBubble.scale.set(.60*size,.398*size,1);
    if(messageBubble.visible&&!reducedMotion&&time-lastBubbleFrame>=1/12){drawBubble(time);bubbleTexture.needsUpdate=true;lastBubbleFrame=time;}
    head.rotation.y=Math.sin(time*.65)*.045*explaining;
    head.rotation.z=Math.sin(time*1.3)*.025*explaining;
  }};
}
