import * as THREE from 'three';
import chairLogoUrl from '../assets/logobranca.png';
import { paraibaCompanies } from './ParaibaCompanies';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// A cutaway laboratory built as geometry, so the arriving character shares its depth.
export function createLaboratory(resources: Array<{dispose:()=>void}>) {
  const group=new THREE.Group();
  const material=(color:string,emissive?:string)=>{
    const m=new THREE.MeshStandardMaterial({color,roughness:.48,metalness:.16,emissive:emissive??'#000000',emissiveIntensity:emissive?0.65:0});resources.push(m);return m;
  };
  const pearl=material('#dfedf8'),edge=material('#669dc2'),dark=material('#1c5079'),cyan=material('#43ebff','#00cfff'),gold=material('#ffc54d','#986000'),coral=material('#ff8568'),navy=material('#0a294d');
  const cube=new RoundedBoxGeometry(1,1,1,3,.08);resources.push(cube);
  const mesh=(geometry:THREE.BufferGeometry,mat:THREE.Material,x:number,y:number,z:number)=>{
    const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;
  };
  const box=(mat:THREE.Material,x:number,y:number,z:number,sx:number,sy:number,sz:number)=>{const m=mesh(cube,mat,x,y,z);m.scale.set(sx,sy,sz);return m;};
  const cylinder=(radius:number,height:number,mat:THREE.Material,y:number)=>{const g=new THREE.CylinderGeometry(radius,radius,height,96);resources.push(g);return mesh(g,mat,0,y,0);};
  const tube=(points:THREE.Vector3[],radius:number,mat:THREE.Material)=>{const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),Math.max(24,points.length*3),radius,8,false);resources.push(g);return mesh(g,mat,0,0,0);};
  const arc=(radius:number,y:number,start:number,end:number,thickness:number,mat:THREE.Material)=>{
    const points=Array.from({length:65},(_,i)=>{const a=start+(end-start)*i/64;return new THREE.Vector3(Math.sin(a)*radius,y,Math.cos(a)*radius);});return tube(points,thickness,mat);
  };
  cylinder(3.05,.28,dark,.02);cylinder(2.94,.08,edge,.20);
  // Thick curved shell, open toward the viewer like the reference.
  const wallShape=new THREE.Shape();
  const start=Math.PI*.52,end=Math.PI*1.53;
  for(let i=0;i<=80;i++){const a=start+(end-start)*i/80;const x=Math.sin(a)*3.02,y=-Math.cos(a)*3.02;if(i){wallShape.lineTo(x,y);}else{wallShape.moveTo(x,y);}}
  for(let i=80;i>=0;i--){const a=start+(end-start)*i/80;wallShape.lineTo(Math.sin(a)*2.79,-Math.cos(a)*2.79);}wallShape.closePath();
  const wallGeo=new THREE.ExtrudeGeometry(wallShape,{depth:3.48,bevelEnabled:true,bevelSize:.045,bevelThickness:.045,bevelSegments:2,steps:1});resources.push(wallGeo);
  const wall=mesh(wallGeo,pearl,0,.23,0);wall.rotation.x=-Math.PI/2;
  arc(2.74,3.43,start,end,.045,cyan);arc(2.93,3.79,start,end,.14,pearl);
  // Blue service wall, without the station number.
  box(edge,2.92,1.64,-.30,.16,2.90,2.12);
  // One uninterrupted curved screen, with a single panoramic animated texture.
  const curvedScreen=(radius:number,height:number,span:number)=>{
    const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
    for(let i=0;i<=96;i++){
      const t=i/96,angle=Math.PI-span/2+t*span;
      for(const y of [-height/2,height/2]){positions.push(Math.sin(angle)*radius,y,Math.cos(angle)*radius);uvs.push(1-t,y<0?0:1);}
      if(i<96){const v=i*2;indices.push(v,v+2,v+1,v+1,v+2,v+3);}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();resources.push(geometry);return geometry;
  };
  const bezel=new THREE.MeshStandardMaterial({color:'#08284a',roughness:.38,metalness:.3,side:THREE.DoubleSide});resources.push(bezel);
  mesh(curvedScreen(2.66,1.76,2.38),bezel,0,2.52,0);
  const canvas=document.createElement('canvas');canvas.width=2304;canvas.height=704;const ctx=canvas.getContext('2d')!;
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;resources.push(texture);
  const displayMaterial=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});resources.push(displayMaterial);
  mesh(curvedScreen(2.61,1.62,2.32),displayMaterial,0,2.52,0);
  arc(2.60,3.36,Math.PI-1.18,Math.PI+1.18,.013,cyan);
  const draw=(time:number)=>{
    const w=canvas.width,h=canvas.height;
    const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#082b4b');bg.addColorStop(1,'#02152a');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#12344f';ctx.lineWidth=1;
    for(let x=32;x<w;x+=48){ctx.beginPath();ctx.moveTo(x,220);ctx.lineTo(x,650);ctx.stroke();}
    for(let y=220;y<650;y+=40){ctx.beginPath();ctx.moveTo(32,y);ctx.lineTo(w-32,y);ctx.stroke();}
    ctx.fillStyle='#d6faff';ctx.font='bold 34px sans-serif';ctx.fillText('OBSERVATÓRIO  /  EMPRESAS DA PARAÍBA  /  INTELIGÊNCIA DE DADOS',38,49);
    ctx.fillStyle='#62e8ff';ctx.font='20px monospace';ctx.fillText('INDÚSTRIA  •  TERRITÓRIO  •  DESENVOLVIMENTO',1590,46);
    ctx.fillStyle='#247796';ctx.fillRect(38,77,w-76,2);
    const labels=['EMPRESAS EM DESTAQUE','MUNICÍPIOS NO RECORTE','SETORES NO RECORTE','TERRITÓRIO'];
    const values=[String(paraibaCompanies.length).padStart(2,'0'),String(new Set(paraibaCompanies.map(c=>c.city)).size).padStart(2,'0'),String(new Set(paraibaCompanies.map(c=>c.sector)).size).padStart(2,'0'),'PARAÍBA / PB'];
    for(let i=0;i<4;i++){const x=38+i*563;ctx.fillStyle='#0b3652';ctx.fillRect(x,101,539,105);ctx.fillStyle='#7cbed5';ctx.font='20px monospace';ctx.fillText(labels[i],x+20,132);ctx.fillStyle='#d5fbff';ctx.font='bold 42px monospace';ctx.fillText(values[i],x+20,185);}
    ctx.fillStyle='#92d7e9';ctx.font='21px monospace';ctx.fillText('EMPRESA',42,249);ctx.fillText('MUNICÍPIO / PB',615,249);ctx.fillText('ATIVIDADE',1000,249);ctx.fillText('CONEXÕES DO TERRITÓRIO',1610,249);
    const active=Math.floor(time/4)%paraibaCompanies.length;
    paraibaCompanies.forEach((company,i)=>{
      const y=275+i*98;
      ctx.fillStyle=i===active?'#104b66':'#092d47';ctx.fillRect(38,y,1485,80);
      ctx.fillStyle=i===active?'#68f1ff':'#c8edf6';ctx.font='bold 31px sans-serif';ctx.fillText(company.name,66,y+48);
      ctx.fillStyle='#b5dbe9';ctx.font='26px sans-serif';ctx.fillText(company.city,615,y+48);ctx.font='24px sans-serif';ctx.fillText(company.sector,1000,y+48);
      ctx.fillStyle='#4ae8ff';ctx.beginPath();ctx.arc(1493,y+40,5,0,Math.PI*2);ctx.fill();
    });
    // Animated connections show locations, not fabricated business metrics.
    const hubs=[{x:1720,y:395,label:'CAMPINA GRANDE'},{x:2175,y:305,label:'CABEDELO'},{x:2180,y:485,label:'CONDE'}];
    ctx.strokeStyle='#206684';ctx.lineWidth=2;
    for(const hub of hubs.slice(1)){ctx.beginPath();ctx.moveTo(hubs[0].x,hubs[0].y);ctx.lineTo(hub.x,hub.y);ctx.stroke();const t=(time*.2)%1;ctx.fillStyle='#61eaff';ctx.beginPath();ctx.arc(THREE.MathUtils.lerp(hubs[0].x,hub.x,t),THREE.MathUtils.lerp(hubs[0].y,hub.y,t),4,0,Math.PI*2);ctx.fill();}
    for(let i=0;i<hubs.length;i++){const hub=hubs[i];ctx.strokeStyle=`rgba(68,225,255,${.25+.25*Math.sin(time*2+i)})`;ctx.beginPath();ctx.arc(hub.x,hub.y,14+4*Math.sin(time*2+i),0,Math.PI*2);ctx.stroke();ctx.fillStyle='#70efff';ctx.beginPath();ctx.arc(hub.x,hub.y,6,0,Math.PI*2);ctx.fill();ctx.font='18px monospace';ctx.textAlign='center';ctx.fillText(hub.label,hub.x,hub.y+36);}
    ctx.textAlign='left';ctx.fillStyle='#799fb9';ctx.font='17px monospace';ctx.fillText('LOCALIZAÇÃO ESQUEMÁTICA',1685,563);
    ctx.fillStyle='#113e58';ctx.fillRect(38,587,w-76,51);ctx.fillStyle='#bceaf3';ctx.font='22px sans-serif';ctx.fillText('ALIMENTOS    /    CALÇADOS    /    REVESTIMENTOS CERÂMICOS',61,621);
    ctx.fillStyle='#8bb9cc';ctx.font='17px sans-serif';ctx.fillText('Recorte de empresas com operação na PB • Sem atualização automática • Fontes: São Braz, Prefeitura de Campina Grande e Elizabeth',38,679);
    const scan=220+(time*42)%420;const glow=ctx.createLinearGradient(0,scan-22,0,scan+2);glow.addColorStop(0,'rgba(66,212,255,0)');glow.addColorStop(1,'rgba(66,212,255,.07)');ctx.fillStyle=glow;ctx.fillRect(25,scan-22,w-50,24);
    texture.needsUpdate=true;
  };
  draw(0);
  // Continuous curved control desk, with a broad worktop and recessed fascia.
  const deskSector=(inner:number,outer:number,depth:number)=>{
    const shape=new THREE.Shape();const from=Math.PI-.98,to=Math.PI+.98;
    for(let i=0;i<=64;i++){const angle=from+(to-from)*i/64;const x=Math.sin(angle)*outer,y=-Math.cos(angle)*outer;if(i){shape.lineTo(x,y);}else{shape.moveTo(x,y);}}
    for(let i=64;i>=0;i--){const angle=from+(to-from)*i/64;shape.lineTo(Math.sin(angle)*inner,-Math.cos(angle)*inner);}shape.closePath();
    const geometry=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:3,curveSegments:32});resources.push(geometry);return geometry;
  };
  const chassis=mesh(deskSector(1.98,2.54,.68),dark,0,.49,0);chassis.rotation.x=-Math.PI/2;
  const fascia=mesh(deskSector(1.94,2.02,.48),edge,0,.58,0);fascia.rotation.x=-Math.PI/2;
  const worktop=mesh(deskSector(1.78,2.65,.13),pearl,0,1.20,0);worktop.rotation.x=-Math.PI/2;
  arc(1.80,1.24,Math.PI-.98,Math.PI+.98,.018,cyan);
  arc(1.96,.62,Math.PI-.96,Math.PI+.96,.012,cyan);
  const miniCanvas=document.createElement('canvas');miniCanvas.width=512;miniCanvas.height=256;const mini=miniCanvas.getContext('2d')!;
  mini.fillStyle='#062c49';mini.fillRect(0,0,512,256);mini.fillStyle='#79eaff';mini.font='bold 25px monospace';mini.fillText('CONTROL SYSTEM',20,35);
  mini.strokeStyle='#1d5b7d';for(let i=0;i<6;i++){mini.beginPath();mini.moveTo(20,65+i*31);mini.lineTo(490,65+i*31);mini.stroke();}
  mini.strokeStyle='#4ce5ff';mini.lineWidth=3;mini.beginPath();for(let i=0;i<90;i++){const x=20+i*5.2,y=128+Math.sin(i*.18)*28+Math.sin(i*.53)*12;if(i){mini.lineTo(x,y);}else{mini.moveTo(x,y);}}mini.stroke();
  for(let i=0;i<8;i++){mini.fillStyle=i<6?'#2cbcdc':'#195774';mini.fillRect(20+i*60,215,44,15);}
  const miniTexture=new THREE.CanvasTexture(miniCanvas);miniTexture.colorSpace=THREE.SRGBColorSpace;resources.push(miniTexture);
  const touchMaterial=new THREE.MeshBasicMaterial({map:miniTexture});resources.push(touchMaterial);
  const touchGeometry=new THREE.PlaneGeometry(.55,.28);resources.push(touchGeometry);
  const statusLight=material('#65eaf4','#00bbd9'),buttonMaterial=material('#559ac8');
  for(let station=0;station<5;station++){
    const angle=Math.PI+(station-2)*.36;
    const controls=new THREE.Group();controls.position.set(Math.sin(angle)*2.18,1.38,Math.cos(angle)*2.18);controls.rotation.y=angle+Math.PI;group.add(controls);
    const body=new THREE.Mesh(cube,navy);body.scale.set(.66,.09,.48);controls.add(body);
    const touch=new THREE.Mesh(touchGeometry,touchMaterial);touch.rotation.x=-Math.PI/2+.18;touch.position.set(0,.063,-.065);controls.add(touch);
    for(let key=0;key<5;key++){const control=new THREE.Mesh(cube,key===0?statusLight:buttonMaterial);control.scale.set(.065,.023,.05);control.position.set((key-2)*.105,.059,.16);controls.add(control);}
    const dialGeometry=new THREE.CylinderGeometry(.035,.035,.04,16);resources.push(dialGeometry);const dial=new THREE.Mesh(dialGeometry,pearl);dial.position.set(.265,.07,.15);controls.add(dial);
  }
  // The seat rotates on a fixed central pedestal.
  const upholstery=material('#377ead'),cushion=material('#579ac2'),chairBase=material('#123e61');
  const seatStart=group.children.length;
  box(chairBase,0,.91,.85,1.08,.17,.88);
  box(cushion,0,1.07,.85,.94,.26,.78);
  box(upholstery,0,1.43,1.29,1.18,.82,.22);
  box(cushion,0,1.46,1.16,.94,.58,.14);
  for(const side of [-1,1]){
    box(upholstery,side*.56,1.22,.85,.20,.42,.94);
    box(cushion,side*.56,1.45,.85,.21,.06,.95);
  }
  const seatParts=group.children.slice(seatStart);
  const swivelChair=new THREE.Group();swivelChair.position.set(0,0,.85);group.add(swivelChair);
  for(const part of seatParts){group.remove(part);part.position.z-=.85;swivelChair.add(part);}
  const chairLogoTexture=new THREE.TextureLoader().load(chairLogoUrl);
  chairLogoTexture.colorSpace=THREE.SRGBColorSpace;
  chairLogoTexture.anisotropy=4;resources.push(chairLogoTexture);
  const chairLogoMaterial=new THREE.MeshBasicMaterial({map:chairLogoTexture,transparent:true,depthWrite:false,alphaTest:.015,toneMapped:false});resources.push(chairLogoMaterial);
  const chairLogoGeometry=new THREE.PlaneGeometry(.88,.88*3058/7716);resources.push(chairLogoGeometry);
  const chairLogo=new THREE.Mesh(chairLogoGeometry,chairLogoMaterial);
  chairLogo.position.set(0,1.46,.553);swivelChair.add(chairLogo);
  const stemGeometry=new THREE.CylinderGeometry(.070,.085,.59,24);resources.push(stemGeometry);
  mesh(stemGeometry,chairBase,0,.58,.85);
  const baseGeometry=new THREE.CylinderGeometry(.43,.47,.07,48);resources.push(baseGeometry);
  mesh(baseGeometry,chairBase,0,.29,.85);
  // Yellow cable runway.
  for(let i=0;i<15;i++)arc(1.65+i*.067,.30,Math.PI*.10,Math.PI*.62,.025,gold);
  // Raised operator floor joins the highest stair to the control desk.
  const operatorFloorShape=new THREE.Shape();
  const floorFrom=Math.PI*.57,floorTo=Math.PI*1.43;
  for(let i=0;i<=72;i++){const a=floorFrom+(floorTo-floorFrom)*i/72;const x=Math.sin(a)*2.69,y=-Math.cos(a)*2.69;if(i){operatorFloorShape.lineTo(x,y);}else{operatorFloorShape.moveTo(x,y);}}
  for(let i=72;i>=0;i--){const a=floorFrom+(floorTo-floorFrom)*i/72;operatorFloorShape.lineTo(Math.sin(a)*1.49,-Math.cos(a)*1.49);}operatorFloorShape.closePath();
  const operatorFloorGeometry=new THREE.ExtrudeGeometry(operatorFloorShape,{depth:.225,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2});resources.push(operatorFloorGeometry);
  const operatorFloor=mesh(operatorFloorGeometry,edge,0,.245,0);operatorFloor.rotation.x=-Math.PI/2;
  arc(1.49,.465,floorFrom,floorTo,.016,pearl);
  // Subtle joints make the raised walking surface legible when rotated.
  for(let joint=1;joint<7;joint++){
    const a=floorFrom+(floorTo-floorFrom)*joint/7;
    tube([new THREE.Vector3(Math.sin(a)*1.52,.481,Math.cos(a)*1.52),new THREE.Vector3(Math.sin(a)*1.86,.481,Math.cos(a)*1.86)],.004,dark);
  }
  // Low fan-shaped treads follow the left aisle up to the control console.
  for(let step=0;step<5;step++){
    const from=Math.PI*1.43+step*.27,to=from+.255;
    const shape=new THREE.Shape();
    for(let i=0;i<=12;i++){const angle=from+(to-from)*i/12;const x=Math.sin(angle)*2.69,y=-Math.cos(angle)*2.69;if(i){shape.lineTo(x,y);}else{shape.moveTo(x,y);}}
    for(let i=12;i>=0;i--){const angle=from+(to-from)*i/12;shape.lineTo(Math.sin(angle)*1.49,-Math.cos(angle)*1.49);}shape.closePath();
    const height=.045*(5-step);
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2});resources.push(geometry);
    const tread=mesh(geometry,edge,0,.245,0);tread.rotation.x=-Math.PI/2;
    // Recessed LED strip in the riser face, just beneath the tread edge.
    const faceAngle=to+.004;
    const lightPoints=[1.59,1.90,2.23,2.58].map(radius=>new THREE.Vector3(Math.sin(faceAngle)*radius,.245+height-.022,Math.cos(faceAngle)*radius));
    tube(lightPoints,.013,navy);
    const ledPoints=lightPoints.map(point=>new THREE.Vector3(point.x+Math.cos(faceAngle)*.020,point.y,point.z-Math.sin(faceAngle)*.020));
    tube(ledPoints,.010,cyan);
    const light=new THREE.PointLight('#36dfff',.012,.32);light.position.copy(ledPoints[1]);group.add(light);
  }
  for(let i=0;i<3;i++){const block=box(pearl,2.45,.49+i*.32,1.20,.78,.30,.73);if(i===2){box(cyan,2.45,1.15,1.20,.67,.035,.63);box(dark,2.45,1.18,1.20,.57,.045,.53);}block.castShadow=true;}
  // Continuous wall-to-equipment runs, with one seated connector per block.
  for(let i=0;i<3;i++){
    const height=.49+i*.32,lane=1.92+i*.045;
    tube([
      new THREE.Vector3(2.88,.65+i*.16,-.70),
      new THREE.Vector3(2.62,.65+i*.16,-.70),
      new THREE.Vector3(2.34,.48+i*.15,-.28),
      new THREE.Vector3(lane,height,.60),
      new THREE.Vector3(lane,height,1.05),
      new THREE.Vector3(2.025,height,1.20),
      new THREE.Vector3(2.105,height,1.20),
    ],.032,i===2?coral:gold);
    const socketGeometry=new THREE.CylinderGeometry(.063,.063,.045,20);resources.push(socketGeometry);
    const socket=mesh(socketGeometry,navy,2.055,height,1.20);socket.rotation.z=Math.PI/2;
  }
  const button=box(pearl,1.94,1.29,-1.29,.42,.62,.42);button.rotation.y=.65;box(gold,1.94,1.63,-1.29,.26,.08,.25);
  const glow=new THREE.PointLight('#35ddff',3,7);glow.position.set(0,2.2,-1.6);group.add(glow);
  let lastUpdate=-Infinity;
  return {group,chair:swivelChair,update(time:number){if(time-lastUpdate<1/12)return;draw(time);lastUpdate=time;}};
}
