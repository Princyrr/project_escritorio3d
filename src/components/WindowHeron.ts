// A white heron lands near the foreground shore, bathes, then flies across the lake.
export function drawHeron(ctx:CanvasRenderingContext2D,time:number){
  const phase=time%38;
  if(phase>=32)return;
  const landing=phase<9,bathing=phase>=9&&phase<21;
  const progress=landing?phase/9:bathing?0:Math.min((phase-21)/11,1);
  const ease=progress*progress*(3-2*progress);
  const x=landing?-90+600*ease:bathing?510:510+900*progress;
  const y=landing?230+360*ease:bathing?590+Math.sin(time*7)*2:590-300*ease;
  const size=landing?.8+.2*ease:bathing?1:1-.5*progress;
  const flap=Math.sin(time*(bathing?9:5));
  ctx.save();ctx.translate(x,y);ctx.scale(size,size);ctx.lineCap='round';ctx.lineJoin='round';
  if(bathing){
    for(let i=0;i<3;i++){
      const wave=(time*.8+i/3)%1;
      ctx.strokeStyle=`rgba(239,250,244,${.55*(1-wave)})`;ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(0,5,22+wave*33,5+wave*8,0,0,Math.PI*2);ctx.stroke();
    }
    for(let i=0;i<6;i++){
      const drop=(time*1.8+i/6)%1;
      ctx.fillStyle=`rgba(229,248,244,${.7*(1-drop)})`;
      ctx.beginPath();ctx.ellipse((i%2?1:-1)*(12+drop*27),-Math.sin(drop*Math.PI)*23,1.7,2.8,drop,0,Math.PI*2);ctx.fill();
    }
  }
  ctx.strokeStyle='#79755b';ctx.lineWidth=2;
  if(!bathing){
    ctx.beginPath();ctx.moveTo(-7,-8);ctx.lineTo(-27,2);ctx.moveTo(0,-8);ctx.lineTo(-22,6);ctx.stroke();
  }
  ctx.fillStyle='#f6f6ea';ctx.beginPath();ctx.ellipse(-3,-10,20,10,-.12,0,Math.PI*2);ctx.fill();
  // The long S-shaped neck and pointed yellow bill distinguish the heron.
  ctx.strokeStyle='#f6f6ea';ctx.lineWidth=6;
  ctx.beginPath();ctx.moveTo(11,-13);ctx.bezierCurveTo(28,-18,8,-28,18,-38);ctx.stroke();
  ctx.fillStyle='#faf9ed';ctx.beginPath();ctx.ellipse(21,-39,7,5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#c6a359';ctx.beginPath();ctx.moveTo(26,-41);ctx.lineTo(43,-38);ctx.lineTo(26,-36);ctx.closePath();ctx.fill();
  ctx.fillStyle='#3e4b46';ctx.beginPath();ctx.arc(23,-40,1.2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#e2e8e2';ctx.strokeStyle='#f7f7ee';ctx.lineWidth=2;
  const wingHeight=bathing?7+flap*6:flap*30;
  ctx.beginPath();ctx.moveTo(-12,-10);ctx.quadraticCurveTo(-32,-20-wingHeight,-34,-32-wingHeight);
  ctx.quadraticCurveTo(-12,-27-wingHeight,10,-12);ctx.closePath();ctx.fill();ctx.stroke();
  if(bathing){ctx.fillStyle='rgba(148,191,192,.65)';ctx.beginPath();ctx.ellipse(0,1,22,4,0,0,Math.PI*2);ctx.fill();}
  ctx.restore();
}
