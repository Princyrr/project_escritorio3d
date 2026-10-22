// Two visitors approach the monument, pose for a photograph, and leave together.
export function drawMonumentVisitors(ctx:CanvasRenderingContext2D,time:number){
  const phase=Math.min(time,40);
  const arriving=phase<12,posing=phase>=12&&phase<24;
  const arrival=Math.min(phase/12,1),departure=Math.max(0,(phase-24)/16);
  const modelX=arriving?-80+480*arrival:400+departure*1010;
  const cameraX=arriving?-145+395*arrival:250+departure*1160;
  const moving=time>=40||arriving||!posing;
  const drawVisitor=(x:number,y:number,shirt:string,photographer:boolean)=>{
    ctx.save();ctx.translate(x,y);ctx.lineCap='round';ctx.lineJoin='round';
    ctx.fillStyle='rgba(85,96,77,.17)';ctx.beginPath();ctx.ellipse(0,2,16,4,0,0,Math.PI*2);ctx.fill();
    const step=moving?Math.sin(time*5+(photographer?1:0))*8:0;
    ctx.strokeStyle='#3b5264';ctx.lineWidth=5;
    for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*3,-25);ctx.lineTo(side*5+side*step*.45,-12);ctx.lineTo(side*6+side*step,0);ctx.stroke();}
    ctx.strokeStyle=shirt;ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(0,-26);ctx.lineTo(0,-47);ctx.stroke();
    ctx.strokeStyle='#d5a17d';ctx.lineWidth=3.5;
    if(time<40&&posing&&photographer){
      // Raised arms and a phone held toward the posing visitor.
      ctx.beginPath();ctx.moveTo(2,-44);ctx.lineTo(13,-40);ctx.lineTo(18,-52);ctx.moveTo(-4,-43);ctx.lineTo(4,-36);ctx.lineTo(17,-49);ctx.stroke();
      ctx.fillStyle='#344956';ctx.fillRect(16,-58,6,11);ctx.fillStyle='#adcbd1';ctx.fillRect(17,-56,3,6);
      const flash=phase>18&&phase<18.18;
      if(flash){ctx.fillStyle='rgba(255,253,222,.85)';ctx.beginPath();ctx.arc(23,-55,7,0,Math.PI*2);ctx.fill();}
    }else if(time<40&&posing){
      // One hand on the hip, with the other raised in a small wave.
      ctx.beginPath();ctx.moveTo(-5,-44);ctx.lineTo(-15,-33);ctx.lineTo(-6,-29);
      ctx.moveTo(5,-44);ctx.lineTo(14,-51);ctx.lineTo(15,-64);ctx.stroke();
      ctx.fillStyle='#d5a17d';ctx.beginPath();ctx.ellipse(15,-65,3,4,0,0,Math.PI*2);ctx.fill();
    }else{
      for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*6,-43);ctx.lineTo(side*9-side*step*.4,-29);ctx.stroke();}
    }
    ctx.fillStyle='#d5a17d';ctx.beginPath();ctx.ellipse(0,-58,6.5,8,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=photographer?'#644b3c':'#443c34';ctx.beginPath();ctx.ellipse(-1,-62,7,5,0,Math.PI,Math.PI*2);ctx.fill();
    ctx.restore();
  };
  // Match the two shoreline Bézier segments used by the foreground promenade.
  const pathY=(x:number,minimum:number,margin:number)=>{
    const points=x<547?[[0,595],[230,557],[377,595],[547,675]]:[[547,675],[760,768],[1050,746],[1280,699]];
    const cubic=(t:number,axis:number)=>{
      const u=1-t;return u*u*u*points[0][axis]+3*u*u*t*points[1][axis]+3*u*t*t*points[2][axis]+t*t*t*points[3][axis];
    };
    let low=0,high=1;
    for(let i=0;i<14;i++){const middle=(low+high)/2;if(cubic(middle,0)<x)low=middle;else high=middle;}
    return Math.max(minimum,cubic((low+high)/2,1)+margin);
  };
  if(time<40){
    drawVisitor(modelX,pathY(modelX,723,32),'#c48472',false);
    drawVisitor(cameraX,pathY(cameraX,746,48),'#7299a4',true);
  }else{
    // Once the photo visitors leave, ordinary walkers alternate directions indefinitely.
    const walkingTime=time-40,duration=24,gap=3;
    const pass=Math.floor(walkingTime/(duration+gap));
    const progress=(walkingTime%(duration+gap))/duration;
    if(progress<=1){
      const rightward=pass%2===0;
      const x=rightward?-60+1400*progress:1340-1400*progress;
      const colors=['#739da5','#bc866e','#839a75','#b09a64'];
      drawVisitor(x,pathY(x,731,40),colors[pass%colors.length],false);
    }
  }
}
