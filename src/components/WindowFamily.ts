// A mother and two children feed fish beside the near-shore trees on sunny days.
export function drawWindowFamily(ctx:CanvasRenderingContext2D,time:number,layer:'water'|'people'){
  const phase=time;
  if(phase>=43)return;
  const feeding=phase>=11&&phase<31;
  const moving=!feeding;
  const offset=phase<11?(1-phase/11)*400:phase<31?0:(phase-31)/12*400;
  const feedTime=Math.max(0,phase-11);
  if(layer==='water'){
    if(!feeding)return;
    for(let i=0;i<6;i++){
      const x=968+Math.sin(feedTime*.9+i*1.7)*32+i*7;
      const y=704+(i%3)*8;
      const surface=Math.max(0,Math.sin(feedTime*2.1+i*1.8));
      ctx.save();ctx.translate(x,y);ctx.scale(Math.cos(feedTime*.9+i*1.7)>0?1:-1,1);
      ctx.globalAlpha=.25+surface*.65;
      ctx.fillStyle=i%2?'#c5a56b':'#b98b5e';ctx.beginPath();ctx.ellipse(0,-surface*3,7,2.8,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.moveTo(-6,-surface*3);ctx.lineTo(-11,-3-surface*3);ctx.lineTo(-11,3-surface*3);ctx.closePath();ctx.fill();
      ctx.fillStyle='#53675c';ctx.beginPath();ctx.arc(4,-surface*3,.9,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(238,250,235,.65)';ctx.lineWidth=1;
      ctx.beginPath();ctx.ellipse(0,2,8+surface*6,3,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    return;
  }
  const person=(x:number,y:number,scale:number,kind:'mother'|'girl'|'boy',index:number)=>{
    ctx.save();ctx.translate(x+offset,y);ctx.scale(phase>=31?-scale:scale,scale);ctx.lineCap='round';ctx.lineJoin='round';
    const step=moving?Math.sin(time*5+index)*7:0;
    ctx.fillStyle='rgba(82,97,77,.17)';ctx.beginPath();ctx.ellipse(0,2,12,3,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#485b68';ctx.lineWidth=4;
    for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*3,-24);ctx.lineTo(side*5+side*step,0);ctx.stroke();}
    const clothing=kind==='mother'?'#a18b62':kind==='girl'?'#cc8a9d':'#6298ad';
    ctx.strokeStyle=clothing;ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(0,-25);ctx.lineTo(0,-44);ctx.stroke();
    if(kind==='girl'){ctx.fillStyle=clothing;ctx.beginPath();ctx.moveTo(-5,-32);ctx.lineTo(-11,-19);ctx.lineTo(11,-19);ctx.lineTo(5,-32);ctx.fill();}
    ctx.strokeStyle='#d4a17d';ctx.lineWidth=3;
    if(feeding&&kind!=='mother'){
      const toss=Math.sin(feedTime*2.8+index*.9);
      ctx.beginPath();ctx.moveTo(-5,-41);ctx.lineTo(-13,-37-toss*4);ctx.lineTo(-24,-43-toss*6);ctx.stroke();
      ctx.beginPath();ctx.moveTo(5,-40);ctx.lineTo(10,-29);ctx.lineTo(1,-31);ctx.stroke();
      ctx.fillStyle='#dfd2a4';ctx.fillRect(-2,-34,8,10);
    }else{
      for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*6,-41);ctx.lineTo(side*10-side*step*.4,-27);ctx.stroke();}
    }
    ctx.fillStyle='#d4a17d';ctx.beginPath();ctx.ellipse(0,-55,6,8,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=kind==='boy'?'#76583d':'#54453a';ctx.beginPath();ctx.ellipse(0,-59,6.5,5,0,Math.PI,Math.PI*2);ctx.fill();
    if(kind!=='boy'){ctx.beginPath();ctx.ellipse(5,-53,4,9,-.2,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  };
  person(1124,776,1.08,'mother',0);
  person(1060,771,.78,'boy',1);
  person(1016,769,.74,'girl',2);
  if(feeding){
    // Food follows small arcs from the children's hands to the same patch of water.
    for(let i=0;i<7;i++){
      const flight=(feedTime*.72+i/7)%1;
      const fromX=i%2?1041:998,fromY=i%2?736:735;
      const toX=972+(i%4)*12,toY=705+(i%3)*7;
      const x=fromX+(toX-fromX)*flight,y=fromY+(toY-fromY)*flight-Math.sin(flight*Math.PI)*20;
      ctx.fillStyle='#e7cf8e';ctx.beginPath();ctx.arc(x,y,1.6,0,Math.PI*2);ctx.fill();
    }
  }
}
