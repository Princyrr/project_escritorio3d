export const lakeStrikeAt=18;
export const heronsReturnAt=32;
export function heronFlightHeight(time:number){
  const elapsed=time-lakeStrikeAt;
  if(elapsed<0||time>=heronsReturnAt)return 0;
  const smooth=(t:number)=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  return smooth(elapsed/3)*(1-smooth((time-26)/6));
}
// Only distant cloud flashes repeat; the visible lake strike occurs once per rainy spell.
export function drawWindowStorm(ctx:CanvasRenderingContext2D,time:number){
  const cloudPhase=(time-5)%15;
  const cloudFlash=time>=5&&cloudPhase<.65?Math.sin(cloudPhase/.65*Math.PI)*.20:0;
  const strike=time-lakeStrikeAt;
  const boltVisible=strike>=0&&strike<.55;
  const strikeFlash=strike>=0&&strike<.85?Math.pow(1-strike/.85,2)*.38:0;
  if(cloudFlash||strikeFlash){
    ctx.fillStyle=`rgba(234,241,255,${Math.max(cloudFlash,strikeFlash)})`;ctx.fillRect(0,0,1280,800);
  }
  if(boltVisible){
    ctx.save();ctx.lineJoin='round';ctx.lineCap='round';ctx.globalAlpha*=1-strike/.55;
    const bolt=()=>{ctx.beginPath();ctx.moveTo(1004,10);ctx.lineTo(963,105);ctx.lineTo(987,101);ctx.lineTo(942,206);ctx.lineTo(969,198);ctx.lineTo(927,317);ctx.lineTo(954,307);ctx.lineTo(915,444);ctx.lineTo(941,436);ctx.lineTo(920,531);};
    ctx.shadowColor='#dbe9ff';ctx.shadowBlur=18;ctx.strokeStyle='rgba(195,215,255,.65)';ctx.lineWidth=8;bolt();ctx.stroke();
    ctx.strokeStyle='#f4f7ff';ctx.lineWidth=2.5;bolt();ctx.stroke();ctx.shadowBlur=0;ctx.restore();
  }
  if(strike>=0&&strike<3){
    const fade=1-strike/3;
    ctx.strokeStyle=`rgba(236,245,255,${fade*.7})`;ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(920,533,8+strike*25,3+strike*7,0,0,Math.PI*2);ctx.stroke();
  }
}
