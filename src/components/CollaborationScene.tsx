import { Component, createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Float, OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import whiteLogoUrl from '../assets/logobranca.png';

const DataView = createContext(0);
const DATA_VIEWS = ['Indústria', 'Território', 'Inovação'];

const VIEW_CONTENT = [
  { accent: '#6ce5ef', title: 'PERFIL PRODUTIVO', subtitle: 'Setores que movimentam a indústria da Paraíba', labels: ['Alimentos', 'Calçados', 'Cerâmica', 'Têxtil'], cards: ['SETORES PRODUTIVOS', 'CADEIAS DE VALOR', 'DIVERSIDADE INDUSTRIAL'], values: ['Alimentos e bebidas', 'Calçados e têxtil', 'Cerâmica e minerais'] },
  { accent: '#f5ba70', title: 'CONEXÕES DO TERRITÓRIO', subtitle: 'Cidades conectadas por conhecimento e oportunidades', labels: ['João Pessoa', 'Campina Grande', 'Patos', 'Sousa'], cards: ['LITORAL', 'AGRESTE', 'SERTÃO'], values: ['João Pessoa', 'Campina Grande', 'Patos e Sousa'] },
  { accent: '#e5a0ee', title: 'ECOSSISTEMA DE INOVAÇÃO', subtitle: 'Da pesquisa à aplicação de novas soluções', labels: ['Pesquisa', 'Tecnologia', 'Talentos', 'Soluções'], cards: ['CONHECIMENTO', 'TRANSFORMAÇÃO DIGITAL', 'APLICAÇÕES'], values: ['Pesquisa e talentos', 'Tecnologia e dados', 'Novas soluções'] },
];

function drawThemeChart(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, mode: number, time: number) {
  ctx.save(); ctx.translate(x,y);ctx.scale(width/640,height/350);
  const view=VIEW_CONTENT[mode];
  ctx.font='20px sans-serif';
  if(mode===0){
    view.labels.forEach((label,i)=>{
      const yy=26+i*81, value=[.83,.65,.48,.71][i]+Math.sin(time*.8+i)*.025;
      ctx.fillStyle='#dfedff';ctx.fillText(label,0,yy+21);
      ctx.fillStyle='#2d486d';ctx.beginPath();ctx.roundRect(170,yy,444,30,10);ctx.fill();
      const gradient=ctx.createLinearGradient(170,0,614,0);gradient.addColorStop(0,['#379cad','#7065c2','#9864b7','#4678bd'][i]);gradient.addColorStop(1,['#88f3ed','#bba5ff','#f4b4dd','#8dc8ff'][i]);
      ctx.fillStyle=gradient;ctx.shadowColor=view.accent;ctx.shadowBlur=8;ctx.beginPath();ctx.roundRect(170,yy,444*value,30,10);ctx.fill();ctx.shadowBlur=0;
      ctx.fillStyle='#a2bddc';ctx.font='13px sans-serif';ctx.fillText(['PRODUÇÃO E TRANSFORMAÇÃO','DESIGN E MANUFATURA','MATERIAIS E CONSTRUÇÃO','FIBRAS E VESTUÁRIO'][i],172,yy+51);ctx.font='20px sans-serif';
    });
  }else if(mode===1){
    const nodes=[{x:535,y:57},{x:365,y:145},{x:193,y:223},{x:67,y:122}];
    ctx.strokeStyle='#a98055';ctx.lineWidth=3;ctx.setLineDash([7,7]);ctx.beginPath();nodes.forEach((p,i)=>{if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.stroke();ctx.setLineDash([]);
    nodes.forEach((p,i)=>{
      const pulse=.5+.5*Math.sin(time*1.5+i);ctx.strokeStyle='rgba(245,186,112,.25)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,26+pulse*9,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle=view.accent;ctx.shadowColor=view.accent;ctx.shadowBlur=14;ctx.beginPath();ctx.arc(p.x,p.y,11,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      ctx.fillStyle='#fff1d9';ctx.textAlign='center';ctx.font='bold 20px sans-serif';ctx.fillText(view.labels[i],p.x,p.y+53);
    });
    for(let i=0;i<3;i++){const t=(time*.20+i*.31)%1,a=nodes[i],b=nodes[i+1];ctx.fillStyle='#fff1cf';ctx.beginPath();ctx.arc(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,5,0,Math.PI*2);ctx.fill();}
    ctx.textAlign='left';ctx.fillStyle='#bdab94';ctx.font='16px sans-serif';ctx.fillText('REDE ESQUEMÁTICA / PARAÍBA',140,334);
  }else{
    const cx=315,cy=163,r=123;
    [1,.72,.44].forEach(scale=>{ctx.strokeStyle='#594270';ctx.lineWidth=1.5;ctx.beginPath();for(let i=0;i<4;i++){const angle=i*Math.PI/2-Math.PI/2;const xx=cx+Math.cos(angle)*r*scale,yy=cy+Math.sin(angle)*r*scale;if(i)ctx.lineTo(xx,yy);else ctx.moveTo(xx,yy);}ctx.closePath();ctx.stroke();});
    const vertices=view.labels.map((label,i)=>{const a=i*Math.PI/2-Math.PI/2,v=[.88,.74,.81,.64][i]+Math.sin(time*.6+i)*.04;return {x:cx+Math.cos(a)*r*v,y:cy+Math.sin(a)*r*v,a,label};});
    ctx.beginPath();vertices.forEach((p,i)=>{if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.closePath();ctx.fillStyle='rgba(218,130,233,.25)';ctx.fill();ctx.strokeStyle=view.accent;ctx.lineWidth=4;ctx.shadowBlur=12;ctx.shadowColor=view.accent;ctx.stroke();ctx.shadowBlur=0;
    vertices.forEach(p=>{ctx.fillStyle='#fff0ff';ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#edc8f3';ctx.font='bold 20px sans-serif';ctx.textAlign='center';ctx.fillText(p.label,cx+Math.cos(p.a)*(r+75),cy+Math.sin(p.a)*(r+30)+7);});ctx.textAlign='left';
    ctx.fillStyle='#bca0cd';ctx.font='16px sans-serif';ctx.fillText('PESQUISA → TECNOLOGIA → SOLUÇÕES',130,340);
  }
  ctx.restore();
}

type Point = [number, number, number];
const COLORS = ['#5650da', '#a34fe3', '#3579ed', '#29c9df', '#e871cb'];

function Box({ position, size, color, radius = .08, rotation }: { position: Point; size: Point; color: string; radius?: number; rotation?: Point }) {
  return <RoundedBox position={position} args={size} radius={radius} smoothness={3} rotation={rotation} castShadow receiveShadow><meshStandardMaterial color={color} roughness={.48} /></RoundedBox>;
}

function Rod({ from, to, radius = .06, color }: { from: Point; to: Point; radius?: number; color: string }) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return <mesh position={a.clone().add(b).multiplyScalar(.5)} quaternion={rotation} castShadow><cylinderGeometry args={[radius, radius, a.distanceTo(b), 12]} /><meshStandardMaterial color={color} roughness={.55} /></mesh>;
}

function usePanelTexture(kind: 'dashboard' | 'laptop' | 'bars' | 'pie' | 'message' | 'platform' | 'summary', animated = false) {
  const mode = useContext(DataView);
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = kind === 'dashboard' ? 1400 : 512;
    canvas.height = kind === 'dashboard' ? 880 : 360;
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width, h = canvas.height;
    const round = (x: number, y: number, width: number, height: number, fill: string | CanvasGradient, radius = 18) => {
      ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); ctx.fill();
    };
    const line = (x: number, y: number, width: number, fill = '#668bd4', height = 8) => round(x, y, width, height, fill, height / 2);
    const chart = (x: number, y: number, width: number, height: number) => {
      for (let i = 0; i < 4; i++) line(x, y + i * height / 3, width, '#d8e9fa', 2);
      ctx.strokeStyle = '#dd61bd'; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.beginPath();
      const values = [.12, .38, .22, .62, .35, .51, .78, .47, .87];
      values.forEach((v, i) => { const px = x + width * i / 8, py = y + height * (1 - v); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }); ctx.stroke();
      values.forEach((v, i) => { ctx.fillStyle = '#d858bb'; ctx.beginPath(); ctx.arc(x + width * i / 8, y + height * (1 - v), 5, 0, Math.PI * 2); ctx.fill(); });
    };
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, kind === 'laptop' ? '#152c7d' : '#e8f9ff'); gradient.addColorStop(1, kind === 'laptop' ? '#5545b9' : '#bcbef7');
    round(0, 0, w, h, gradient, 24);
    if (kind === 'dashboard') {
      round(0, 0, w, 75, '#6189e4', 0); ctx.fillStyle = '#fff'; ctx.font = 'bold 24px sans-serif'; ctx.fillText('OBSERVATÓRIO  /  PARAÍBA • CONEXÕES E DADOS', 38, 47);
      for (let i = 0; i < 3; i++) { ctx.fillStyle = '#baf3ff'; ctx.beginPath(); ctx.arc(w - 40 - i * 25, 38, 6, 0, Math.PI * 2); ctx.fill(); }
      const side = ctx.createLinearGradient(0, 100, 220, 800); side.addColorStop(0, '#514cd0'); side.addColorStop(1, '#ba70d4'); round(24, 100, 235, 756, side);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif'; ctx.fillText('PARAÍBA', 48, 145);
      for (let i = 0; i < 9; i++) { round(48, 182 + i * 45, 10, 10, '#9de7f6', 5); line(78, 183 + i * 45, 110 + (i % 3) * 15, '#d2d6ff', 7); }
      ctx.strokeStyle = '#bff5ff'; ctx.lineWidth = 13; ctx.beginPath(); ctx.arc(136, 695, 45, -.5, Math.PI * 1.6); ctx.stroke();
      for (let i = 0; i < 2; i++) {
        const y = 108 + i * 148; round(291, y, 1078, 126, '#effaff');
        ctx.fillStyle = i ? '#75cae2' : '#8061da'; ctx.beginPath(); ctx.arc(345, y + 45, 22, 0, Math.PI * 2); ctx.fill();
        line(390, y + 25, 295 - i * 30, '#3861bb', 12); line(390, y + 51, 425, '#9ebce5'); line(390, y + 78, 210, '#78a5dd');
        line(1110, y + 28, 150, '#4b9cd5'); line(1110, y + 54, 110, '#91d5e7'); line(1110, y + 80, 130, '#abb9eb');
      }
      round(291, 410, 1078, 385, '#effaff'); ctx.fillStyle = '#5575b9'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('INFORMAÇÃO QUE CONECTA', 325, 451); chart(335, 495, 980, 247);
      line(300, 823, 550, '#748fce', 5); line(300, 838, 370, '#748fce', 5);
    } else if (kind === 'bars') {
      ctx.fillStyle = '#5263c7'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('ANÁLISE', 35, 49);
      for (let i = 0; i < 7; i++) { const bar = 60 + ((i * 41) % 127) + i * 8; round(42 + i * 62, 306 - bar, 37, bar, COLORS[i % COLORS.length], 5); }
      line(35, 315, 440, '#6f96d8', 3);
    } else if (kind === 'pie') {
      ctx.fillStyle = '#536bc1'; ctx.font = 'bold 26px sans-serif'; ctx.fillText('INDICADORES', 30, 45);
      let start = -Math.PI / 2;
      [[.42,.27,.19,.12],[.22,.38,.24,.16],[.30,.18,.35,.17]][mode].forEach((part, i) => { ctx.fillStyle = COLORS[i]; ctx.beginPath(); ctx.moveTo(256, 203); ctx.arc(256, 203, 111, start, start + Math.PI * 2 * part); ctx.closePath(); ctx.fill(); start += Math.PI * 2 * part; });
      ctx.fillStyle = '#e5f4ff'; ctx.beginPath(); ctx.arc(256, 203, 57, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'message') {
      round(30, 30, 60, 60, '#8a67df', 30); line(110, 42, 315, '#5675c4', 12); line(110, 69, 210, '#9cb5e3');
      for (let i = 0; i < 5; i++) line(35, 134 + i * 40, 405 - (i % 3) * 60, i % 2 ? '#91bde5' : '#bca1e5', 12);
    } else {
      line(28, 25, 230, '#8fdfff', 11);
      chart(35, 90, 435, 195);
      for (let i = 0; i < 5; i++) line(35 + i * 90, 322, 63, '#8dbdf3', 6);
    }
    if (kind !== 'dashboard' && kind !== 'laptop') {
      ctx.clearRect(0, 0, w, h);
      const background = ctx.createLinearGradient(0, 0, w, h);
      background.addColorStop(0, '#102c58'); background.addColorStop(.55, '#233467'); background.addColorStop(1, ['#244f70','#684931','#593165'][mode]);
      round(0, 0, w, h, background, 24);
      ctx.strokeStyle = VIEW_CONTENT[mode].accent; ctx.lineWidth = 2; ctx.strokeRect(2, 2, w - 4, h - 4);
      const title = kind === 'pie' ? 'INDICADORES' : kind === 'bars' ? 'ANÁLISE' : kind === 'platform' ? 'PLATAFORMA' : kind === 'summary' ? 'DASHBOARD' : 'PAINEL';
      ctx.fillStyle = '#f2faff'; ctx.font = 'bold 34px sans-serif'; ctx.fillText(title, 28, 51);
      ctx.fillStyle = '#82dbf4'; ctx.font = '18px sans-serif'; ctx.fillText('PARAÍBA / ' + DATA_VIEWS[mode].toUpperCase(), 29, 80);
      line(28, 98, 456, '#6273aa', 2);
      const accent = VIEW_CONTENT[mode].accent;
      if (kind === 'pie') {
        let angle = -Math.PI / 2;
        [[.42,.27,.19,.12],[.22,.38,.24,.16],[.30,.18,.35,.17]][mode].forEach((part, i) => {
          ctx.strokeStyle = ['#67e2ef', '#a68bff', '#ed9bdb', '#4b8bdf'][i]; ctx.lineWidth = 21;
          ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 12;
          ctx.beginPath(); ctx.arc(155, 216, 70, angle + .04, angle + Math.PI * 2 * part - .04); ctx.stroke();
          angle += Math.PI * 2 * part;
        }); ctx.shadowBlur = 0;
        ctx.fillStyle = '#f0faff'; ctx.font = 'bold 30px sans-serif'; ctx.fillText('PB', 134, 226);
        VIEW_CONTENT[mode].labels.slice(0,3).map(label=>label.toUpperCase()).forEach((label, i) => {
          round(273, 155 + i * 52, 8, 8, ['#67e2ef', '#a68bff', '#ed9bdb'][i], 4);
          ctx.fillStyle = '#d7e5fc'; ctx.font = '16px sans-serif'; ctx.fillText(label, 294, 164 + i * 52);
          line(294, 177 + i * 52, 125 - i * 21, '#647bab', 4);
        });
      } else if (kind === 'bars' || kind === 'summary') {
        drawThemeChart(ctx,30,115,450,210,mode,0);
      } else if (kind === 'platform') {
        const hubs = [{x:98+mode*22,y:175-mode*10,label:['ALIMENTOS','CAMPINA GRANDE','PESQUISA'][mode]}, {x:353-mode*15,y:153+mode*17,label:['CALÇADOS','JOÃO PESSOA','TECNOLOGIA'][mode]}, {x:247-mode*10,y:267-mode*7,label:['CERÂMICA','PATOS','SOLUÇÕES'][mode]}];
        ctx.strokeStyle = '#718bcc'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(98,175);ctx.lineTo(353,153);ctx.lineTo(247,267);ctx.closePath();ctx.stroke();
        for (const hub of hubs) {
          ctx.strokeStyle = '#8de6f5'; ctx.beginPath();ctx.arc(hub.x,hub.y,20,0,Math.PI*2);ctx.stroke();
          ctx.shadowBlur = 16;ctx.shadowColor = accent;ctx.fillStyle = accent;ctx.beginPath();ctx.arc(hub.x,hub.y,8,0,Math.PI*2);ctx.fill();ctx.shadowBlur = 0;
          ctx.fillStyle = '#e2eaff';ctx.font = '13px sans-serif';ctx.textAlign = 'center';ctx.fillText(hub.label,hub.x,hub.y+38);
        }ctx.textAlign = 'left';
      } else {
        [['INDÚSTRIA DA PARAÍBA','CONHECIMENTO E DADOS','CONEXÕES DO TERRITÓRIO'],['MUNICÍPIOS DA PARAÍBA','REDES REGIONAIS','DESENVOLVIMENTO LOCAL'],['INOVAÇÃO NA PARAÍBA','TECNOLOGIA E PESQUISA','NOVAS POSSIBILIDADES']][mode].forEach((label, i) => {
          round(27, 119 + i * 61, 458, 49, '#304675', 10);
          round(42, 137 + i * 61, 9, 9, i % 2 ? '#d59fea' : '#78e5f2', 4);
          ctx.fillStyle = '#e0efff';ctx.font = '17px sans-serif';ctx.fillText(label,65,146+i*61);
          ctx.fillStyle = '#91dced';ctx.fillText('↗',450,147+i*61);
        });
      }
      ctx.fillStyle = '#8cadd3';ctx.font = '12px sans-serif';ctx.fillText('VISUALIZAÇÃO ILUSTRATIVA',29,344);
    }
    if (kind === 'dashboard') {
      ctx.fillStyle = '#11294f'; ctx.fillRect(0, 0, w, h);
      const header = ctx.createLinearGradient(0, 0, w, 100); header.addColorStop(0, '#223c79'); header.addColorStop(1, '#62458d');
      round(0, 0, w, 92, header, 0);
      ctx.fillStyle = '#eaf9ff'; ctx.font = 'bold 30px sans-serif';ctx.fillText('OBSERVATÓRIO DA INDÚSTRIA', 40, 43);
      ctx.fillStyle = '#9bcdea'; ctx.font = '18px sans-serif';ctx.fillText('PARAÍBA  /  INTELIGÊNCIA ESTRATÉGICA', 41, 73);
      // Reserved for the Observatory's white logo, loaded below.
      round(24, 115, 218, 739, '#1b3560', 16);
      ctx.fillStyle = '#87b5dc';ctx.font = '15px sans-serif';ctx.fillText('ESPAÇO DE DADOS', 44, 151);
      ['Visão geral', 'Indústria', 'Território', 'Inovação', 'Plataformas'].forEach((label, i) => {
        if (i === 0) round(36, 174 + i * 54, 193, 43, '#395a8b', 9);
        round(49, 189 + i * 54, 10, 10, i === 0 ? '#76eaf4' : '#7185b3', 3);
        ctx.fillStyle = i === 0 ? '#f0fbff' : '#adbedc';ctx.font = '18px sans-serif';ctx.fillText(label, 72, 204 + i * 54);
      });
      ctx.fillStyle = '#dfedff';ctx.font = 'bold 37px sans-serif';ctx.fillText('PB', 107, 600);
      ctx.fillStyle = '#8daed2';ctx.font = '14px sans-serif';ctx.fillText('CONEXÕES DO TERRITÓRIO', 40, 697);
      ['Campina Grande', 'João Pessoa', 'Patos'].forEach((name, i) => { ctx.fillStyle = '#b5d9ee';ctx.font = '17px sans-serif';ctx.fillText(name, 45, 733 + i * 32); });
      VIEW_CONTENT[mode].labels.slice(0,3).map(label=>label.toUpperCase()).forEach((label, i) => {
        const x = 267 + i * 369;
        round(x, 115, 348, 145, '#223f6b', 15);
        round(x + 21, 136, 6, 30, ['#72e5ef', '#b598ff', '#eb9bd8'][i], 3);
        ctx.fillStyle = '#a5c2e0';ctx.font = '17px sans-serif';ctx.fillText(VIEW_CONTENT[mode].cards[i], x + 41, 156);
        ctx.fillStyle = '#f0f9ff';ctx.font = 'bold 30px sans-serif';ctx.fillText(VIEW_CONTENT[mode].values[i], x + 21, 202);
        ctx.fillStyle = '#91b1d5';ctx.font = '15px sans-serif';ctx.fillText('PARAÍBA / VISÃO INTEGRADA', x + 22, 234);
      });
      ctx.fillStyle = '#809fc3';ctx.font = '15px sans-serif';ctx.fillText('Visualização ilustrativa • Conhecimento para transformar o território', 276, 842);
    }
    const result = new THREE.CanvasTexture(canvas); result.colorSpace = THREE.SRGBColorSpace; result.anisotropy = 4;
    if (kind === 'dashboard') {
      const base = document.createElement('canvas');base.width = w;base.height = h;base.getContext('2d')!.drawImage(canvas, 0, 0);
      result.userData.base = base;
    }
    return result;
  }, [kind, mode]);
  const chartTime = useRef(0);
  const lastDraw = useRef('');
  useFrame((_, delta) => {
    if (kind !== 'dashboard') return;
    if (animated) chartTime.current += Math.min(delta, .05);
    const tick = `${texture.uuid}:${Math.floor(chartTime.current * 12)}`;
    if (tick === lastDraw.current) return;
    lastDraw.current = tick;
    const canvas = texture.image as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(texture.userData.base as HTMLCanvasElement, 0, 0);
    const t = chartTime.current;
    const card = (x:number,y:number,w:number,h:number) => {ctx.fillStyle='#1c3861';ctx.beginPath();ctx.roundRect(x,y,w,h,16);ctx.fill();};
    const title = (text:string,x:number,y:number) => {ctx.fillStyle='#dceeff';ctx.font='bold 20px sans-serif';ctx.fillText(text,x,y);};
    const view = VIEW_CONTENT[mode];
    card(267,280,713,510);card(1000,280,353,510);
    ctx.fillStyle=view.accent;ctx.fillRect(267,280,713,5);
    title(view.title,291,319);title(['CADEIAS PRODUTIVAS','REGIÕES CONECTADAS','NOVAS POSSIBILIDADES'][mode],1025,319);
    ctx.fillStyle='#a9bed6';ctx.font='17px sans-serif';ctx.fillText(view.subtitle,292,350);
    drawThemeChart(ctx,293,383,650,370,mode,t);
    view.labels.forEach((label,i)=>{
      const yy=360+i*95;
      ctx.fillStyle='#29456a';ctx.beginPath();ctx.roundRect(1020,yy,311,77,12);ctx.fill();
      ctx.fillStyle=view.accent;ctx.font='bold 27px sans-serif';ctx.fillText(String(i+1).padStart(2,'0'),1036,yy+37);
      ctx.fillStyle='#e6f1ff';ctx.font='bold 18px sans-serif';ctx.fillText(label,1080,yy+33);
      ctx.fillStyle='#95b3d4';ctx.font='14px sans-serif';ctx.fillText(['Setor produtivo','Conexão regional','Eixo de inovação'][mode],1080,yy+57);
    });
    ctx.fillStyle='#a7cce0';ctx.font='bold 18px sans-serif';ctx.fillText(DATA_VIEWS[mode].toUpperCase(),65,486);
    ctx.strokeStyle='#405781';ctx.lineWidth=10;ctx.beginPath();ctx.arc(132,586,57,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=view.accent;ctx.beginPath();ctx.arc(132,586,57,t*.24,t*.24+4.7);ctx.stroke();
    ctx.fillStyle=view.accent;ctx.font='16px sans-serif';ctx.fillText('CENÁRIO '+(mode+1)+' / 3',40,655);
    texture.needsUpdate=true;
  });
  useEffect(() => {
    if (kind !== 'dashboard') return;
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active) return;
      const base = texture.userData.base as HTMLCanvasElement;
      const ctx = base.getContext('2d')!;
      const scale = Math.min(230 / image.naturalWidth, 66 / image.naturalHeight);
      const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
      ctx.drawImage(image, 1130 + (230 - width) / 2, 13 + (66 - height) / 2, width, height);
      lastDraw.current = '';
    };
    image.src = whiteLogoUrl;
    return () => { active = false; image.onload = null; };
  }, [kind, texture]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function Panel({ kind, position, width, height, animated = false, frame = '#e4f2ff' }: { kind: Parameters<typeof usePanelTexture>[0]; position: Point; width: number; height: number; animated?: boolean; frame?: string }) {
  const texture = usePanelTexture(kind, animated);
  const effect = useRef<THREE.ShaderMaterial>(null);
  const elapsed = useRef(0);
  const uniforms = useMemo(() => ({ time: { value: 0 } }), []);
  useFrame((_, delta) => {
    if (animated) elapsed.current += Math.min(delta, .05);
    if (effect.current) effect.current.uniforms.time.value = elapsed.current;
  });
  return <group position={position}>
    <Box position={[0, 0, 0]} size={[width + .12, height + .12, .12]} color={frame} radius={.055} />
    <mesh position={[0, 0, .067]}><planeGeometry args={[width, height]} /><meshBasicMaterial map={texture} toneMapped={false} /></mesh>
    {kind !== 'laptop' && <mesh position={[0, 0, .071]}>
      <planeGeometry args={[width, height]} />
      <shaderMaterial ref={effect} transparent depthWrite={false} toneMapped={false} uniforms={uniforms}
        vertexShader="varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}"
        fragmentShader="uniform float time; varying vec2 vUv; void main(){float edge=min(min(vUv.x,1.0-vUv.x),min(vUv.y,1.0-vUv.y));float rim=(1.0-smoothstep(0.0,.018,edge))*(.35+.20*sin(time*1.7));float sweep=pow(max(0.0,1.0-abs(vUv.y-fract(time*.16))*14.0),3.0)*.14; gl_FragColor=vec4(.40,.88,1.0,rim+sweep);}"
      />
    </mesh>}
  </group>;
}

function CoffeeCup({ side, animated }: { side: number; animated: boolean }) {
  const steam = useRef<THREE.Mesh>(null);
  const time = useRef(0);
  const uniforms = useMemo(() => ({ time: { value: 0 } }), []);
  const cup = useMemo(() => {
    const profile = [[.0,.025],[.075,.025],[.095,.04],[.108,.175],[.107,.20],[.095,.205],[.092,.185],[.080,.055],[.0,.055]].map(([r,y])=>new THREE.Vector2(r,y));
    return new THREE.LatheGeometry(new THREE.SplineCurve(profile).getPoints(64),48);
  }, []);
  useEffect(() => () => cup.dispose(), [cup]);
  useFrame(({ camera }, delta) => {
    if (animated) time.current += Math.min(delta,.05);
    uniforms.time.value = time.current;
    if (steam.current) steam.current.quaternion.copy(camera.quaternion);
  });
  return <group position={[side * .72, .065, .42]}>
    <mesh position={[0,.013,0]} castShadow receiveShadow><cylinderGeometry args={[.16,.145,.025,48]} /><meshStandardMaterial color="#e5d9ed" roughness={.3} /></mesh>
    <mesh geometry={cup} castShadow receiveShadow><meshPhysicalMaterial color="#f2e6f4" roughness={.24} clearcoat={.65} /></mesh>
    <mesh position={[side*.111,.126,0]}><torusGeometry args={[.060,.016,12,40]} /><meshPhysicalMaterial color="#f2e6f4" roughness={.24} clearcoat={.65} /></mesh>
    <mesh position={[0,.178,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.091,48]} /><meshPhysicalMaterial color="#3c211b" roughness={.22} clearcoat={.6} /></mesh>
    <mesh position={[.018,.179,-.025]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.027,.031,32]} /><meshBasicMaterial color="#a17248" transparent opacity={.42} /></mesh>
    <mesh ref={steam} position={[0,.48,0]}>
      <planeGeometry args={[.32,.60]} />
      <shaderMaterial transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} uniforms={uniforms}
        vertexShader="varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}"
        fragmentShader="uniform float time;varying vec2 vUv;void main(){float y=vUv.y;float alpha=0.0;for(int i=0;i<3;i++){float f=float(i);float center=.5+sin(y*8.0-time*1.3+f*2.0)*(.045+y*.12)+(f-1.0)*.105;float width=.025+y*.055;float wisp=exp(-pow((vUv.x-center)/width,2.0));float drift=.55+.45*sin(y*17.0-time*2.2+f*2.4);alpha+=wisp*drift;}float fade=smoothstep(0.0,.12,y)*(1.0-smoothstep(.45,1.0,y));gl_FragColor=vec4(.94,.94,1.0,alpha*fade*.22);}"
      />
    </mesh>
  </group>;
}

function Laptop() {
  return <group>
    <Box position={[0, .025, .10]} size={[.86, .05, .63]} color="#c4d9f5" radius={.022} />
    <Box position={[0, .058, .03]} size={[.70, .012, .32]} color="#4e64b5" radius={.005} />
    {Array.from({ length: 4 }, (_, row) => Array.from({ length: 10 }, (_, col) => <Box key={`${row}-${col}`} position={[-.30 + col * .066, .068, -.085 + row * .067]} size={[.046, .009, .037]} color="#a4c2ed" radius={.002} />))}
    <Box position={[0, .06, .29]} size={[.22, .008, .12]} color="#94aedc" radius={.008} />
    <group position={[0, .34, -.19]} rotation={[-.20, 0, 0]}><Panel kind="laptop" position={[0, 0, 0]} width={.76} height={.49} frame="#292c91" /></group>
  </group>;
}

function SoftForm({ position, scale, color }: { position: Point; scale: Point; color: string }) {
  return <mesh position={position} scale={scale} castShadow receiveShadow><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial color={color} roughness={.72} /></mesh>;
}

// One continuous tapered surface per limb, including the elbow or knee.
function SmoothLimb({ points, radius, color, motion }: { points: Point[]; radius: [number, number]; color: string; motion?: { animated: boolean; phase: number } }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'catmullrom', .22), [points]);
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 32, 1, 16, false), [curve]);
  const elapsed = useRef(0);
  const originalEnd = useMemo(() => curve.points[curve.points.length - 1].clone(), [curve]);
  useFrame((_, delta) => {
    if (motion?.animated) elapsed.current += Math.min(delta, .05);
    const end = curve.points[curve.points.length - 1];
    end.copy(originalEnd);
    if (motion) end.y += Math.sin(elapsed.current * 6 + motion.phase) * .009;
    const frames = curve.computeFrenetFrames(32, false);
    const positions = geometry.attributes.position, normals = geometry.attributes.normal;
    const center = new THREE.Vector3(), normal = new THREE.Vector3();
    for (let ring = 0; ring <= 32; ring++) {
      const t = ring / 32; curve.getPointAt(t, center);
      const r = THREE.MathUtils.lerp(radius[0], radius[1], t * t * (3 - 2 * t));
      for (let j = 0; j <= 16; j++) {
        const angle = j / 16 * Math.PI * 2;
        normal.copy(frames.normals[ring]).multiplyScalar(-Math.cos(angle)).addScaledVector(frames.binormals[ring], Math.sin(angle));
        const index = ring * 17 + j;
        positions.setXYZ(index, center.x + normal.x * r, center.y + normal.y * r, center.z + normal.z * r);
        normals.setXYZ(index, normal.x, normal.y, normal.z);
      }
    }
    positions.needsUpdate = true; normals.needsUpdate = true;
  });
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color={color} roughness={.76} /></mesh>;
}

function TailoredTorso({ color }: { color: string }) {
  const geometry = useMemo(() => {
    const profile = [[.22,1.16],[.28,1.22],[.30,1.40],[.34,1.70],[.35,1.84],[.30,1.94],[.20,2.015],[.105,2.045]].map(([r,y]) => new THREE.Vector2(r,y));
    const curve = new THREE.SplineCurve(profile);
    const shape = new THREE.LatheGeometry(curve.getPoints(48), 48);
    const positions = shape.attributes.position;
    for(let i=0;i<positions.count;i++) {
      const y=positions.getY(i);
      positions.setZ(i,positions.getZ(i)*.66-.015-(y-1.2)*.07);
    }
    shape.computeVertexNormals();return shape;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color={color} roughness={.76} /></mesh>;
}

function TypingArm({ hand, side, animated }: { hand: number; side: number; animated: boolean }) {
  const wrist = useRef<THREE.Group>(null);
  const fingers = useRef<Array<THREE.Group | null>>([]);
  const time = useRef(0);
  const sleeve = side < 0 ? '#2343be' : '#146cc2';
  const phase = hand * 1.7 + side * .8;
  const points = useMemo<Point[]>(() => [[hand*.245,1.87,-.04],[hand*.35,1.76,-.12],[hand*.435,1.51,-.33],[hand*.39,1.50,-.49],[hand*.27,1.59,-.80]], [hand]);
  useFrame((_, delta) => {
    if (animated) time.current += Math.min(delta,.05);
    const t=time.current;
    if(wrist.current) wrist.current.position.y=1.59+Math.sin(t*6+phase)*.009;
    fingers.current.forEach((finger,index)=>{if(finger)finger.rotation.x=.12+Math.max(0,Math.sin(t*11+index*1.4+phase))*.23;});
  });
  return <>
    <SmoothLimb points={points} radius={[.135,.068]} color={sleeve} motion={{animated,phase}} />
    <group position={[hand*.27,1.59,-.80]} ref={wrist}>
      <SoftForm position={[0,0,-.045]} scale={[.077,.041,.105]} color="#e3ac9e" />
      {[0,1,2,3].map(index=><group key={index} ref={node=>{fingers.current[index]=node;}} position={[(index-1.5)*.032,-.005,-.105]}>
        <SoftForm position={[0,-.005,-.036]} scale={[.019,.020,.064]} color="#e3ac9e" />
      </group>)}
      <SoftForm position={[-hand*.067,-.005,-.045]} scale={[.030,.028,.060]} color="#e3ac9e" />
    </group>
  </>;
}

function OfficeChair() {
  const shell = useMemo(() => {
    // Closed, rounded shell: the back and integrated head support are one surface.
    const geometry = new RoundedBoxGeometry(.90, 1.35, .16, 8, .075);
    const vertices = geometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i), y = vertices.getY(i);
      const height = (y + .675) / 1.35;
      const width = .86 + .14 * Math.sin(height * Math.PI);
      vertices.setX(i, x * width);
      vertices.setZ(i, vertices.getZ(i) - .16 * Math.pow(x / .45, 2) + .045 * Math.cos(y * 3));
    }
    geometry.computeVertexNormals(); return geometry;
  }, []);
  useEffect(() => () => shell.dispose(), [shell]);
  return <group>
    {/* Deep cushion and rounded seat shell. */}
    <Box position={[0,.94,.09]} size={[.95,.13,.89]} color="#504498" radius={.06} />
    <SoftForm position={[0,1.025,.045]} scale={[.47,.125,.43]} color="#7e67d0" />
    <group position={[0,1.62,.49]} rotation={[-.10,0,0]}>
      <mesh geometry={shell} castShadow receiveShadow><meshStandardMaterial color="#7562bf" roughness={.66} /></mesh>
      <mesh geometry={shell} position={[0,0,-.075]} scale={[.92,.93,.58]} castShadow receiveShadow><meshStandardMaterial color="#8671ce" roughness={.9} /></mesh>
    </group>
    <SmoothLimb points={[[0,.73,.24],[0,.87,.42],[0,1.02,.53],[0,1.19,.54]]} radius={[.075,.095]} color="#575675" />
    {[-1,1].map(side=><group key={side}>
      <Rod from={[side*.39,.94,.21]} to={[side*.49,1.34,.14]} radius={.033} color="#7c7b9d" />
      <Box position={[side*.49,1.35,.015]} size={[.13,.085,.54]} color="#555079" radius={.04} />
    </group>)}
    {/* Gas lift and five-star rolling base. */}
    <mesh position={[0,.57,.12]} castShadow><cylinderGeometry args={[.052,.052,.61,24]} /><meshStandardMaterial color="#bcc4d9" metalness={.75} roughness={.24} /></mesh>
    <mesh position={[0,.35,.12]} castShadow><cylinderGeometry args={[.087,.095,.27,24]} /><meshStandardMaterial color="#5d5c80" roughness={.5} /></mesh>
    {Array.from({length:5},(_,i)=>{
      const angle=i*Math.PI*2/5;
      const x=Math.sin(angle)*.49,z=.12+Math.cos(angle)*.49;
      return <group key={i}>
        <Rod from={[0,.27,.12]} to={[x,.17,z]} radius={.043} color="#a0a6c1" />
        <group position={[x,.115,z]} rotation={[0,angle,0]}>
          <Rod from={[0,0,0]} to={[0,.065,0]} radius={.027} color="#8f99b2" />
          {[-1,1].map(side=><mesh key={side} position={[side*.046,-.025,0]} rotation={[0,0,Math.PI/2]} castShadow>
            <cylinderGeometry args={[.077,.077,.055,24]} /><meshStandardMaterial color="#373854" roughness={.64} />
          </mesh>)}
          <mesh position={[.077,-.025,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.028,.028,.008,16]} /><meshStandardMaterial color="#a79acb" metalness={.4} roughness={.4} /></mesh>
        </group>
      </group>;
    })}
    <Rod from={[.16,.91,.08]} to={[.40,.86,.08]} radius={.018} color="#626482" />
    <Box position={[.40,.86,.08]} size={[.15,.04,.09]} color="#4f4c70" radius={.018} />
  </group>;
}

function Person({ side, animated }: { side: number; animated: boolean }) {
  const head = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = animated ? clock.elapsedTime : 0;
    if (head.current) head.current.rotation.x = .12 + Math.sin(t * .7 + side) * (animated ? .025 : 0);
  });
  return <group position={[side * 1.85, 0, 1.65]} rotation={[0, side * .62, 0]}>
    <OfficeChair />
    <SoftForm position={[0,1.17,-.02]} scale={[.30,.21,.27]} color="#20236c" />
    <TailoredTorso color={side < 0 ? '#2343be' : '#146cc2'} />
    <SoftForm position={[0,2.08,-.07]} scale={[.10,.18,.105]} color="#d79c91" />
    <group ref={head} position={[0, 2.28, -.09]}>
      <mesh scale={[.245, .29, .225]} castShadow><sphereGeometry args={[1, 24, 20]} /><meshStandardMaterial color="#e3ac9e" /></mesh>
      {/* The head's scale is applied separately to keep glasses proportional. */}
    </group>
    {[-1, 1].map(x => <group key={x}>
      <SmoothLimb points={[[x*.16,1.17,-.02],[x*.21,1.10,-.35],[x*.23,.98,-.69],[x*.24,.79,-.79],[x*.25,.22,-.86]]} radius={[.16,.095]} color="#20236c" />
      <Box position={[x * .25, .14, -1.00]} size={[.27, .18, .47]} color="#181e55" radius={.07} />
      <Box position={[x * .25, .069, -1.015]} size={[.28, .035, .48]} color="#8895d2" radius={.012} />
      <TypingArm hand={x} side={side} animated={animated} />
    </group>)}
  </group>;
}

function HeadDetails({ side, animated }: { side: number; animated: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (group.current) group.current.rotation.x = .12 + (animated ? Math.sin(clock.elapsedTime * .7 + side) * .025 : 0); });
  return <group position={[side * 1.85, 0, 1.65]} rotation={[0, side * .62, 0]}><group position={[0, 2.28, -.09]} ref={group}>
    <mesh position={[0, .08, .035]} scale={[.26, .23, .235]} castShadow><sphereGeometry args={[1, 24, 20]} /><meshStandardMaterial color="#151639" /></mesh>
    <SoftForm position={[-.035,.19,-.07]} scale={[.23,.13,.19]} color="#151639" />
    <mesh position={[0, -.035, -.23]} scale={[.055, .065, .07]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color="#e3ac9e" /></mesh>
    {[-1, 1].map(x => <group key={x}><Box position={[x * .12, .01, -.218]} size={[.19, .105, .035]} color="#333b96" radius={.018} /><mesh position={[x * .244, -.025, .01]} scale={[.045, .07, .06]}><sphereGeometry args={[1, 12, 12]} /><meshStandardMaterial color="#d79c91" /></mesh></group>)}
    <Rod from={[-.04, .025, -.24]} to={[.04, .025, -.24]} radius={.013} color="#7279cd" />
  </group></group>;
}

function BotanicalLeaf({ length, width, bend, purple }: { length: number; width: number; bend: number; purple: boolean }) {
  const { surface, vein } = useMemo(() => {
    const positions: number[] = [], colors: number[] = [], indices: number[] = [];
    const dark = new THREE.Color(purple ? '#6744a9' : '#285999');
    const light = new THREE.Color(purple ? '#ca83df' : '#67bdcf');
    const color = new THREE.Color();
    for (let row = 0; row <= 28; row++) {
      const t = row / 28;
      const silhouette = Math.pow(Math.sin(Math.PI * t), .85) * (1 - .22 * t);
      for (let col = 0; col <= 10; col++) {
        const v = col / 5 - 1;
        positions.push(v * width * silhouette, t * length, bend * t * t + .09 * v * v * Math.sin(Math.PI * t));
        color.copy(dark).lerp(light, .18 + .50 * t + .19 * (1 - Math.abs(v)));
        colors.push(color.r, color.g, color.b);
        if (row < 28 && col < 10) { const i = row * 11 + col; indices.push(i, i + 1, i + 11, i + 1, i + 12, i + 11); }
      }
    }
    const surface = new THREE.BufferGeometry();
    surface.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    surface.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); surface.setIndex(indices); surface.computeVertexNormals();
    const centerline = new THREE.CatmullRomCurve3(Array.from({length:18},(_,i)=>{const t=i/17;return new THREE.Vector3(0,t*length,bend*t*t-.004);}));
    const vein = new THREE.TubeGeometry(centerline, 24, .005, 6, false);
    return {surface, vein};
  }, [length, width, bend, purple]);
  useEffect(() => () => {surface.dispose();vein.dispose();}, [surface, vein]);
  return <group>
    <mesh geometry={surface} castShadow receiveShadow><meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={.56} metalness={.04} /></mesh>
    <mesh geometry={vein}><meshStandardMaterial color={purple ? '#c18bdd' : '#8bcbd5'} roughness={.7} /></mesh>
  </group>;
}

function Plant({ position, scale = 1, seed = 0 }: { position: Point; scale?: number; seed?: number }) {
  const pot = useMemo(() => {
    const profile = [[.18,.03],[.23,.035],[.255,.08],[.275,.22],[.30,.43],[.295,.51],[.28,.53],[.26,.51],[.265,.46],[.245,.10],[.18,.08]].map(([x,y])=>new THREE.Vector2(x,y));
    return new THREE.LatheGeometry(new THREE.SplineCurve(profile).getPoints(80),64);
  }, []);
  const stems = useMemo(() => Array.from({length:11},(_,i)=>{
    const angle=i*2.399+seed*.8;
    const outer=i<6, spread=outer?.50:.20;
    const height=outer?.91+(i%3)*.13:1.31+(i%3)*.13;
    const end=new THREE.Vector3(Math.cos(angle)*spread,height,Math.sin(angle)*spread);
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,.48,0),new THREE.Vector3(end.x*.24,height*.65,end.z*.24),end]);
    return {end,angle,outer,geometry:new THREE.TubeGeometry(curve,24,.012,8,false)};
  }), [seed]);
  useEffect(() => () => {pot.dispose();}, [pot]);
  useEffect(() => () => stems.forEach(stem=>stem.geometry.dispose()), [stems]);
  return <group position={position} scale={scale}>
    <mesh geometry={pot} castShadow receiveShadow><meshPhysicalMaterial color="#b6a3d8" roughness={.29} clearcoat={.45} clearcoatRoughness={.3} /></mesh>
    <mesh position={[0,.495,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.262,48]} /><meshStandardMaterial color="#373050" roughness={1} /></mesh>
    <mesh position={[0,.51,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.28,.013,12,64]} /><meshStandardMaterial color="#dfc4ec" metalness={.25} roughness={.35} /></mesh>
    <mesh position={[0,.075,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.24,.012,8,48]} /><meshStandardMaterial color="#8a73b8" roughness={.4} /></mesh>
    {stems.map(({end,angle,outer,geometry},i)=><group key={i}>
      <mesh geometry={geometry} castShadow><meshStandardMaterial color="#57748d" roughness={.8} /></mesh>
      <group position={end} rotation={[outer?.55:.18,angle,-.15+Math.sin(i+seed)*.15]}>
        <BotanicalLeaf length={outer?.90:1.04} width={outer?.23:.19} bend={outer?.32:.12} purple={(i+seed)%4===0} />
      </group>
    </group>)}
  </group>;
}

function Sparkles({ animated }: { animated: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (group.current) group.current.rotation.y = animated ? Math.sin(clock.elapsedTime * .10) * .05 : 0; });
  return <group ref={group}>{Array.from({ length: 34 }, (_, i) => <mesh key={i} position={[Math.sin(i * 12.3) * 4.7, 1.5 + ((i * 17) % 35) / 7, Math.cos(i * 7.1) * 1.8 - 1.6]}><sphereGeometry args={[i % 5 === 0 ? .027 : .013, 8, 8]} /><meshBasicMaterial color={i % 3 ? '#d8faff' : '#ffa9ec'} /></mesh>)}</group>;
}

function DataButton({ onChange, mode }: { onChange: () => void; mode: number }) {
  const [hovered, setHovered] = useState(false);
  const press = useRef(0);
  const button = useRef<THREE.Group>(null);
  useFrame((_, delta) => {press.current=Math.max(0,press.current-delta);if(button.current)button.current.position.y=press.current>0?.095:.12;});
  const color=['#72edff','#bd9cff','#ffabe0'][mode];
  return <group ref={button} position={[0,.12,.35]} onPointerDown={event=>{event.stopPropagation();if(event.button===0){press.current=.20;onChange();}}} onPointerOver={event=>{event.stopPropagation();setHovered(true);}} onPointerOut={()=>setHovered(false)}>
    <mesh position={[0,.025,0]}><boxGeometry args={[.70,.25,.52]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
    <RoundedBox args={[.46,.14,.32]} radius={.055} smoothness={4} castShadow><meshStandardMaterial color={hovered?'#514bc7':'#3a39ad'} emissive={color} emissiveIntensity={hovered?.20:.04} roughness={.3}/></RoundedBox>
    <mesh position={[0,.077,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.105,.014,12,40]}/><meshBasicMaterial color={color}/></mesh>
    <mesh position={[0,.078,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.065,32]}/><meshStandardMaterial color="#1f3575" emissive={color} emissiveIntensity={.25}/></mesh>
  </group>;
}

function World({ animated, mode, onChange }: { animated: boolean; mode: number; onChange: () => void }) {
  return <>
    <ambientLight intensity={.7} />
    <hemisphereLight args={['#d7f9ff', '#6c3dc2', 1.1]} />
    <directionalLight position={[-4, 8, 5]} intensity={2} color="#c5efff" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-normalBias={.04} />
    <pointLight position={[5, 5, -1]} intensity={30} color="#ffa5e8" distance={14} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.04, 0]} receiveShadow><circleGeometry args={[12, 96]} /><meshStandardMaterial color="#adabed" roughness={.7} /></mesh>
    <gridHelper material-transparent material-opacity={.22} args={[18, 30, '#aaa2e1', '#aaa2e1']} position={[0, -.028, 0]} />
    <ContactShadows position={[0, -.02, 0]} opacity={.35} scale={17} blur={2.5} far={5} color="#4940ab" resolution={256} />
    {/* Large central monitor. All panels are textures on real 3D geometry. */}
    <group position={[0, 0, -1.65]}>
      <Box position={[0, 3.34, 0]} size={[5.35, 3.39, .22]} color="#322eac" radius={.10} />
      <Panel animated={animated} kind="dashboard" position={[0, 3.34, .13]} width={5.04} height={3.10} frame="#7675e1" />
      <Box position={[0, .89, -.07]} size={[.52, 1.68, .32]} color="#4438b7" radius={.06} rotation={[.12, 0, 0]} />
      <Box position={[0, .02, .05]} size={[1.65, .12, .87]} color="#5546c5" radius={.05} />
    </group>
    <group position={[0, 1.39, .18]}>
      <mesh castShadow receiveShadow scale={[1, 1, .48]}><cylinderGeometry args={[2.85, 2.85, .13, 80]} /><meshPhysicalMaterial color="#93e7f4" metalness={.15} roughness={.26} clearcoat={.7} /></mesh>
      <mesh position={[0, -.66, 0]}><cylinderGeometry args={[.14, .23, 1.23, 24]} /><meshStandardMaterial color="#9a90dd" metalness={.3} roughness={.35} /></mesh>
      <mesh position={[0, -1.26, 0]} scale={[1, 1, .6]}><cylinderGeometry args={[.85, .9, .07, 48]} /><meshStandardMaterial color="#857acf" /></mesh>
      {[-1, 1].map(side => <group key={side} position={[side * 1.35, .09, .77]} rotation={[0, side * .62, 0]}><Laptop /></group>)}
      {[-1, 1].map(side => <CoffeeCup key={side} side={side} animated={animated} />)}
      <DataButton mode={mode} onChange={onChange} />
    </group>
    {[-1, 1].map(side => <group key={side}><Person side={side} animated={animated} /><HeadDetails side={side} animated={animated} /></group>)}
    {([
      ['pie', [-3.06, 3.61, -.6], 1.05, .92], ['bars', [3.02, 3.77, -.65], 1.18, 1.02],
      ['platform', [2.9, 2.49, -.30], .95, .83], ['summary', [-2.6, 5.30, -1.0], .90, .67],
      ['bars', [-3.25, 2.34, -.4], .80, .67], ['platform', [2.65, 5.35, -1.1], 1.10, .52],
      ['summary', [-1.5, 4.95, -.4], .61, .50], ['pie', [3.95, 4.60, -1.2], .56, .51],
    ] as [Parameters<typeof usePanelTexture>[0], Point, number, number][]).map(([kind, position, width, height], i) => <Float key={i} enabled={animated} speed={1.15} floatIntensity={.18} rotationIntensity={.035}><Panel animated={animated} kind={kind} position={position} width={width} height={height} frame={i % 3 ? '#dcf0ff' : '#a6c4f7'} /></Float>)}
    <Plant position={[-4.45, 0, -.85]} scale={1.03} seed={0} /><Plant position={[4.55, 0, -.95]} scale={1.1} seed={2} />
    <Plant position={[-4.85, 0, 2.95]} scale={.95} seed={1} /><Plant position={[4.95, 0, 2.95]} scale={.95} seed={3} />
    <Plant position={[-5.10, 0, -2.5]} scale={.77} seed={4} /><Plant position={[5.10, 0, -2.5]} scale={.8} seed={0} />
    <Sparkles animated={animated} />
  </>;
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p role="status" className="collaboration-fallback">Não foi possível abrir a cena 3D. Verifique a aceleração gráfica do navegador.</p> : this.props.children; }
}

export default function CollaborationScene({ animated = true }: { animated?: boolean }) {
  const [mode, setMode] = useState(0);
  const [zoom, setZoom] = useState(1);
  const nextView = () => setMode(current => (current + 1) % DATA_VIEWS.length);
  return <div className="collaboration-canvas" role="group" aria-label="Cenário 3D de duas pessoas trabalhando em notebooks diante de um grande painel de dados, cercadas de plantas azuis e roxas">
    <SceneBoundary><Canvas shadows orthographic camera={{ position: [.8, 4.8, 12.8], zoom: 68, near: .1, far: 70 }} dpr={[1, 1.5]} fallback={<p className="collaboration-fallback">Seu navegador não oferece suporte à visualização 3D.</p>}>
      <ResponsiveCamera zoom={zoom} />
      <DataView.Provider value={mode}><World animated={animated} mode={mode} onChange={nextView} /></DataView.Provider>
      <OrbitControls enableZoom={false} makeDefault target={[0, 2.55, 0]} minZoom={35} maxZoom={140} minPolarAngle={.6} maxPolarAngle={Math.PI / 2 - .08} minAzimuthAngle={-.85} maxAzimuthAngle={.85} enablePan={false} />
    </Canvas></SceneBoundary>
    <div className="absolute bottom-3 right-4 flex gap-2">
      <button type="button" onClick={() => setZoom(z => Math.max(.8,z-.15))} aria-label="Afastar câmera" className="rounded-full bg-white/75 px-3 py-2 text-indigo-900">−</button>
      <button type="button" onClick={() => setZoom(z => Math.min(1.65,z+.15))} aria-label="Aproximar câmera" className="rounded-full bg-white/75 px-3 py-2 text-indigo-900">+</button>
    </div>
    <button type="button" onClick={nextView} className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/60 bg-white/65 px-4 py-2 text-xs text-indigo-900 shadow-sm backdrop-blur-md hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600" aria-label="Alternar gráficos dos painéis e do monitor grande">
      Alternar gráficos · <span aria-live="polite">{DATA_VIEWS[mode]}</span>
    </button>
  </div>;
}

function ResponsiveCamera({ zoom }: { zoom: number }) {
  const dimensions = useRef('');
  useFrame(({ camera, size }) => {
    const key = `${size.width}:${size.height}:${zoom}`;
    if (dimensions.current === key) return;
    dimensions.current = key;
    if (camera instanceof THREE.OrthographicCamera) { camera.zoom = Math.min(size.width / 10.0, size.height / 7.1) * zoom; camera.updateProjectionMatrix(); }
  });
  return null;
}
