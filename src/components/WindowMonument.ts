// Stylized stone silhouettes follow the supplied photograph of the three pioneers.
export function drawPioneersMonument(ctx:CanvasRenderingContext2D){
  ctx.save();ctx.translate(220,642);ctx.scale(.88,.88);ctx.lineJoin='round';ctx.lineCap='round';
  const stone=(outline:string,shade=false)=>{
    const path=new Path2D(outline),tone=ctx.createLinearGradient(-105,-230,115,0);
    tone.addColorStop(0,shade?'#b4b298':'#e0ddc4');tone.addColorStop(.48,shade?'#c8c6ad':'#d0ceb5');tone.addColorStop(1,'#a5a68f');
    ctx.fillStyle=tone;ctx.fill(path);
    ctx.save();ctx.clip(path);ctx.fillStyle='rgba(91,94,76,.16)';
    for(let i=0;i<420;i++){const x=(i*73%239)-115,y=-(i*47%280);ctx.fillRect(x,y,i%3===0?1.5:.7,.8);}ctx.restore();
    ctx.strokeStyle='rgba(100,105,87,.30)';ctx.lineWidth=.8;ctx.stroke(path);
  };
  // The wide access ramp spans the front of the monument's platform.
  stone('M -170 25 L 164 24 L 220 110 L -200 112 Z');
  stone('M -200 112 L 220 110 L 220 118 L -200 120 Z',true);
  stone('M 164 24 L 172 30 L 220 110 L 220 118 Z',true);
  ctx.strokeStyle='rgba(116,120,101,.28)';ctx.lineWidth=1;
  for(let i=1;i<7;i++){
    const t=i/7;
    ctx.beginPath();ctx.moveTo(-170-30*t,25+87*t);ctx.lineTo(164+56*t,24+86*t);ctx.stroke();
  }
  // Broad low stone plinth, in perspective.
  stone('M -155 1 L 102 -1 L 164 24 L -170 25 Z');
  stone('M -170 25 L 164 24 L 164 35 L -170 36 Z',true);
  ctx.save();ctx.scale(.80,.64);
  ctx.save();ctx.scale(1,1.30);
  // Right figure: long coat, cap, open stance and an arm toward the central figure.
  stone('M 61 -157 L 87 -154 L 99 -72 L 113 -8 L 131 -3 L 104 1 L 79 -58 L 66 -7 L 49 -3 L 55 -78 L 51 -140 Z',true);
  stone('M 58 -155 Q 48 -152 48 -135 L 24 -140 L 20 -129 L 56 -119 L 67 -132 Z',true);
  stone('M 62 -166 Q 54 -183 68 -188 Q 84 -189 84 -176 L 79 -161 Z');
  stone('M 56 -187 L 83 -191 L 88 -181 L 59 -178 Z',true);
  ctx.restore();
  ctx.save();ctx.scale(1,1.335);
  // Left figure: tunic, necklace, banded trousers and the characteristic outstretched arm.
  stone('M -105 -160 Q -107 -173 -93 -176 Q -80 -175 -79 -162 L -83 -151 L -101 -150 Z');
  stone('M -109 -182 L -80 -186 L -77 -175 L -107 -171 Z');
  stone('M -105 -148 L -82 -150 L -74 -139 L -22 -138 L -22 -126 L -78 -128 L -75 -68 L -111 -68 L -115 -131 Z');
  stone('M -114 -135 L -103 -133 L -104 -76 L -111 -53 L -118 -56 Z');
  stone('M -109 -70 L -76 -70 L -72 -20 L -79 -2 L -91 -1 L -92 -50 L -100 -19 L -103 -1 L -118 1 L -110 -27 Z');
  ctx.strokeStyle='#999e87';ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(-105,-148);ctx.quadraticCurveTo(-94,-130,-83,-148);
  for(const y of [-125,-120,-26,-21]){ctx.moveTo(-112,y);ctx.lineTo(-102,y);}
  ctx.moveTo(-110,-76);ctx.lineTo(-80,-69);ctx.moveTo(-110,-71);ctx.lineTo(-82,-63);ctx.stroke();
  ctx.restore();
  // Central woman: uncovered oval head, long dress and arms carrying a large basket.
  stone('M -19 -216 Q -27 -237 -12 -246 Q 4 -251 10 -234 Q 14 -221 3 -214 Z');
  stone('M -23 -207 Q -8 -215 12 -207 L 24 -150 L 36 -13 L 26 0 L -39 0 L -47 -13 L -35 -149 Z');
  stone('M -23 -205 L -32 -201 L -40 -150 Q -46 -132 -32 -121 L -11 -113 L -5 -126 L -25 -137 L -21 -169 Z');
  stone('M 12 -206 L 24 -200 L 31 -156 L 27 -132 L 14 -132 L 17 -153 Z');
  // Basket opening and woven lower bowl sit across the waist.
  ctx.fillStyle='#6f7563';ctx.beginPath();ctx.ellipse(-1,-132,31,9,-.05,0,Math.PI*2);ctx.fill();
  stone('M -31 -133 Q -5 -120 29 -134 L 23 -100 Q -1 -79 -27 -102 Z',true);
  ctx.strokeStyle='#969a82';ctx.lineWidth=1;
  for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(-24+i*9,-126);ctx.lineTo(-19+i*7,-101);ctx.stroke();}
  ctx.beginPath();ctx.moveTo(-37,-84);ctx.lineTo(25,-41);ctx.moveTo(-40,-61);ctx.lineTo(19,-16);ctx.moveTo(-34,-39);ctx.lineTo(-2,-16);ctx.stroke();
  stone('M -36 -13 L -32 8 L -44 12 L -48 7 L -44 -13 Z',true);
  stone('M 22 -13 L 33 5 L 32 11 L 22 9 L 13 -13 Z',true);
  ctx.restore();
  ctx.restore();
}
