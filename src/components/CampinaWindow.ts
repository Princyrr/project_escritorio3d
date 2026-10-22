import { drawWindowFamily } from './WindowFamily';
import { drawPioneersMonument } from './WindowMonument';
import { drawRainyWindow } from './WindowRain';
import { drawMonumentVisitors } from './WindowMonumentVisitors';
import { drawHeron } from './WindowHeron';
import * as THREE from 'three';

// Illustrated interpretation of Açude Velho, not a literal photographic view.
export function createCampinaWindow(resources:Array<{dispose:()=>void}>) {
  const width=1280,height=800;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d')!;
  const backdrop=document.createElement('canvas');backdrop.width=width;backdrop.height=height;
  const bg=backdrop.getContext('2d')!;
  const sky=bg.createLinearGradient(0,0,0,470);sky.addColorStop(0,'#acd8eb');sky.addColorStop(1,'#f0f1dd');bg.fillStyle=sky;bg.fillRect(0,0,width,height);
  // Warm halo stays in the sky, centered on the window's sun.
  const sunlight=bg.createRadialGradient(1020,120,18,1020,120,165);
  sunlight.addColorStop(0,'rgba(255,255,236,1)');
  sunlight.addColorStop(.28,'rgba(255,246,197,.85)');
  sunlight.addColorStop(.55,'rgba(255,235,171,.32)');
  sunlight.addColorStop(1,'rgba(255,235,171,0)');
  bg.fillStyle=sunlight;bg.fillRect(850,0,340,290);
  bg.fillStyle='#fffbe6';bg.shadowColor='#fff1b5';bg.shadowBlur=26;
  bg.beginPath();bg.arc(1020,120,42,0,Math.PI*2);bg.fill();bg.shadowBlur=0;
  const cloud=(x:number,y:number,scale:number)=>{bg.fillStyle='rgba(255,255,255,.63)';bg.beginPath();bg.ellipse(x,y,85*scale,19*scale,0,0,Math.PI*2);bg.ellipse(x-25*scale,y-13*scale,38*scale,27*scale,0,0,Math.PI*2);bg.ellipse(x+24*scale,y-9*scale,43*scale,25*scale,0,0,Math.PI*2);bg.fill();};
  cloud(225,130,1.2);cloud(686,102,.9);cloud(1120,219,1.1);
  bg.fillStyle='#b6cdbd';bg.beginPath();bg.moveTo(0,355);for(let x=0;x<=width;x+=32)bg.lineTo(x,294+18*Math.sin(x*.008)+12*Math.sin(x*.019));bg.lineTo(width,450);bg.lineTo(0,450);bg.fill();
  const buildings=[[0,280,75,125],[80,248,72,157],[165,295,65,110],[238,220,86,185],[334,274,64,131],[408,245,68,160],[487,297,66,108],[560,207,91,198],[664,270,62,135],[738,241,73,164],[825,282,70,123],[908,225,83,180],[1004,267,58,138],[1076,244,78,161],[1167,290,106,115]];
  buildings.forEach(([x,y,w,h],index)=>{
    bg.fillStyle=['#d6dccc','#e8deca','#b9cbd0','#e6e5d9'][index%4];bg.fillRect(x,y,w,h);
    bg.fillStyle='rgba(95,135,151,.24)';bg.beginPath();bg.moveTo(x+w,y);bg.lineTo(x+w+10,y+10);bg.lineTo(x+w+10,y+h);bg.lineTo(x+w,y+h);bg.fill();
    bg.fillStyle='#8faeb9';for(let row=0;row<Math.floor(h/23)-1;row++)for(let col=0;col<Math.floor(w/20)-1;col++)bg.fillRect(x+12+col*21,y+13+row*24,8,10);
  });
  // Low houses on the waterfront contrast with the taller skyline behind.
  for(let i=0;i<13;i++){
    const x=18+i*99,y=355+(i%3)*5,w=73,h=47;
    bg.fillStyle=['#e8d6bc','#e2e6db','#d9c7b9','#cbdcd9'][i%4];bg.fillRect(x,y,w,h);
    bg.fillStyle=i%2?'#a97862':'#b18c72';bg.beginPath();bg.moveTo(x-5,y+2);bg.lineTo(x+w*.5,y-29);bg.lineTo(x+w+5,y+2);bg.closePath();bg.fill();
    bg.fillStyle='#9bb6bd';bg.fillRect(x+11,y+15,15,17);bg.fillRect(x+46,y+15,14,17);
    bg.fillStyle='#9a9884';bg.fillRect(x+31,y+22,12,25);
    bg.fillStyle='#efeadc';bg.fillRect(x+8,y+32,21,3);bg.fillRect(x+43,y+32,20,3);
  }
  const palm=(c:CanvasRenderingContext2D,x:number,y:number,size:number)=>{
    c.save();c.translate(x,y);c.lineCap='round';
    const topX=size*.10,topY=-size*.95;
    c.strokeStyle='#a08e6b';c.lineWidth=Math.max(2,size*.055);
    c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(size*.035,-size*.55,topX,topY);c.stroke();
    c.strokeStyle='#827453';c.lineWidth=Math.max(.7,size*.012);
    for(let i=1;i<8;i++){const t=i/8;c.beginPath();c.moveTo(size*.1*t-size*.026,-size*.95*t);c.lineTo(size*.1*t+size*.025,-size*.95*t+size*.015);c.stroke();}
    for(let i=0;i<14;i++){
      const side=i%2?-1:1,level=Math.floor(i/2)*.60;
      const endX=topX+side*size*(.37+level*.045),endY=topY+size*(-.10+level*.13);
      const controlX=topX+side*size*.28,controlY=topY-size*(.30-level*.045);
      c.strokeStyle=i%3?'#6f9b76':'#8cab76';c.lineWidth=Math.max(1,size*.022);
      c.beginPath();c.moveTo(topX,topY);c.quadraticCurveTo(controlX,controlY,endX,endY);c.stroke();
      c.lineWidth=Math.max(.7,size*.012);
      for(let j=1;j<14;j++){
        const t=j/14,u=1-t,px=u*u*topX+2*u*t*controlX+t*t*endX,py=u*u*topY+2*u*t*controlY+t*t*endY;
        const length=size*.14*Math.sin(t*Math.PI);
        c.beginPath();c.moveTo(px,py);c.lineTo(px-side*length*.35,py+length);c.moveTo(px,py);c.lineTo(px+side*length*.5,py+length*.7);c.stroke();
      }
    }
    c.fillStyle='#8b7952';for(const offset of [-.035,.025]){c.beginPath();c.ellipse(topX+size*offset,topY+size*.035,size*.025,size*.035,0,0,Math.PI*2);c.fill();}
    c.restore();
  };
  const shadeTree=(c:CanvasRenderingContext2D,x:number,y:number,size:number)=>{
    c.fillStyle='#938268';c.fillRect(x-size*.055,y-size*.68,size*.11,size*.68);
    c.fillStyle='#7f9f7a';c.beginPath();c.ellipse(x,y-size*.78,size*.30,size*.31,0,0,Math.PI*2);c.fill();
    c.fillStyle='#94ae84';c.beginPath();c.ellipse(x-size*.10,y-size*.89,size*.23,size*.23,0,0,Math.PI*2);c.fill();
  };
  for(let i=0;i<18;i++)palm(bg,i*76+15,411,52+(i%3)*12);
  for(const i of [1,4,7,10,13,15])shadeTree(bg,i*76+53,411,65+(i%3)*8);
  bg.fillStyle='#ddd9bf';bg.fillRect(0,411,width,13);bg.fillStyle='#f2ead6';bg.fillRect(0,424,width,9);
  const water=bg.createLinearGradient(0,432,0,height);water.addColorStop(0,'#91bfc2');water.addColorStop(.45,'#83b9c2');water.addColorStop(1,'#b1d6d5');bg.fillStyle=water;bg.fillRect(0,433,width,height-433);
  // Soft vertical skyline reflections on the lake.
  buildings.forEach(([x,,w,h])=>{const gradient=bg.createLinearGradient(0,435,0,435+h*.65);gradient.addColorStop(0,'rgba(216,229,220,.25)');gradient.addColorStop(1,'rgba(216,229,220,0)');bg.fillStyle=gradient;bg.fillRect(x,435,w,h*.65);});
  const foreground=document.createElement('canvas');foreground.width=width;foreground.height=height;const front=foreground.getContext('2d')!;
  // Curving waterfront promenade, with a pale stone monument based on the supplied photograph.
  front.fillStyle='#d9d8bd';front.beginPath();front.moveTo(0,595);front.bezierCurveTo(230,557,377,595,547,675);front.bezierCurveTo(760,768,1050,746,1280,699);front.lineTo(1280,800);front.lineTo(0,800);front.closePath();front.fill();
  front.strokeStyle='#f5efdb';front.lineWidth=11;front.beginPath();front.moveTo(0,595);front.bezierCurveTo(230,557,377,595,547,675);front.bezierCurveTo(760,768,1050,746,1280,699);front.stroke();
  front.fillStyle='#96ad88';front.beginPath();front.ellipse(205,715,220,65,-.05,0,Math.PI*2);front.fill();
  drawPioneersMonument(front);
  palm(front,64,655,128);palm(front,1190,720,156);
  shadeTree(front,20,673,118);shadeTree(front,1250,744,140);
  const rainyForeground=document.createElement('canvas');rainyForeground.width=width;rainyForeground.height=height;
  const rainyFront=rainyForeground.getContext('2d')!;rainyFront.drawImage(foreground,0,0);
  rainyFront.globalCompositeOperation='source-atop';rainyFront.fillStyle='rgba(76,94,109,.38)';rainyFront.fillRect(0,0,width,height);
  const drawRainForeground=()=>ctx.drawImage(rainyForeground,0,0);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;resources.push(texture);
  let previous=-Infinity,lastActivity=performance.now(),sunnyStartedAt:number|null=null;
  let rainAmount=0,rainy=false,manualRain=false,rainStartedAt:number|null=null;
  const resumeSunny=()=>{
    lastActivity=performance.now();
    if(rainy&&!manualRain){rainy=false;rainStartedAt=null;sunnyStartedAt=null;previous=-Infinity;}
  };
  const activityEvents=['pointermove','pointerdown','touchstart','wheel','keydown'] as const;
  for(const event of activityEvents)window.addEventListener(event,resumeSunny,{passive:true});
  resources.push({dispose(){for(const event of activityEvents)window.removeEventListener(event,resumeSunny);}});
  const update=(clock:number)=>{
    if(clock-previous<.05)return;
    const elapsed=Number.isFinite(previous)?Math.min(.2,Math.max(0,clock-previous)):.05;
    previous=clock;
    if(performance.now()-lastActivity>=300000)rainy=true;
    rainAmount=THREE.MathUtils.damp(rainAmount,rainy?1:0,1.4,elapsed);
    if(sunnyStartedAt===null)sunnyStartedAt=clock;
    const time=clock-sunnyStartedAt;
    ctx.drawImage(backdrop,0,0);
    if(rainy){
      if(rainStartedAt===null)rainStartedAt=clock;
      ctx.drawImage(foreground,0,0);
      drawRainyWindow(ctx,clock,rainAmount,true,drawRainForeground,clock-rainStartedAt);
      texture.needsUpdate=true;return;
    }
    ctx.lineCap='round';
    for(let i=0;i<20;i++){
      const x=i*179%1280+Math.sin(time*.25+i)*5,y=450+(i*41%300);
      ctx.strokeStyle='rgba(236,250,243,.10)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+20,y+1,x+40,y);ctx.stroke();
    }
    // Cyclist follows the distant waterfront promenade, in front of the buildings.
    const cycleLeg=40,cycleWait=2,promenadeTime=time%120;
    const cycleTime=Math.min(promenadeTime,84);
    if(promenadeTime<84){
    for(let cyclist=0;cyclist<2;cyclist++){
    const ridingBack=(cycleTime>=cycleLeg+cycleWait)!==(cyclist===1);
    const rideProgress=Math.min((cycleTime%(cycleLeg+cycleWait))/cycleLeg,1);
    const riderX=ridingBack?1335-1390*rideProgress:-55+1390*rideProgress;
    ctx.save();ctx.translate(riderX,cyclist===0?417:422);ctx.scale(ridingBack?-1:1,1);
    ctx.lineCap='round';ctx.lineJoin='round';
    ctx.fillStyle='rgba(70,87,72,.15)';ctx.beginPath();ctx.ellipse(0,5,28,3,0,0,Math.PI*2);ctx.fill();
    const wheel=(x:number)=>{
      ctx.strokeStyle='#415b60';ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(x,-3,10,0,Math.PI*2);ctx.stroke();
      ctx.save();ctx.translate(x,-3);ctx.rotate(-time*3);
      ctx.strokeStyle='rgba(85,110,112,.55)';ctx.lineWidth=.8;
      for(let i=0;i<4;i++){ctx.rotate(Math.PI/4);ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(9,0);ctx.stroke();}ctx.restore();
    };
    wheel(-18);wheel(18);
    ctx.strokeStyle='#976950';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-18,-3);ctx.lineTo(-8,-18);ctx.lineTo(2,-3);ctx.closePath();
    ctx.moveTo(-8,-18);ctx.lineTo(11,-18);ctx.lineTo(2,-3);ctx.moveTo(18,-3);ctx.lineTo(10,-23);ctx.lineTo(16,-25);ctx.stroke();
    ctx.strokeStyle='#415b60';ctx.beginPath();ctx.moveTo(-13,-20);ctx.lineTo(-5,-20);ctx.stroke();
    const pedal=time*4,footX=2+Math.cos(pedal)*6,footY=-3+Math.sin(pedal)*6;
    ctx.strokeStyle='#354f68';ctx.lineWidth=3.5;
    ctx.beginPath();ctx.moveTo(-8,-22);ctx.lineTo(-3,-13);ctx.lineTo(4-Math.cos(pedal)*6,-3-Math.sin(pedal)*6);ctx.stroke();
    ctx.strokeStyle='#d69b77';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.moveTo(2,-32);ctx.lineTo(6,-24);ctx.lineTo(14,-23);ctx.stroke();
    ctx.strokeStyle=ridingBack?'#6786b0':'#c47758';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-8,-23);ctx.lineTo(1,-33);ctx.stroke();
    ctx.strokeStyle='#293f59';ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(-8,-22);ctx.lineTo(-10+Math.cos(pedal)*3,-12);ctx.lineTo(footX,footY);ctx.stroke();
    ctx.fillStyle='#d8a680';ctx.beginPath();ctx.arc(3,-40,4.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#477987';ctx.beginPath();ctx.ellipse(2,-43,5.5,3.5,-.15,Math.PI,Math.PI*2);ctx.fill();
    ctx.restore();
    }
    }
    // After the cyclist, two runners share the path; a dog walker follows them.
    const drawPerson=(x:number,shirt:string,phase:number,running:boolean)=>{
      ctx.save();ctx.translate(x,421);ctx.lineCap='round';ctx.lineJoin='round';
      const swing=Math.sin(phase),stride=running?10:6;
      ctx.fillStyle='rgba(70,87,72,.13)';ctx.beginPath();ctx.ellipse(0,1,11,2,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#344b62';ctx.lineWidth=3;
      for(const side of [-1,1]){
        ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(side*swing*stride*.6,-9);ctx.lineTo(side*swing*stride,0);ctx.stroke();
      }
      ctx.strokeStyle=shirt;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(running?3:0,-30);ctx.stroke();
      ctx.strokeStyle='#d8a680';ctx.lineWidth=2.5;
      for(const side of [-1,1]){
        ctx.beginPath();ctx.moveTo(running?3:0,-28);ctx.lineTo(side*swing*6,-22);ctx.lineTo(side*swing*8+(running?4:0),running?-26:-17);ctx.stroke();
      }
      ctx.fillStyle='#d8a680';ctx.beginPath();ctx.arc(running?4:0,-37,4,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#665041';ctx.beginPath();ctx.ellipse(running?3:0,-39,4,2.5,0,Math.PI,Math.PI*2);ctx.fill();ctx.restore();
    };
    if(promenadeTime>=26&&promenadeTime<56){
      const runnersX=-70+(promenadeTime-26)/30*1470;
      drawPerson(runnersX,'#638f80',time*7,true);
      drawPerson(runnersX-27,'#bd7b68',time*7+.9,true);
    }
    if(promenadeTime>=28&&promenadeTime<68){
      ctx.save();ctx.translate(width,0);ctx.scale(-1,1);
      const walkerX=-70+(promenadeTime-28)/40*1470;
      drawPerson(walkerX,'#b29a58',time*3.8,false);
      ctx.save();ctx.translate(walkerX+36,420);ctx.lineCap='round';
      ctx.strokeStyle='#786f5c';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(-36,-17);ctx.quadraticCurveTo(-18,-8,-2,-13);ctx.stroke();
      ctx.fillStyle='#a57c54';ctx.beginPath();ctx.ellipse(0,-8,10,4.5,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#a57c54';ctx.lineWidth=2.3;
      for(const side of [-1,1]){
        const gait=Math.sin(time*6+side)*3;
        ctx.beginPath();ctx.moveTo(side*6,-7);ctx.lineTo(side*6+gait,0);ctx.stroke();
      }
      ctx.beginPath();ctx.moveTo(-9,-9);ctx.quadraticCurveTo(-16,-12,-14,-18);ctx.stroke();
      ctx.fillStyle='#a57c54';ctx.beginPath();ctx.ellipse(10,-13,5,4.5,-.25,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#74553c';ctx.beginPath();ctx.ellipse(7,-12,2,4,-.3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#39463d';ctx.beginPath();ctx.arc(14,-14,1.3,0,Math.PI*2);ctx.fill();ctx.restore();
      ctx.restore();
    }
    if(promenadeTime>=64&&promenadeTime<110){
      const vendorX=-90+(promenadeTime-64)/46*1490;
      drawPerson(vendorX,'#e4d9bd',time*3.5,false);
      ctx.save();ctx.translate(vendorX,421);ctx.lineJoin='round';ctx.lineCap='round';
      // The seller's hands reach the handle of the insulated ice-pop cart.
      ctx.strokeStyle='#d8a680';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(1,-27);ctx.lineTo(10,-23);ctx.lineTo(18,-24);ctx.stroke();
      ctx.strokeStyle='#687c7c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(16,-24);ctx.lineTo(23,-24);ctx.lineTo(26,-13);ctx.stroke();
      ctx.fillStyle='#e7ede4';ctx.fillRect(22,-25,30,22);
      ctx.fillStyle='#72a8ae';ctx.fillRect(22,-15,30,12);
      ctx.fillStyle='#faf8e8';ctx.fillRect(20,-28,34,4);
      ctx.strokeStyle='#52666b';ctx.lineWidth=1;ctx.strokeRect(22,-25,30,22);
      ctx.fillStyle='#48595d';
      for(const wheelX of [27,47]){ctx.beginPath();ctx.arc(wheelX,-1,4,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle='#f3b188';ctx.beginPath();ctx.roundRect(34,-22,6,9,2);ctx.fill();
      ctx.strokeStyle='#e8d6a1';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(37,-13);ctx.lineTo(37,-10);ctx.stroke();
      ctx.fillStyle='#f1e8ce';ctx.beginPath();ctx.ellipse(0,-41,7,2,0,0,Math.PI*2);ctx.fill();ctx.fillRect(-4,-45,8,4);
      ctx.restore();
    }
    // A small flock crosses the sun together, then returns from the other side.
    const birdLeg=25,birdPause=2,birdCycle=time%((birdLeg+birdPause)*2);
    const birdsReturning=birdCycle>=birdLeg+birdPause;
    const birdProgress=Math.min((birdCycle%(birdLeg+birdPause))/birdLeg,1);
    const flockX=birdsReturning?1450-1620*birdProgress:-170+1620*birdProgress;
    const birdDirection=birdsReturning?-1:1;
    for(let i=0;i<3;i++){
      const birdX=flockX-birdDirection*i*48;
      const birdY=120+(i===1?-17:i===2?14:0)+Math.sin(time*.9)*5;
      const wingLift=Math.sin(time*5.2+i*.55)*9;
      ctx.save();ctx.translate(birdX,birdY);ctx.scale(birdDirection,1);
      ctx.strokeStyle='#4a6268';ctx.lineWidth=3;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(-17,-wingLift);
      ctx.quadraticCurveTo(-8,-5,0,2);
      ctx.quadraticCurveTo(8,-5,17,-wingLift);ctx.stroke();
      ctx.fillStyle='#4a6268';ctx.beginPath();ctx.ellipse(0,2,3,2,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
    // Each crossing ends fully outside the view before the return trip begins.
    const crossingDuration=22,pauseDuration=1.5;
    const legDuration=crossingDuration+pauseDuration;
    const swimCycle=((time%(legDuration*2))+legDuration*2)%(legDuration*2);
    const returning=swimCycle>=legDuration;
    const legTime=swimCycle%legDuration;
    const progress=Math.min(legTime/crossingDuration,1);
    const crocodileX=returning?1560-1840*progress:-280+1840*progress;
    const facing=returning?-1:1;
    ctx.save();ctx.translate(crocodileX,518+Math.sin(time*1.6)*1.4);ctx.scale(facing,1);
    // The swimming wake spreads outward from the snout along both sides of the body.
    for(let i=0;i<5;i++){
      const phase=(time*.65+i/5)%1;
      const drift=phase*95;
      ctx.strokeStyle=`rgba(234,250,239,${.52*(1-phase)})`;ctx.lineWidth=2.5;
      for(const side of [-1,1]){
        ctx.beginPath();ctx.moveTo(55-drift,7+side*(3+phase*5));
        ctx.bezierCurveTo(5-drift,7+side*(12+phase*10),-130-drift,7+side*(18+phase*15),-255-drift,7+side*(24+phase*18));ctx.stroke();
      }
    }
    ctx.fillStyle='rgba(46,88,75,.22)';ctx.beginPath();ctx.ellipse(3,7,51,7,0,0,Math.PI*2);ctx.fill();
    // The broad back and tapered tail remain partly above the water.
    ctx.save();ctx.translate(0,9);ctx.scale(1,.38);ctx.translate(0,-9);
    ctx.fillStyle='#627f50';ctx.beginPath();ctx.moveTo(-242,11);
    ctx.bezierCurveTo(-215,8,-203,3,-181,-3);
    ctx.bezierCurveTo(-151,-18,-111,-20,-84,-10);
    ctx.bezierCurveTo(-72,-7,-67,3,-58,8);
    ctx.bezierCurveTo(-111,18,-183,18,-242,11);
    ctx.closePath();ctx.fill();
    ctx.strokeStyle='#405c3e';ctx.lineWidth=2;ctx.beginPath();
    ctx.moveTo(-211,8);ctx.lineTo(-194,3);ctx.lineTo(-184,5);
    ctx.lineTo(-171,-3);ctx.lineTo(-158,0);ctx.lineTo(-145,-9);
    ctx.lineTo(-132,-5);ctx.lineTo(-119,-12);ctx.lineTo(-105,-6);
    ctx.lineTo(-93,-7);ctx.lineTo(-80,1);ctx.stroke();
    ctx.strokeStyle='rgba(149,172,112,.55)';ctx.lineWidth=2;
    for(let i=0;i<5;i++){
      const x=-177+i*20;
      ctx.beginPath();ctx.moveTo(x,8);ctx.quadraticCurveTo(x+4,4,x+10,7);ctx.stroke();
    }
    ctx.strokeStyle='rgba(223,244,228,.40)';ctx.lineWidth=1.5;ctx.beginPath();
    ctx.moveTo(-245,12);ctx.bezierCurveTo(-183,22,-104,20,-57,9);ctx.stroke();
    ctx.restore();
    // One continuous head outline with a long rounded snout.
    ctx.fillStyle='#627f50';ctx.beginPath();ctx.moveTo(-65,8);
    ctx.lineTo(-17,-15);
    ctx.quadraticCurveTo(-10,-27,-1,-17);ctx.quadraticCurveTo(8,-23,14,-13);
    ctx.bezierCurveTo(27,-10,48,-10,51,-3);
    ctx.quadraticCurveTo(55,5,39,7);ctx.lineTo(-65,8);ctx.closePath();ctx.fill();
    ctx.fillStyle='#8fa36a';ctx.beginPath();ctx.ellipse(25,-4,23,4,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#d5dca1';ctx.beginPath();ctx.ellipse(-5,-17,4.5,4,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#253c2c';ctx.beginPath();ctx.ellipse(-4,-17,1.6,3,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(44,-5,2,1.5,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#405c3e';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(4,3);ctx.quadraticCurveTo(25,5,46,2);ctx.stroke();
    ctx.strokeStyle='rgba(223,244,228,.45)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-68,8);ctx.quadraticCurveTo(0,12,54,7);ctx.stroke();
    ctx.restore();
    drawHeron(ctx,time);
    drawWindowFamily(ctx,time,'water');
    ctx.drawImage(foreground,0,0);drawMonumentVisitors(ctx,time);
    drawWindowFamily(ctx,time,'people');
    if(rainAmount>.01)drawRainyWindow(ctx,clock,rainAmount,false,drawRainForeground);
    texture.needsUpdate=true;
  };
  update(0);return {texture,update,isRainy:()=>rainy,setWeather(rain:boolean){
    if(rain!==rainy)rainStartedAt=null;
    manualRain=rain;rainy=rain;lastActivity=performance.now();previous=-Infinity;
    if(!rain)sunnyStartedAt=null;
  }};
}
