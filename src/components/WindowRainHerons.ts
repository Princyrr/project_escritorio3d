import { heronFlightHeight, lakeStrikeAt, heronsReturnAt } from './WindowStorm';
// The flock lands once per rainy spell, then stays within the visible open water.
export function drawRainHerons(ctx:CanvasRenderingContext2D,time:number){
  const flight=heronFlightHeight(time);
  const flightActive=time>=lakeStrikeAt&&time<heronsReturnAt;
  // Pause the swimming route while the flock takes flight, then continue from the same place.
  const swimTime=Math.max(0,(time<lakeStrikeAt?time:time<heronsReturnAt?lakeStrikeAt:time-(heronsReturnAt-lakeStrikeAt))-7);
  // Keep the landing and swimming route in the right pane, clear of the central frame.
  const centerX=970+Math.sin(swimTime*.16)*70;
  const direction=Math.cos(swimTime*.16)>=0?1:-1;
  for(let i=0;i<3;i++){
    const descent=Math.min(1,Math.max(0,(time-i*.55)/5.5));
    const eased=descent*descent*(3-2*descent);
    const x=centerX+(i-1)*59-flight*90;
    const waterY=545+(i===1?15:i===2?-8:0);
    const y=100+i*25+(waterY-100-i*25)*eased+(descent===1?Math.sin(time*1.5+i)*1.5:0)-flight*(235+i*15);
    ctx.save();ctx.translate(x,y);ctx.scale(direction*.75,.75);ctx.lineCap='round';ctx.lineJoin='round';
    if(descent===1&&!flightActive){
      for(let wave=0;wave<3;wave++){
        const pulse=(time*.55+wave/3+i*.12)%1;
        ctx.strokeStyle=`rgba(232,246,244,${.5*(1-pulse)})`;ctx.lineWidth=1.6;
        ctx.beginPath();ctx.ellipse(-3-pulse*12,5,23+pulse*17,5+pulse*4,0,0,Math.PI*2);ctx.stroke();
      }
    }
    ctx.fillStyle='#f3f3e7';ctx.beginPath();ctx.ellipse(-4,-8,20,9,-.08,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#f4f4e9';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(9,-11);ctx.bezierCurveTo(27,-18,8,-25,18,-34);ctx.stroke();
    ctx.fillStyle='#f7f6e9';ctx.beginPath();ctx.ellipse(21,-35,7,5,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#bd9b55';ctx.beginPath();ctx.moveTo(26,-37);ctx.lineTo(42,-34);ctx.lineTo(26,-32);ctx.closePath();ctx.fill();
    ctx.fillStyle='#364845';ctx.beginPath();ctx.arc(23,-36,1.2,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#dce5e0';
    if(descent<1||flightActive){
      const flap=Math.sin(time*5.8+i)*25;
      ctx.beginPath();ctx.moveTo(-12,-8);ctx.quadraticCurveTo(-33,-20-flap,-36,-32-flap);ctx.quadraticCurveTo(-12,-25-flap,10,-10);ctx.closePath();ctx.fill();
    }else{
      ctx.beginPath();ctx.ellipse(-7,-10,13,5,-.15,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(174,207,207,.65)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-25,1);ctx.quadraticCurveTo(-4,6,18,1);ctx.stroke();
    }
    ctx.restore();
  }
}
