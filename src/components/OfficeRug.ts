import * as THREE from 'three';

export function createOfficeRug(resources:Array<{dispose:()=>void}>) {
  const width=6.24,length=4.56,radius=.28,x=width/2,y=length/2;
  const shape=new THREE.Shape();shape.moveTo(-x+radius,-y);
  shape.lineTo(x-radius,-y);shape.quadraticCurveTo(x,-y,x,-y+radius);
  shape.lineTo(x,y-radius);shape.quadraticCurveTo(x,y,x-radius,y);
  shape.lineTo(-x+radius,y);shape.quadraticCurveTo(-x,y,-x,y-radius);
  shape.lineTo(-x,-y+radius);shape.quadraticCurveTo(-x,-y,-x+radius,-y);shape.closePath();
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d')!;
  const image=ctx.createImageData(128,128);
  for(let i=0;i<128*128;i++){
    const grain=Math.sin(i*127.1+Math.floor(i/128)*311.7)*43758.5453;
    const shade=235+(grain-Math.floor(grain)-.5)*16;
    image.data[i*4]=shade;image.data[i*4+1]=shade;image.data[i*4+2]=shade;image.data[i*4+3]=255;
  }
  ctx.putImageData(image,0,0);
  const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(6,6);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;resources.push(texture);
  const fabric=new THREE.MeshStandardMaterial({color:'#92b8c7',map:texture,roughness:1,bumpMap:texture,bumpScale:.002});
  const edge=new THREE.MeshStandardMaterial({color:'#7ba0af',roughness:1});resources.push(fabric,edge);
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:.026,bevelEnabled:true,bevelSize:.008,bevelThickness:.006,bevelSegments:2,curveSegments:18});resources.push(geometry);
  // Extend only the front corner on the plant side; keep both wall edges
  // and the rear corner beside the plant in their current positions.
  const vertices=geometry.getAttribute('position');
  for(let i=0;i<vertices.count;i++){
    const vx=vertices.getX(i),vy=vertices.getY(i);
    const rightEdge=THREE.MathUtils.smoothstep(vx,x-.85,x-radius);
    const front=1-THREE.MathUtils.smoothstep(vy,-y+.35,y-.35);
    vertices.setX(i,vx+.60*rightEdge*front);
  }
  geometry.computeVertexNormals();geometry.computeBoundingSphere();
  const rug=new THREE.Mesh(geometry,[fabric,edge]);rug.rotation.x=-Math.PI/2;
  // Back edge sits just in front of the wall at z=-1.62.
  rug.position.set(.20,.012,.74);rug.receiveShadow=true;
  return rug;
}
