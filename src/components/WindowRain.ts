import { drawWindowStorm } from './WindowStorm';
import { drawRainHerons } from './WindowRainHerons';
// Weather is confined to the outdoor canvas; the room and its controls stay responsive.
export function drawRainyWindow(ctx:CanvasRenderingContext2D,time:number,amount:number,people=true,drawForeground?:()=>void,rainTime=0){
  ctx.save();ctx.globalAlpha=amount;
  ctx.fillStyle='rgba(76,94,109,.38)';ctx.fillRect(0,0,1280,800);
  // Dense low cloud cover obscures the sunny sky while preserving the city below.
  const sky=ctx.createLinearGradient(0,0,0,340);
  sky.addColorStop(0,'#9aa8b4');sky.addColorStop(.64,'#b1bbc1');sky.addColorStop(1,'rgba(177,187,193,0)');
  ctx.fillStyle=sky;ctx.fillRect(0,0,1280,340);
  for(let i=0;i<8;i++){
    const x=((i*223+time*5)%1660)-190;
    ctx.fillStyle=i%2?'rgba(139,154,166,.24)':'rgba(220,226,227,.23)';
    ctx.beginPath();ctx.ellipse(x,65+(i%3)*48,200,40,0,0,Math.PI*2);ctx.fill();
  }
  if(people){drawWindowStorm(ctx,rainTime);drawRainHerons(ctx,rainTime);}
  drawForeground?.();
  const nearPathY=(x:number)=>{
    const points=x<547?[[0,595],[230,557],[377,595],[547,675]]:[[547,675],[760,768],[1050,746],[1280,699]];
    const cubic=(t:number,axis:number)=>{const u=1-t;return u*u*u*points[0][axis]+3*u*u*t*points[1][axis]+3*u*t*t*points[2][axis]+t*t*t*points[3][axis];};
    let low=0,high=1;for(let i=0;i<14;i++){const mid=(low+high)/2;if(cubic(mid,0)<x)low=mid;else high=mid;}
    return Math.max(730,cubic((low+high)/2,1)+45);
  };
  if(people){
    // Umbrella walkers use both promenades and follow the curved near shore.
    for(let i=0;i<5;i++){
      const progress=((time*.018+i*.34)%1),direction=i%2?-1:1;
      const x=direction===1?-65+1410*progress:1345-1410*progress;
      ctx.save();ctx.translate(x,i<3?421:nearPathY(x));if(i>=3)ctx.scale(1.5,1.5);ctx.lineCap='round';
      const stride=Math.sin(time*4+i)*5;
      ctx.strokeStyle='#43576a';ctx.lineWidth=3;
      for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(side*stride,0);ctx.stroke();}
      ctx.strokeStyle=['#ad8273','#759597','#9b916c'][i%3];ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(0,-30);ctx.stroke();
      ctx.fillStyle='#cda080';ctx.beginPath();ctx.arc(0,-36,4,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#716f61';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(7,-21);ctx.lineTo(7,-53);ctx.stroke();
      ctx.strokeStyle='#cda080';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(1,-28);ctx.lineTo(7,-24);ctx.stroke();
      ctx.fillStyle=['#557c98','#a57578','#7b8a64'][i%3];ctx.beginPath();ctx.moveTo(-14,-45);ctx.quadraticCurveTo(-10,-65,7,-61);ctx.quadraticCurveTo(24,-64,29,-45);ctx.quadraticCurveTo(18,-49,7,-45);ctx.quadraticCurveTo(-3,-49,-14,-45);ctx.fill();
      ctx.restore();
    }
  }
  ctx.strokeStyle='rgba(227,239,245,.48)';ctx.lineWidth=1.2;
  for(let i=0;i<130;i++){
    const x=((i*137-time*55)%1360+1360)%1360-40,y=(i*73+time*240)%840-20;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-5,y+14);ctx.stroke();
  }
  ctx.strokeStyle='rgba(224,241,240,.30)';ctx.lineWidth=1;
  for(let i=0;i<18;i++){
    const pulse=(time*.8+i*.19)%1;
    ctx.beginPath();ctx.ellipse(i*173%1280,456+(i*29%116),3+pulse*10,1+pulse*2,0,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}
