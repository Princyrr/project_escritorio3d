import { createLaboratoryPresenter } from './LaboratoryPresenter';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createLaboratory } from './LaboratoryScene';
import { createCartoonGripGeometry } from './CartoonGrip';
import { createDeskCup } from './DeskCup';
import { createOfficeRug } from './OfficeRug';
import { createCampinaWindow } from './CampinaWindow';
import { addWindowSunlight } from './WindowSunlight';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';

export default function ScrollOfficeScene({ progress, transition = 0, hologramProgress = 0, laboratoryProgress = 0 }: { progress: number; transition?: number; hologramProgress?: number; laboratoryProgress?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const target = useRef(progress);
  const labTarget = useRef(laboratoryProgress);
  useEffect(() => { labTarget.current = laboratoryProgress; }, [laboratoryProgress]);
  const hologramTarget = useRef(hologramProgress);
  useEffect(() => { hologramTarget.current = hologramProgress; }, [hologramProgress]);
  const exitTarget = useRef(transition);
  useEffect(() => { exitTarget.current = transition; }, [transition]);
  const [failed, setFailed] = useState(false);
  useEffect(() => { target.current = progress; }, [progress]);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { setFailed(true); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const characterScene = new THREE.Scene();
    const destinationScene = new THREE.Scene();
    renderer.autoClear = false;
    const officePanel = container.closest('.office-sticky')?.querySelector('.office-background');
    const camera = new THREE.OrthographicCamera(-4, 4, 3.4, -3.4, 0.1, 60);
    camera.position.set(6.5, 5.4, 8.5); camera.lookAt(0, 1.65, 0);
    scene.add(new THREE.HemisphereLight('#fff6e8', '#bd9970', 2.6));
    const sun = new THREE.DirectionalLight('#fff2dd', 4);
    sun.position.set(-3, 7, 5); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -6; sun.shadow.camera.right = 6; sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6; sun.shadow.normalBias = 0.03; sun.shadow.radius = 4;
    scene.add(sun);
    const fill = new THREE.DirectionalLight('#e4ecff', 1.2); fill.position.set(4, 3, -3); scene.add(fill);
    const resources: Array<{ dispose: () => void }> = [];
    const mat = (color: string, roughness = 0.75) => { const material = new THREE.MeshStandardMaterial({ color, roughness }); resources.push(material); return material; };
    // Separate character materials preserve the office's original appearance.
    const holoUniforms = { uHoloProgress: { value: 0 }, uHoloTime: { value: 0 }, uHoloTop: { value: 4.15 }, uHoloBase: { value: 0.13 } };
    const holoMaterials = new Map<string, THREE.Material>();
    const holographicMaterial = (original: THREE.Material, hideDetail = false) => {
      const key = `${original.uuid}-${hideDetail}`;
      const cached = holoMaterials.get(key);
      if (cached) return cached;
      const material = original.clone();
      material.transparent = true;
      material.depthWrite = true;
      resources.push(material);
      material.onBeforeCompile = shader => {
        Object.assign(shader.uniforms, holoUniforms);
        shader.vertexShader = 'varying vec3 vHoloPosition;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvHoloPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        shader.fragmentShader = 'uniform float uHoloProgress;\nuniform float uHoloTime;\nuniform float uHoloTop;\nuniform float uHoloBase;\nvarying vec3 vHoloPosition;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
          float coverage = uHoloProgress < 0.0001 ? 0.0 : (uHoloProgress > 0.999 ? 1.0 : 1.0 - smoothstep(uHoloBase + uHoloProgress * uHoloTop - 0.025, uHoloBase + uHoloProgress * uHoloTop + 0.025, vHoloPosition.y));
          ${hideDetail ? 'if (coverage > 0.5) discard;' : ''}
          float scan = pow(0.5 + 0.5 * sin(vHoloPosition.y * 68.0 - uHoloTime * 4.0), 5.0);
          float contour = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.0);
          float pulse = 0.5 + 0.5 * sin(vHoloPosition.y * 12.0 - uHoloTime * 3.0);
          vec3 cyan = vec3(0.015, 0.13, 0.29) + vec3(0.14, 0.66, 0.86) * (scan * 0.15 + contour * 0.85 + pulse * 0.04);
          float edge = (1.0 - smoothstep(0.0, 0.045, abs(vHoloPosition.y - (uHoloBase + uHoloProgress * uHoloTop)))) * step(0.001, uHoloProgress) * (1.0 - step(0.999, uHoloProgress));
          outgoingLight = mix(outgoingLight, cyan, coverage) + vec3(0.02, 0.8, 1.0) * edge;
          diffuseColor.a = mix(diffuseColor.a, clamp(0.16 + scan * 0.07 + contour * 0.36, 0.16, 0.65), coverage);
          #include <opaque_fragment>
        `);
      };
      material.customProgramCacheKey = () => `office-hologram-v3-${hideDetail}`;
      holoMaterials.set(key, material); return material;
    };
    const white = mat('#faf8f2'), cream = mat('#e3d1a1'), wood = mat('#cba06a'), hair = mat('#28211e'), skin = mat('#d7a47e'), purple = mat('#595469'), blue = mat('#98c3d7'), pink = mat('#e47489'), steel = mat('#85858d', 0.4);
    characterScene.add(new THREE.HemisphereLight('#fff6e8', '#bd9970', 2.6));
    const characterSun = sun.clone(); characterSun.castShadow = false; characterScene.add(characterSun);
    characterScene.add(fill.clone());
    destinationScene.add(new THREE.HemisphereLight('#fff6e8', '#bd9970', 2.6), characterSun.clone(), fill.clone());
    const room = new THREE.Group(); scene.add(room);
    const cameraBase = new THREE.Vector3(6.5, 5.4, 8.5);
    const scenePointer = new THREE.Vector2(), easedPointer = new THREE.Vector2();
    const followScenePointer = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      scenePointer.set(event.clientX / window.innerWidth * 2 - 1, event.clientY / window.innerHeight * 2 - 1);
    };
    const centerScenePointer = () => scenePointer.set(0, 0);
    window.addEventListener('pointermove', followScenePointer);
    window.addEventListener('blur', centerScenePointer);
    document.documentElement.addEventListener('pointerleave', centerScenePointer);
    const cube = new RoundedBoxGeometry(1, 1, 1, 3, 0.09); resources.push(cube);
    const sphere = new THREE.SphereGeometry(1, 24, 20); resources.push(sphere);
    const mesh = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, pos: number[], scale: number[]) => { const object = new THREE.Mesh(geometry, material); object.position.set(pos[0], pos[1], pos[2]); object.scale.set(scale[0], scale[1], scale[2]); object.castShadow = true; object.receiveShadow = true; parent.add(object); return object; };
    const box = (parent: THREE.Object3D, material: THREE.Material, pos: number[], size: number[]) => mesh(parent, cube, material, pos, size);
    const ball = (parent: THREE.Object3D, material: THREE.Material, pos: number[], size: number[]) => mesh(parent, sphere, material, pos, size);
    const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 20); resources.push(cylinderGeometry);
    const cylinder = (parent: THREE.Object3D, material: THREE.Material, pos: number[], radius: number, height: number) => mesh(parent, cylinderGeometry, material, pos, [radius, height, radius]);
    room.add(createOfficeRug(resources));
    const floorGeometry = new THREE.PlaneGeometry(100, 100); resources.push(floorGeometry);
    const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.045 }); resources.push(shadowMaterial);
    const floor = new THREE.Mesh(floorGeometry, shadowMaterial); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.position.y = -0.005; scene.add(floor);
    // Broad, feathered contact shadow centered directly beneath the desk.
    const deskShadowGeometry = new THREE.PlaneGeometry(5.25, 2.55); resources.push(deskShadowGeometry);
    const deskShadowMaterial = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec2 vUv; void main() {
        vec2 edge = max(abs(vUv - 0.5) - vec2(0.30, 0.14), vec2(0.0));
        float falloff = dot(edge / vec2(0.14, 0.19), edge / vec2(0.14, 0.19));
        gl_FragColor = vec4(0.20, 0.17, 0.14, 0.21 * exp(-falloff * 2.0));
      }`,
    }); resources.push(deskShadowMaterial);
    const deskShadow = new THREE.Mesh(deskShadowGeometry, deskShadowMaterial);
    deskShadow.rotation.x = -Math.PI / 2; deskShadow.position.set(0, 0.004, -0.57); room.add(deskShadow);
    // Open-front side wall on the left of the workstation.
    const sideWallMaterial=mat('#e8e0d2',.94);
    const backWallGeometry=new THREE.BoxGeometry(6.08,3.80,.12);resources.push(backWallGeometry);
    // Compensate the camera's downward projection across the upper edge.
    // The left corner keeps its join with the side wall; objects stay put.
    const backWallVertices=backWallGeometry.getAttribute('position');
    for(let i=0;i<backWallVertices.count;i++)if(backWallVertices.getY(i)>0){
      const across=backWallVertices.getX(i)/6.08+.5;
      backWallVertices.setY(i,backWallVertices.getY(i)+across*.95);
    }
    backWallGeometry.computeVertexNormals();backWallGeometry.computeBoundingSphere();
    const backWall=mesh(room,backWallGeometry,sideWallMaterial,[.06,1.90,-1.68],[1,1,1]);
    backWall.castShadow=false;backWall.receiveShadow=true;
    box(room,white,[.06,.095,-1.605],[6.08,.19,.035]);
    // Four wall sections leave a real opening for the large glass window.
    const wallPanelGeometry=new THREE.BoxGeometry(1,1,1);resources.push(wallPanelGeometry);
    const wallSection=(y:number,z:number,height:number,length:number)=>{
      const part=mesh(room,wallPanelGeometry,sideWallMaterial,[-2.98,y,z],[.12,height,length]);part.castShadow=false;return part;
    };
    const wallBack=-1.62,wallLength=4.65,wallFront=wallBack+wallLength,wallCenter=(wallBack+wallFront)/2;
    const windowCenterY=2.23,windowCenterZ=.73,windowWidth=3.00,windowHeight=2.02;
    const windowBottom=windowCenterY-windowHeight/2,windowTop=windowCenterY+windowHeight/2;
    const windowBack=windowCenterZ-windowWidth/2,windowFront=windowCenterZ+windowWidth/2;
    wallSection(windowBottom/2,wallCenter,windowBottom,wallLength);
    wallSection((3.8+windowTop)/2,wallCenter,3.8-windowTop,wallLength);
    wallSection(windowCenterY,(wallBack+windowBack)/2,windowHeight,windowBack-wallBack);
    wallSection(windowCenterY,(windowFront+wallFront)/2,windowHeight,wallFront-windowFront);
    const frameMaterial=mat('#f6f5ed',.32),sealMaterial=mat('#7495a2',.45);
    for(const z of [windowBack,windowFront])box(room,frameMaterial,[-2.895,windowCenterY,z],[.20,windowHeight+.15,.095]);
    for(const y of [windowBottom,windowTop])box(room,frameMaterial,[-2.895,y,windowCenterZ],[.20,.095,windowWidth+.095]);
    box(room,sealMaterial,[-2.895,windowCenterY,windowCenterZ],[.065,windowHeight,.045]);
    box(room,frameMaterial,[-2.865,windowCenterY,windowCenterZ],[.075,windowHeight,.065]);
    box(room,white,[-2.81,windowBottom-.04,windowCenterZ],[.40,.085,windowWidth+.22]);
    const {texture:skyTexture,update:updateWindowView,isRainy,setWeather}=createCampinaWindow(resources);
    const skyMaterial=new THREE.MeshBasicMaterial({map:skyTexture,toneMapped:false});resources.push(skyMaterial);
    const windowGeometry=new THREE.PlaneGeometry(windowWidth,windowHeight);resources.push(windowGeometry);
    const skyView=new THREE.Mesh(windowGeometry,skyMaterial);skyView.rotation.y=Math.PI/2;skyView.position.set(-3.065,windowCenterY,windowCenterZ);room.add(skyView);
    const glassMaterial=new THREE.MeshPhysicalMaterial({color:'#cae6ee',transparent:true,opacity:.23,roughness:.08,metalness:.05,clearcoat:1,clearcoatRoughness:.04,side:THREE.DoubleSide,depthWrite:false});resources.push(glassMaterial);
    const windowGlass=new THREE.Mesh(windowGeometry,glassMaterial);windowGlass.rotation.y=Math.PI/2;windowGlass.position.set(-2.925,windowCenterY,windowCenterZ);room.add(windowGlass);
    const reflectionMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'varying vec2 vUv;void main(){float diagonal=vUv.x+vUv.y*.36;float stripe=(smoothstep(.22,.24,diagonal)-smoothstep(.32,.34,diagonal))*.19+(smoothstep(.36,.37,diagonal)-smoothstep(.39,.40,diagonal))*.26;gl_FragColor=vec4(1.,1.,1.,stripe);}',
    });resources.push(reflectionMaterial);
    const reflection=new THREE.Mesh(windowGeometry,reflectionMaterial);reflection.rotation.y=Math.PI/2;reflection.position.set(-2.916,windowCenterY,windowCenterZ);room.add(reflection);
    box(room,white,[-2.905,.095,wallCenter],[.035,.19,wallLength]);
    addWindowSunlight(room,resources);
    const furnitureBlue = mat('#b3d8ee');
    // Light blue desk, wooden legs and two monitors.
    // One continuous L-shaped tabletop, extending toward the viewer by the globe.
    const deskShape = new THREE.Shape();
    const move = (x: number, z: number) => deskShape.moveTo(x, -z);
    const line = (x: number, z: number) => deskShape.lineTo(x, -z);
    const round = (x: number, z: number, xx: number, zz: number) => deskShape.quadraticCurveTo(x, -z, xx, -zz);
    move(-2.08, -1.38); line(2.08, -1.38); round(2.2, -1.38, 2.2, -1.26);
    line(2.2, 0.12); round(2.2, 0.24, 2.08, 0.24);
    line(-0.94, 0.24); round(-1.04, 0.24, -1.04, 0.34);
    line(-1.04, 1.35); round(-1.04, 1.47, -1.16, 1.47);
    line(-2.08, 1.47); round(-2.2, 1.47, -2.2, 1.35);
    line(-2.2, -1.26); round(-2.2, -1.38, -2.08, -1.38);
    const deskGeometry = new THREE.ExtrudeGeometry(deskShape, { depth: 0.13, bevelEnabled: true, bevelSize: 0.009, bevelThickness: 0.009, bevelSegments: 2, curveSegments: 12 }); resources.push(deskGeometry);
    const desk = new THREE.Mesh(deskGeometry, furnitureBlue); desk.rotation.x = -Math.PI / 2; desk.position.y = 1.265;
    desk.castShadow = true; desk.receiveShadow = true; room.add(desk);
    for (const [x, z] of [[-1.83, -1.14], [-1.83, 1.15], [-1.22, 1.15], [1.83, -1.14], [1.83, 0.05]]) cylinder(room, wood, [x, 0.66, z], 0.095, 1.27);
    const extensionShadowGeometry = new THREE.PlaneGeometry(1.9, 2.5); resources.push(extensionShadowGeometry);
    const extensionShadow = new THREE.Mesh(extensionShadowGeometry, deskShadowMaterial);
    extensionShadow.rotation.x = -Math.PI / 2; extensionShadow.position.set(-1.62, 0.005, 0.50); room.add(extensionShadow);
    const animatedScreens: Array<(time: number, mouseAmount: number) => void> = [];
    const makeScreen = (left: boolean) => {
      const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 320;
      const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#30343b'; ctx.fillRect(0, 0, 512, 320);
      ctx.fillStyle = '#262a30'; ctx.fillRect(0, 0, left ? 120 : 64, 320);
      const palette = ['#a9c96a', '#b68dd7', '#e9b066', '#b3d7e0', '#d08f8b'];
      for (let i = 0; i < 18; i++) { ctx.fillStyle = palette[i % palette.length]; ctx.fillRect((left ? 137 : 80) + (i % 3) * 12, 22 + i * 15, 35 + (i * 47) % 220, 4); }
      for (let i = 0; i < 7; i++) { ctx.fillStyle = i === 0 ? '#6793b4' : '#42494e'; ctx.fillRect(16, 18 + i * 35, 22, 22); }
      const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; resources.push(texture);
      const code = [
        'const observatorio = {', '  industria: "Paraíba",', '  dados: indicadores,', '  inovacao: true', '};', '',
        'async function atualizar() {', '  const dados = await carregar();', '  return analisar(dados);', '}', '',
        'const painel = criarPainel();', 'painel.mostrar(indicadores);', 'export default observatorio;',
      ];
      animatedScreens.push((time, mouseAmount) => {
        ctx.fillStyle = '#30343b'; ctx.fillRect(0, 0, 512, 320);
        ctx.fillStyle = '#262a30'; ctx.fillRect(0, 0, left ? 120 : 64, 320);
        for (let i = 0; i < 7; i++) { ctx.fillStyle = i === 0 ? '#6793b4' : '#42494e'; ctx.fillRect(16, 18 + i * 35, 22, 22); }
        const offset = Math.floor(time * 0.45) + (left ? 0 : 4);
        ctx.font = '12px monospace';
        for (let row = 0; row < 17; row++) {
          const line = code[(row + offset) % code.length];
          const x = left ? 138 : 80, y = 24 + row * 17;
          ctx.fillStyle = palette[(row + offset) % palette.length];
          const length = row === 14 ? Math.floor(time * 13) % (line.length + 1) : line.length;
          ctx.fillText(line.slice(0, length), x, y);
          if (row === 14 && mouseAmount < 0.5 && Math.sin(time * 8) > 0) { ctx.fillStyle = '#dce4ef'; ctx.fillRect(x + length * 7.2, y - 10, 2, 12); }
        }
        if (mouseAmount > 0.1 && !left) {
          const x = 250 + Math.sin(time * 1.7) * 80, y = 170 + Math.cos(time * 1.2) * 50;
          ctx.fillStyle = '#f5f5f0'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 5, y + 15); ctx.lineTo(x + 9, y + 9); ctx.lineTo(x + 15, y + 7); ctx.closePath(); ctx.fill();
        }
        texture.needsUpdate = true;
      });
      const screenMaterial = new THREE.MeshBasicMaterial({ map: texture }); resources.push(screenMaterial);
      const plane = new THREE.PlaneGeometry(1.48, 0.93); resources.push(plane);
      const group = new THREE.Group(); group.position.set(left ? -0.86 : 0.86, 1.97, -0.87); group.rotation.y = left ? 0.1 : -0.1; room.add(group);
      box(group, purple, [0, 0, 0], [1.64, 1.09, 0.13]);
      const screen = new THREE.Mesh(plane, screenMaterial); screen.position.z = 0.071; group.add(screen);
      box(group, purple, [0, -0.58, -0.015], [0.16, 0.22, 0.17]); box(group, purple, [0, -0.7, 0.06], [0.59, 0.065, 0.39]);
    };
    makeScreen(true); makeScreen(false);
    // Floating message bubble above the left monitor, outside its screen.
    const bubbleCanvas = document.createElement('canvas'); bubbleCanvas.width = 256; bubbleCanvas.height = 170;
    const bubbleContext = bubbleCanvas.getContext('2d')!;
    bubbleContext.fillStyle = '#218bda'; bubbleContext.beginPath(); bubbleContext.arc(128, 74, 65, 0, Math.PI * 2); bubbleContext.fill();
    bubbleContext.beginPath(); bubbleContext.moveTo(169, 118); bubbleContext.lineTo(195, 142); bubbleContext.lineTo(183, 106); bubbleContext.closePath(); bubbleContext.fill();
    bubbleContext.fillStyle = '#ffffff';
    for (let dot = 0; dot < 3; dot++) { bubbleContext.beginPath(); bubbleContext.arc(103 + dot * 25, 74, 6, 0, Math.PI * 2); bubbleContext.fill(); }
    const bubbleTexture = new THREE.CanvasTexture(bubbleCanvas); bubbleTexture.colorSpace = THREE.SRGBColorSpace; resources.push(bubbleTexture);
    const bubbleMaterial = new THREE.SpriteMaterial({ map: bubbleTexture, transparent: true, depthWrite: false, opacity: 0 }); resources.push(bubbleMaterial);
    const messageBubble = new THREE.Sprite(bubbleMaterial); messageBubble.position.set(-1.55, 2.85, -0.57); messageBubble.scale.set(0.66, 0.438, 1); messageBubble.visible = false; room.add(messageBubble);
    box(room, mat('#d4d7de'), [0, 1.44, 0.02], [0.86, 0.045, 0.30]);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 12; col++) box(room, white, [-0.37 + col * 0.067, 1.467, -0.09 + row * 0.068], [0.049, 0.014, 0.047]);
    const computerMouse = ball(room, white, [0.71, 1.46, 0.07], [0.09, 0.035, 0.13]);
    // Observatory sign above the desk, preserving the supplied logo proportions.
    const logoImage = new Image();
    logoImage.onload = () => {
      if (disposed) return;
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = Math.round(1024 * logoImage.naturalHeight / logoImage.naturalWidth);
      canvas.getContext('2d')!.drawImage(logoImage, 0, 0, canvas.width, canvas.height);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      resources.push(texture);
      const width = 2.35, height = width * canvas.height / canvas.width;
      box(room, cream, [0.86, 3.08, -1.53], [width + 0.16, height + 0.14, 0.08]);
      box(room, white, [0.86, 3.08, -1.478], [width + 0.07, height + 0.06, 0.025]);
      const geometry = new THREE.PlaneGeometry(width, height); resources.push(geometry);
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }); resources.push(material);
      const logo = new THREE.Mesh(geometry, material);
      logo.position.set(0.86, 3.08, -1.458); room.add(logo);
      // Small emblem on the character's left chest, projected onto the shirt.
      const shirtSurface = new THREE.Mesh(shirtGeometry, white);
      shirtSurface.scale.copy(shirt.scale); shirtSurface.updateMatrixWorld(true);
      const chestGeometry = new DecalGeometry(shirtSurface, new THREE.Vector3(0.12, 0.44, -0.208), new THREE.Euler(0, Math.PI - 0.4, 0), new THREE.Vector3(0.20, 0.20 * canvas.height / canvas.width, 0.15)); resources.push(chestGeometry);
      const chestMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }); resources.push(chestMaterial);
      chestMaterial.onBeforeCompile = shader => {
        Object.assign(shader.uniforms, holoUniforms);
        shader.vertexShader = 'varying float vEmblemHeight;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvEmblemHeight = (modelMatrix * vec4(transformed, 1.0)).y;');
        shader.fragmentShader = 'uniform float uHoloProgress;\nuniform float uHoloBase;\nuniform float uHoloTop;\nvarying float vEmblemHeight;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', 'if (uHoloProgress > 0.999 || (uHoloProgress > 0.0 && vEmblemHeight < uHoloBase + uHoloProgress * uHoloTop)) discard;\n#include <opaque_fragment>');
      };
      torso.add(new THREE.Mesh(chestGeometry, chestMaterial));
    };
    logoImage.src = `${import.meta.env.BASE_URL}logoazul.png`;
    // Books and cactus above the workstation.
    // Visible soft shade immediately below the shelf's wall attachment.
    const shelfShadowMaterial = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec2 vUv; void main() {
        float horizontal = pow((vUv.x - 0.5) / 0.40, 4.0);
        float vertical = pow((vUv.y - 0.68) / 0.26, 2.0);
        gl_FragColor = vec4(0.24, 0.19, 0.14, 0.32 * exp(-horizontal - vertical));
      }`,
    }); resources.push(shelfShadowMaterial);
    const shelfShadowGeometry = new THREE.PlaneGeometry(1.58, 0.64); resources.push(shelfShadowGeometry);
    const shelfShadow = new THREE.Mesh(shelfShadowGeometry, shelfShadowMaterial);
    shelfShadow.position.set(-1.30, 2.66, -1.48); room.add(shelfShadow);
    box(room, cream, [-1.30, 2.92, -1.31], [1.25, 0.1, 0.48]);
    const makeBook=(title:string,color:string,x:number,width:number,height:number)=>{
      const book=new THREE.Group();book.position.set(x,2.97+height/2,-1.39);room.add(book);
      const cover=mat(color,.55),pages=mat('#eee6d4');
      box(book,pages,[0,0,.012],[width-.025,height-.028,.255]);
      for(const side of [-1,1])box(book,cover,[side*(width/2-.008),0,0],[.016,height,.29]);
      box(book,cover,[0,0,.143],[width,height,.022]);
      const canvas=document.createElement('canvas');canvas.width=256;canvas.height=1024;const ctx=canvas.getContext('2d')!;
      ctx.fillStyle='#f6ecd5';ctx.fillRect(28,85,200,5);ctx.fillRect(28,927,200,5);
      ctx.save();ctx.translate(128,512);ctx.rotate(-Math.PI/2);ctx.fillStyle='#fff9eb';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 76px Arial';ctx.fillText(title,0,-12,720);ctx.font='28px Arial';ctx.fillStyle='#e4d2b0';ctx.fillText('OBSERVATÓRIO DA INDÚSTRIA',0,61,680);ctx.restore();
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;resources.push(texture);
      const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,alphaTest:.02,toneMapped:false});resources.push(material);
      const geometry=new THREE.PlaneGeometry(width*.88,height*.94);resources.push(geometry);const label=new THREE.Mesh(geometry,material);label.position.z=.155;book.add(label);
      // Fine horizontal edges show the page block on the exposed cover side.
      const lineMaterial=mat('#d3c6ae');
      for(let i=0;i<9;i++)box(book,lineMaterial,[width/2-.011,-height*.37+i*height*.09,.006],[.003,.002,.226]);
    };
    makeBook('PESQUISAS','#275a78',-1.66,.17,.55);
    makeBook('DADOS PARAÍBA','#b77d25',-1.43,.23,.59);
    // A compact weather switch replaces the cactus on the shelf.
    const weatherBox=new THREE.Group();weatherBox.position.set(-.96,3.21,-1.29);room.add(weatherBox);
    box(weatherBox,mat('#e7e6dd'),[0,0,0],[.43,.48,.23]);
    const weatherIndicator=mat('#e7b956');
    ball(weatherBox,weatherIndicator,[0,.025,.133],[.12,.12,.035]);
    const weatherLabel=document.createElement('canvas');weatherLabel.width=256;weatherLabel.height=64;
    const labelContext=weatherLabel.getContext('2d')!;labelContext.fillStyle='#52646a';labelContext.font='bold 26px sans-serif';labelContext.textAlign='center';labelContext.fillText('SOL / CHUVA',128,42);
    const weatherLabelTexture=new THREE.CanvasTexture(weatherLabel);weatherLabelTexture.colorSpace=THREE.SRGBColorSpace;resources.push(weatherLabelTexture);
    const weatherLabelMaterial=new THREE.MeshBasicMaterial({map:weatherLabelTexture,transparent:true});resources.push(weatherLabelMaterial);
    const weatherLabelGeometry=new THREE.PlaneGeometry(.34,.085);resources.push(weatherLabelGeometry);
    const weatherLabelMesh=new THREE.Mesh(weatherLabelGeometry,weatherLabelMaterial);weatherLabelMesh.position.set(0,-.16,.118);weatherBox.add(weatherLabelMesh);
    // Pencil cup, branded globe, puzzle cube and speaker.
    cylinder(room, wood, [-1.68, 1.58, -0.38], 0.10, 0.28);
    const pencilWood = mat('#e9c69b'), graphite = mat('#38353a');
    const pencilTipGeometry = new THREE.ConeGeometry(0.024, 0.085, 16); resources.push(pencilTipGeometry);
    const graphiteTipGeometry = new THREE.ConeGeometry(0.008, 0.032, 12); resources.push(graphiteTipGeometry);
    for (const [x, material, angle] of [[-1.71, blue, -0.12], [-1.64, pink, 0.15]] as const) {
      const pencil = new THREE.Group(); pencil.position.set(x, 1.81, -0.38); pencil.rotation.z = angle; room.add(pencil);
      cylinder(pencil, material, [0, 0, 0], 0.024, 0.42);
      const woodTip = new THREE.Mesh(pencilTipGeometry, pencilWood); woodTip.position.y = 0.2525; woodTip.castShadow = true; pencil.add(woodTip);
      const tip = new THREE.Mesh(graphiteTipGeometry, graphite); tip.position.y = 0.291; tip.castShadow = true; pencil.add(tip);
    }
    // Tabletop globe with the Observatory emblem on its curved surface.
    const globeCenter = new THREE.Vector3(-1.70, 1.70, 0.86);
    cylinder(room, mat('#145f8c'), [-1.70, 1.435, 0.86], 0.17, 0.045);
    cylinder(room, steel, [-1.70, 1.49, 0.86], 0.025, 0.08);
    const globeGroup = new THREE.Group(); globeGroup.position.copy(globeCenter); room.add(globeGroup);
    const globe = ball(globeGroup, mat('#dbeefa', 0.35), [0, 0, 0], [0.22, 0.22, 0.22]);
    const globeRingGeometry = new THREE.TorusGeometry(0.25, 0.013, 8, 48); resources.push(globeRingGeometry);
    const globeRing = new THREE.Mesh(globeRingGeometry, steel);
    globeRing.position.copy(globeCenter); globeRing.rotation.y = 0.5; globeRing.rotation.z = -0.22;
    room.add(globeRing);
    const emblemTexture = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}observatorio_favicon_azul.png`);
    emblemTexture.colorSpace = THREE.SRGBColorSpace; resources.push(emblemTexture);
    const emblemMaterial = new THREE.MeshStandardMaterial({ map: emblemTexture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, roughness: 0.55 }); resources.push(emblemMaterial);
    scene.updateMatrixWorld(true);
    const emblemAngle = 0.65;
    const emblemCenter = globeCenter.clone().add(new THREE.Vector3(Math.sin(emblemAngle) * 0.205, 0, Math.cos(emblemAngle) * 0.205));
    const emblemGeometry = new DecalGeometry(globe, emblemCenter, new THREE.Euler(0, emblemAngle, 0), new THREE.Vector3(0.34, 0.34, 0.18)); resources.push(emblemGeometry);
    emblemGeometry.translate(-globeCenter.x, -globeCenter.y, -globeCenter.z);
    globeGroup.add(new THREE.Mesh(emblemGeometry, emblemMaterial));
    const raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2();
    const toggleWindowWeather=(event:PointerEvent)=>{
      if(!room.visible||exitTarget.current>.05||event.button!==0)return;
      const bounds=renderer.domElement.getBoundingClientRect();
      mouse.set((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);
      room.updateMatrixWorld(true);camera.updateMatrixWorld();raycaster.setFromCamera(mouse,camera);
      if(raycaster.intersectObject(weatherBox,true).length){
        setWeather(!isRainy());event.preventDefault();
      }
    };
    renderer.domElement.addEventListener('pointerup',toggleWindowWeather);
    let draggingGlobe = false, dragPointer = -1, lastMouseX = 0, lastMouseY = 0;
    const overGlobe = (event: PointerEvent) => {
      if (!room.visible) return false;
      const bounds = renderer.domElement.getBoundingClientRect();
      mouse.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
      scene.updateMatrixWorld(true); camera.updateMatrixWorld();
      raycaster.setFromCamera(mouse, camera);
      return raycaster.intersectObject(globeGroup, true).length > 0;
    };
    const startGlobeDrag = (event: PointerEvent) => {
      if (labTarget.current>.01 || event.button !== 0 || !overGlobe(event)) return;
      event.preventDefault(); draggingGlobe = true; dragPointer = event.pointerId;
      lastMouseX = event.clientX; lastMouseY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.style.cursor = 'grabbing';
    };
    const moveGlobe = (event: PointerEvent) => {
      if (draggingGlobe && event.pointerId === dragPointer) {
        globeGroup.rotation.y += (event.clientX - lastMouseX) * 0.018;
        globeGroup.rotation.x += (event.clientY - lastMouseY) * 0.018;
        lastMouseX = event.clientX; lastMouseY = event.clientY;
      } else if(labTarget.current>.95)return;
      else renderer.domElement.style.cursor = overGlobe(event) ? 'grab' : 'default';
    };
    const stopGlobeDrag = (event: PointerEvent) => {
      if (event.pointerId !== dragPointer) return;
      draggingGlobe = false; dragPointer = -1;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
      renderer.domElement.style.cursor = 'default';
    };
    let laboratoryPointer=-1,orbitYaw=0,viewYaw=0,orbitX=0;
    let chairReady=false,draggingChair=false,chairYaw=0,chairYawTarget=0;
    const overChair=(event:PointerEvent)=>{
      if(!chairReady)return false;
      const bounds=renderer.domElement.getBoundingClientRect();
      mouse.set((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);
      laboratory.updateMatrixWorld(true);character.updateMatrixWorld(true);camera.updateMatrixWorld();
      raycaster.setFromCamera(mouse,camera);
      return raycaster.intersectObjects([laboratoryChair,character],true).some(hit=>hit.object.visible);
    };
    const startLabOrbit=(event:PointerEvent)=>{
      if(labTarget.current<.95||event.button!==0||event.pointerType==='touch')return;
      event.preventDefault();draggingChair=overChair(event);laboratoryPointer=event.pointerId;orbitX=event.clientX;
      renderer.domElement.style.cursor='grabbing';
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const moveLabOrbit=(event:PointerEvent)=>{
      if(event.pointerId!==laboratoryPointer){if(chairReady)renderer.domElement.style.cursor=overChair(event)?'grab':'default';return;}
      if(draggingChair&&chairReady)chairYawTarget+=(event.clientX-orbitX)*.009;
      else orbitYaw=THREE.MathUtils.clamp(orbitYaw-(event.clientX-orbitX)*.004,-.28,.28);
      orbitX=event.clientX;
    };
    const stopLabOrbit=(event:PointerEvent)=>{
      if(event.pointerId!==laboratoryPointer)return;
      laboratoryPointer=-1;draggingChair=false;renderer.domElement.style.cursor='default';
      if(renderer.domElement.hasPointerCapture(event.pointerId))renderer.domElement.releasePointerCapture(event.pointerId);
    };
    renderer.domElement.addEventListener('pointerdown',startLabOrbit);
    renderer.domElement.addEventListener('pointermove',moveLabOrbit);
    renderer.domElement.addEventListener('pointerup',stopLabOrbit);
    renderer.domElement.addEventListener('pointercancel',stopLabOrbit);
    renderer.domElement.addEventListener('pointerdown', startGlobeDrag);
    renderer.domElement.addEventListener('pointermove', moveGlobe);
    renderer.domElement.addEventListener('pointerup', stopGlobeDrag);
    renderer.domElement.addEventListener('pointercancel', stopGlobeDrag);
    const {group:deskCup,update:updateDeskCup}=createDeskCup(resources);
    deskCup.position.set(1.70,1.39,-.01);room.add(deskCup);
    box(room, mat('#357bb5'), [1.99, 1.64, -0.42], [0.29, 0.46, 0.27]); ball(room, purple, [1.99, 1.67, -0.27], [0.10, 0.11, 0.027]);
    // Sculpted glazed planter with curved, layered foliage.
    const potMaterial = mat('#7da7c2', 0.3), soilMaterial = mat('#463c30');
    const stemMaterial = mat('#3f7045');
    const leafMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, side: THREE.DoubleSide, roughness: 0.42 }); resources.push(leafMaterial);
    const veinMaterial = mat('#78a16c');
    const trimMaterial = mat('#b9a071', 0.35); trimMaterial.metalness = 0.55;
    const plant = new THREE.Group(); plant.position.set(2.75, 0, -0.72); room.add(plant);
    const potProfile = [[0.22, 0.04], [0.245, 0.06], [0.265, 0.14], [0.30, 0.28], [0.33, 0.43], [0.33, 0.54], [0.315, 0.59], [0.296, 0.59], [0.30, 0.53], [0.29, 0.44]].map(([radius, y]) => new THREE.Vector2(radius, y));
    const potGeometry = new THREE.LatheGeometry(potProfile, 96); resources.push(potGeometry);
    const potVertices = potGeometry.attributes.position;
    for (let i = 0; i < potVertices.count; i++) {
      const x = potVertices.getX(i), z = potVertices.getZ(i);
      const ridge = 1 + Math.sin(Math.atan2(z, x) * 40) * 0.008;
      potVertices.setX(i, x * ridge); potVertices.setZ(i, z * ridge);
    }
    potGeometry.computeVertexNormals();
    const pot = new THREE.Mesh(potGeometry, potMaterial); pot.castShadow = true; pot.receiveShadow = true; plant.add(pot);
    cylinder(plant, potMaterial, [0, 0.026, 0], 0.27, 0.038);
    const rimGeometry = new THREE.TorusGeometry(0.314, 0.009, 10, 64); resources.push(rimGeometry);
    const rim = new THREE.Mesh(rimGeometry, trimMaterial); rim.rotation.x = Math.PI / 2; rim.position.y = 0.585; plant.add(rim);
    cylinder(plant, soilMaterial, [0, 0.543, 0], 0.29, 0.016);
    for (let i = 0; i < 12; i++) {
      const angle = i * Math.PI * 2 / 12 + 0.3;
      const height = 0.76 + (i % 4) * 0.14;
      const tip = new THREE.Vector3(Math.cos(angle) * 0.13, height, Math.sin(angle) * 0.13);
      const stemCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(tip.x * 0.2, height * 0.85, tip.z * 0.2), tip);
      const stemGeometry = new THREE.TubeGeometry(stemCurve, 18, 0.012, 6, false); resources.push(stemGeometry);
      const stem = new THREE.Mesh(stemGeometry, stemMaterial); stem.castShadow = true; plant.add(stem);
      const length = 0.55 + (i % 3) * 0.07, halfWidth = 0.15 + (i % 2) * 0.025;
      const leafGeometry = new THREE.PlaneGeometry(1, 1, 8, 24); resources.push(leafGeometry);
      const leafVertices = leafGeometry.attributes.position;
      const colors = new Float32Array(leafVertices.count * 3);
      const darkGreen = new THREE.Color(i % 2 ? '#376944' : '#427b4c');
      const lightGreen = new THREE.Color(i % 2 ? '#6b9a5c' : '#85aa65');
      const leafColor = new THREE.Color();
      for (let vertex = 0; vertex < leafVertices.count; vertex++) {
        const across = leafVertices.getX(vertex) * 2;
        const t = leafVertices.getY(vertex) + 0.5;
        const silhouette = Math.pow(Math.sin(t * Math.PI), 0.75);
        leafVertices.setXYZ(vertex, across * halfWidth * silhouette, t * length, -0.18 * t * t + across * across * 0.035 * silhouette);
        leafColor.copy(darkGreen).lerp(lightGreen, (1 - Math.abs(across)) * 0.45 + t * 0.25);
        colors[vertex * 3] = leafColor.r; colors[vertex * 3 + 1] = leafColor.g; colors[vertex * 3 + 2] = leafColor.b;
      }
      leafGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3)); leafGeometry.computeVertexNormals();
      const leafGroup = new THREE.Group(); leafGroup.position.copy(tip); leafGroup.rotation.set(0.35 + (i % 3) * 0.18, -angle, 0); plant.add(leafGroup);
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial); leaf.castShadow = true; leaf.receiveShadow = true; leafGroup.add(leaf);
      const veinPoints = Array.from({ length: 18 }, (_, point) => { const t = point / 17; return new THREE.Vector3(0, t * length, -0.18 * t * t + 0.003); });
      const veinGeometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(veinPoints), 20, 0.0025, 4, false); resources.push(veinGeometry);
      leafGroup.add(new THREE.Mesh(veinGeometry, veinMaterial));
    }
    // Chair and articulated cartoon character.
    const chair = new THREE.Group(); chair.position.z = 0.85; room.add(chair);
    box(chair, furnitureBlue, [0, 0.87, 0], [0.76, 0.13, 0.7]); box(chair, furnitureBlue, [0, 1.25, 0.33], [0.76, 0.85, 0.13]);
    for (const x of [-0.29, 0.29]) {
      const tube = cylinder(chair, steel, [x, 0.47, 0.1], 0.033, 0.72); tube.rotation.x = -0.29;
      box(chair, steel, [x, 0.15, 0.08], [0.07, 0.06, 0.84]);
    }
    box(chair, steel, [0, 0.15, 0.45], [0.66, 0.06, 0.07]);
    // Keep the character independent so the office can leave without moving him.
    const character = new THREE.Group(); characterScene.add(character);
    const torso = new THREE.Group(); character.add(torso);
    // Single continuous shirt from the shoulders to the hips.
    const shirtProfile = [
      new THREE.Vector2(0, -0.12), new THREE.Vector2(0.30, -0.12),
      new THREE.Vector2(0.30, -0.115), new THREE.Vector2(0.30, 0.08),
      new THREE.Vector2(0.30, 0.30), new THREE.Vector2(0.29, 0.48),
      new THREE.Vector2(0.26, 0.59), new THREE.Vector2(0.18, 0.66),
      new THREE.Vector2(0.12, 0.69),
    ];
    const shirtGeometry = new THREE.LatheGeometry(shirtProfile, 40); resources.push(shirtGeometry);
    // Flatten the lower front and back instead of a circular hem.
    const shirtVertices = shirtGeometry.attributes.position;
    for (let i = 0; i < shirtVertices.count; i++) {
      const y = shirtVertices.getY(i);
      const blend = 1 - THREE.MathUtils.smoothstep(y, 0.08, 0.30);
      const x = shirtVertices.getX(i), z = shirtVertices.getZ(i);
      const radius = Math.hypot(x, z);
      if (radius < 0.001 || blend <= 0) continue;
      const nx = x / radius, nz = z / radius;
      const flatX = Math.sign(nx) * Math.pow(Math.abs(nx), 0.30) * radius;
      const flatZ = Math.sign(nz) * Math.pow(Math.abs(nz), 0.30) * radius;
      shirtVertices.setXYZ(i, THREE.MathUtils.lerp(x, flatX, blend), y, THREE.MathUtils.lerp(z, flatZ, blend));
    }
    shirtGeometry.computeVertexNormals();
    const shirt = new THREE.Mesh(shirtGeometry, white); shirt.scale.z = 0.78;
    shirt.castShadow = true; shirt.receiveShadow = true; torso.add(shirt);
    // Shoulder caps overlap both the shirt and sleeve; only the smooth outer
    // contour is visible, rather than a separate spherical joint.
    for (const side of [-1, 1]) {
      ball(torso, white, [side * 0.215, 0.515, 0], [0.135, 0.145, 0.15]);
    }
    cylinder(torso, skin, [0, 0.75, 0], 0.12, 0.17);
    const head = new THREE.Group(); head.position.set(0, 1.11, -0.01);
    // A longer oval silhouette, closer to the reference portrait.
    head.scale.set(0.90, 1.12, 0.97);
    torso.add(head);
    ball(head, skin, [0, 0, -0.025], [0.45, 0.47, 0.41]);
    // Swept quiff with a broad continuous contour, blended into the hair cap.
    const hairCap = ball(head, hair, [0, 0.12, 0.075], [0.462, 0.415, 0.39]);
    // Extend the lower rear contour toward the nape without moving the fringe.
    // Shape the temples and nape in one surface, without separate side pieces.
    hairCap.geometry = new THREE.SphereGeometry(1, 64, 48); resources.push(hairCap.geometry);
    const hairCapVertices = hairCap.geometry.attributes.position;
    for (let i = 0; i < hairCapVertices.count; i++) {
      const x = hairCapVertices.getX(i), y = hairCapVertices.getY(i), z = hairCapVertices.getZ(i);
      const templeBlend = THREE.MathUtils.smoothstep(Math.abs(x), 0.55, 0.85)
        * Math.exp(-Math.pow((z + 0.52) / 0.32, 2))
        * Math.exp(-Math.pow((y + 0.28) / 0.45, 2));
      const rearBlend = THREE.MathUtils.smoothstep(z, -0.10, 0.65);
      const lowerBlend = 1 - THREE.MathUtils.smoothstep(y, -0.65, 0.35);
      hairCapVertices.setXYZ(i,
        x + Math.sign(x) * 0.16 * templeBlend,
        y - 0.42 * rearBlend * lowerBlend - 0.28 * templeBlend,
        z);

    }
    hairCapVertices.needsUpdate = true;
    hairCap.geometry.computeVertexNormals();
    hairCap.geometry.computeBoundingSphere();
    const quiffGeometry = new THREE.SphereGeometry(1, 48, 32); resources.push(quiffGeometry);
    const quiffPositions = quiffGeometry.attributes.position;
    for (let i = 0; i < quiffPositions.count; i++) {
      const x = quiffPositions.getX(i), y = quiffPositions.getY(i), z = quiffPositions.getZ(i);
      // Flatter underside and asymmetric sweep avoid a separate round tuft.
      quiffPositions.setXYZ(i, x * 0.405 + y * 0.035, y * (y > 0 ? 0.19 : 0.105) + x * 0.055, z * 0.285);
    }
    quiffGeometry.computeVertexNormals();
    const quiff = new THREE.Mesh(quiffGeometry, hair); quiff.position.set(-0.015, 0.375, -0.115);
    quiff.rotation.y = -0.10; quiff.castShadow = true; head.add(quiff);
    const faceDetailStart = head.children.length;
    // Small bridge and rounded tip following the reference nose proportions.
    ball(head, skin, [0, -0.015, -0.418], [0.035, 0.105, 0.040]);
    ball(head, skin, [0, -0.085, -0.456], [0.061, 0.045, 0.054]);
    for (const side of [-1, 1]) ball(head, skin, [side * 0.047, -0.10, -0.428], [0.028, 0.028, 0.031]);
    for (const x of [-0.42, 0.42]) ball(head, skin, [x, -0.07, -0.055], [0.09, 0.13, 0.08]).userData.keepHologramSilhouette = true;
    const irisBrown = mat('#493124');
    // Restore the original large, rounded cartoon eyes.
    for (const x of [-0.17, 0.17]) {
      ball(head, white, [x, 0.05, -0.389], [0.105, 0.13, 0.026]);
      ball(head, irisBrown, [x, 0.045, -0.420], [0.050, 0.076, 0.015]);
      ball(head, white, [x - 0.014, 0.078, -0.435], [0.012, 0.019, 0.005]);
    }
    // Dark eyebrows and a close-cropped beard inspired by the supplied photo.
    for (const side of [-1, 1]) {
      const points = Array.from({ length: 12 }, (_, i) => {
        const t = i / 11;
        return new THREE.Vector3(side * 0.17 - 0.12 + t * 0.24, 0.18 + Math.sin(t * Math.PI) * 0.025, -0.385);
      });
      const eyebrowGeometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 18, 0.023, 8, false); resources.push(eyebrowGeometry);
      head.add(new THREE.Mesh(eyebrowGeometry, hair));
    }
    const beardMaterial = mat('#2c2521'); beardMaterial.side = THREE.DoubleSide;
    const beardSurfaceMaterial = mat('#ffffff'); beardSurfaceMaterial.vertexColors = true; beardSurfaceMaterial.side = THREE.DoubleSide;
    const beardGeometry = new THREE.PlaneGeometry(1, 1, 48, 18); resources.push(beardGeometry);
    const beardPositions = beardGeometry.attributes.position;
    const beardColors = new Float32Array(beardPositions.count * 3);
    const beardTone = new THREE.Color('#2c2521'), skinTone = new THREE.Color('#d7a47e');
    const beardShade = new THREE.Color();
    for (let row = 0; row <= 18; row++) for (let col = 0; col <= 48; col++) {
      const phi = Math.PI + col / 48 * Math.PI;
      const cheek = Math.abs(Math.cos(phi));
      const topY = -0.265 + Math.pow(cheek, 1.3) * 0.205;
      const startTheta = Math.acos(topY / 0.477);
      const theta = startTheta + (2.98 - startTheta) * row / 18;
      const index = row * 49 + col;
      beardPositions.setXYZ(index, -Math.sin(theta) * Math.cos(phi) * 0.454, Math.cos(theta) * 0.475, Math.sin(theta) * Math.sin(phi) * 0.415 - 0.025);
      // Fade the cheek edge into the skin, with fuller coverage at the jaw.
      const coverage = THREE.MathUtils.smoothstep(row / 18, 0, 0.19);
      beardShade.copy(skinTone).lerp(beardTone, coverage);
      beardColors[index * 3] = beardShade.r; beardColors[index * 3 + 1] = beardShade.g; beardColors[index * 3 + 2] = beardShade.b;
    }
    beardGeometry.setAttribute('color', new THREE.BufferAttribute(beardColors, 3));
    beardGeometry.computeVertexNormals();
    head.add(new THREE.Mesh(beardGeometry, beardSurfaceMaterial));
    for (const side of [-1, 1]) {
      const moustache = ball(head, beardMaterial, [side * 0.058, -0.153, -0.419], [0.075, 0.019, 0.012]);
      moustache.rotation.z = side * 0.12;
    }
    // Subtle closed lips, following the reference expression.
    const lipMaterial = mat('#a77063');
    const lipCreaseMaterial = mat('#704a40');
    ball(head, lipMaterial, [0, -0.201, -0.402], [0.102, 0.018, 0.012]);
    const mouthCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.097, -0.195, -0.403),
      new THREE.Vector3(-0.045, -0.197, -0.409),
      new THREE.Vector3(0, -0.195, -0.411),
      new THREE.Vector3(0.045, -0.197, -0.409),
      new THREE.Vector3(0.097, -0.195, -0.403),
    ]);
    const mouthGeometry = new THREE.TubeGeometry(mouthCurve, 24, 0.004, 6, false); resources.push(mouthGeometry);
    head.add(new THREE.Mesh(mouthGeometry, lipCreaseMaterial));
    // Thin connections from the moustache corners to the lower beard.
    for (const side of [-1, 1]) {
      const points = [[0.12, -0.157], [0.126, -0.185], [0.12, -0.22], [0.105, -0.267]].map(([x, y]) => {
        const xx = side * x;
        const z = -0.025 - 0.416 * Math.sqrt(Math.max(0, 1 - (xx / 0.455) ** 2 - (y / 0.477) ** 2)) - 0.005;
        return new THREE.Vector3(xx, y, z);
      });
      // Meet the protruding moustache before following the cheek surface.
      points[0].z = -0.417;
      const connectionGeometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 20, 0.011, 8, false); resources.push(connectionGeometry);
      head.add(new THREE.Mesh(connectionGeometry, beardMaterial));
    }
    ball(head, beardMaterial, [0, -0.244, -0.387], [0.045, 0.022, 0.009]);
    head.children.slice(faceDetailStart).forEach(detail => { detail.userData.holoDetail = !detail.userData.keepHologramSilhouette; });
    const navy = mat('#162b4d');
    const legs = [-1, 1].map((side) => {
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.3, 0), new THREE.Vector3(0, 0.7, -0.1), new THREE.Vector3(0, 0.2, 0)]);
      const geometry = new THREE.TubeGeometry(curve, 24, 0.11, 12, false); resources.push(geometry);
      const trouser = new THREE.Mesh(geometry, navy); trouser.castShadow = true; trouser.receiveShadow = true; trouser.frustumCulled = false; character.add(trouser);
      return { side, curve, geometry, sock: ball(character, white, [0, 0, 0], [0.105, 0.13, 0.105]), shoe: ball(character, navy, [0, 0, 0], [0.14, 0.11, 0.22]), sole: ball(character, white, [0, 0, 0], [0.143, 0.038, 0.225]) };
    });
    const arms = [-1, 1].map((side) => {
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(side * 0.26, 1.6, 0), new THREE.Vector3(side * 0.42, 1.4, -0.3), new THREE.Vector3(side * 0.26, 1.4, -0.8)]);
      const geometry = new THREE.TubeGeometry(curve, 24, 0.09, 12, false); resources.push(geometry);
      // One continuous surface, with shirt and skin materials meeting cleanly.
      geometry.clearGroups(); geometry.addGroup(0, 12 * 12 * 6, 0); geometry.addGroup(12 * 12 * 6, 12 * 12 * 6, 1);
      const arm = new THREE.Mesh(geometry, [white, skin]); arm.castShadow = true; arm.receiveShadow = true; arm.frustumCulled = false; character.add(arm);
      return {side,curve,geometry,hand:ball(character,skin,[0,0,0],[.095,.08,.12])};
    });
    character.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      object.material = Array.isArray(object.material) ? object.material.map(material => holographicMaterial(material, !!object.userData.holoDetail)) : holographicMaterial(object.material, !!object.userData.holoDetail);
    });
    // Render the nearest outer surface first, so translucent parts do not
    // reveal overlapping hair, neck or other pieces inside the silhouette.
    const shellDepthScene = new THREE.Scene();
    const shellDepthParts: Array<{ source: THREE.Mesh; depth: THREE.Mesh }> = [];
    const shellDepthMaterials = new Map<THREE.Material, THREE.Material>();
    character.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const depthMaterial = (source: THREE.Material) => {
        const cached = shellDepthMaterials.get(source); if (cached) return cached;
        const depth = source.clone(); depth.onBeforeCompile = source.onBeforeCompile;
        depth.customProgramCacheKey = () => `${source.customProgramCacheKey()}-shell-depth`;
        depth.colorWrite = false; depth.depthWrite = true; depth.transparent = false;
        resources.push(depth); shellDepthMaterials.set(source, depth); return depth;
      };
      const materials = Array.isArray(object.material) ? object.material.map(depthMaterial) : depthMaterial(object.material);
      const depthMesh = new THREE.Mesh(object.geometry, materials); depthMesh.matrixAutoUpdate = false; depthMesh.frustumCulled = false;
      shellDepthScene.add(depthMesh); shellDepthParts.push({ source: object, depth: depthMesh });
    });
    const platform = new THREE.Group(); destinationScene.add(platform);
    platform.position.set(1.22, 0, 1.67); platform.visible = false;
    const platformCore = mat('#123e6b', 0.40);
    platformCore.transparent = false; platformCore.opacity = 1;
    platformCore.metalness = 0.30;
    const pedestalGeometry = new THREE.LatheGeometry([
      new THREE.Vector2(0, -0.405), new THREE.Vector2(0.88, -0.405),
      new THREE.Vector2(0.95, -0.37), new THREE.Vector2(0.97, -0.32),
      new THREE.Vector2(0.97, 0.025), new THREE.Vector2(0.94, 0.08),
      new THREE.Vector2(0.88, 0.105), new THREE.Vector2(0, 0.105),
    ], 80); resources.push(pedestalGeometry);
    platform.add(new THREE.Mesh(pedestalGeometry, platformCore));
    const platformTop = mat('#1b5682', 0.38);
    platformTop.transparent = false; platformTop.opacity = 1; platformTop.metalness = 0.22;
    platformTop.emissive.set('#034369'); platformTop.emissiveIntensity = 0.08;
    cylinder(platform, platformTop, [0, 0.111, 0], 0.86, 0.012);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: '#16dfff', transparent: true, opacity: 0.85, depthWrite: false }); resources.push(ringMaterial);
    for (const y of [-0.33, -0.23, -0.13, 0.025, 0.12]) {
      const geometry = new THREE.TorusGeometry(y === 0.12 ? 0.84 : 0.972, y === 0.12 ? 0.018 : 0.009, 8, 80); resources.push(geometry);
      const ring = new THREE.Mesh(geometry, ringMaterial); ring.rotation.x = Math.PI / 2; ring.position.y = y; platform.add(ring);
    }
    const platformShadowGeometry = new THREE.PlaneGeometry(4.2, 4.2); resources.push(platformShadowGeometry);
    const platformShadowMaterial = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `varying vec2 vUv; void main(){
        float radius=length((vUv-0.5)*4.2);
        float shadow=exp(-pow(radius/1.20,4.0))*0.65;
        gl_FragColor=vec4(0.0,0.015,0.04,shadow);
      }`
    }); resources.push(platformShadowMaterial);
    const platformShadow = new THREE.Mesh(platformShadowGeometry, platformShadowMaterial);
    platformShadow.rotation.x = -Math.PI / 2; platformShadow.position.set(0.13, -0.42, 0.18); platformShadow.renderOrder = -2; platform.add(platformShadow);
    // A procedural grid scrolls continuously without a visible reset at its edges.
    const floorUniforms = { uTime: { value: 0 } };
    const gridGeometry = new THREE.PlaneGeometry(14, 14); resources.push(gridGeometry);
    const gridMaterial = new THREE.ShaderMaterial({
      uniforms: floorUniforms, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `uniform float uTime; varying vec2 vUv;
        void main(){
          if (length((vUv - 0.5) * 14.0) < 1.03) discard;
          vec2 cells = (vUv - 0.5) * (14.0 / 0.6);
          // Positive world Z projects toward the bottom of the screen.
          cells.y += uTime * 0.55;
          vec2 distanceToLine = abs(fract(cells + 0.5) - 0.5);
          vec2 widths = max(fwidth(cells), vec2(0.001));
          vec2 lines = 1.0 - smoothstep(widths * 0.5, widths * 1.6, distanceToLine);
          float dotGlow = 1.0 - smoothstep(0.02, 0.07, length(distanceToLine));
          float fade = 1.0 - smoothstep(0.2, 0.5, length(vUv - 0.5));
          gl_FragColor = vec4(0.08, 0.58, 0.95, (max(lines.x, lines.y) * 0.24 + dotGlow * 0.65) * fade);
        }`
    }); resources.push(gridMaterial);
    const movingGrid = new THREE.Mesh(gridGeometry, gridMaterial); movingGrid.renderOrder = -3; movingGrid.rotation.x = -Math.PI / 2; movingGrid.position.y = -0.425; platform.add(movingGrid);
    const beamGeometry = new THREE.CylinderGeometry(1.06, 0.79, 1, 64, 1, true); beamGeometry.translate(0, 0.5, 0); resources.push(beamGeometry);
    const beamUniforms = { uTime: { value: 0 }, uStrength: { value: 0 } };
    const beamMaterial = new THREE.ShaderMaterial({
      uniforms: beamUniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `uniform float uTime; uniform float uStrength; varying vec2 vUv;
        void main(){
          float fade = pow(1.0 - vUv.y, 1.4);
          float rays = pow(0.5 + 0.5 * sin(vUv.x * 100.0 + sin(uTime * 0.6)), 10.0);
          float rising = pow(0.5 + 0.5 * sin(vUv.y * 26.0 - uTime * 4.0), 12.0);
          gl_FragColor=vec4(0.0,0.64,1.0,fade*(0.06+rays*0.12+rising*0.07)*uStrength);
        }`
    }); resources.push(beamMaterial);
    const beam = new THREE.Mesh(beamGeometry, beamMaterial); beam.renderOrder = -1; beam.position.y = 0.125; platform.add(beam);
    const glowGeometry = new THREE.PlaneGeometry(8, 8); resources.push(glowGeometry);
    const glowMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'varying vec2 vUv; void main(){ if(length((vUv-0.5)*8.0)<1.03) discard; float glow=exp(-dot(vUv-0.5,vUv-0.5)*22.0); gl_FragColor=vec4(0.08,0.62,1.0,glow*0.48); }' }); resources.push(glowMaterial);
    const glow = new THREE.Mesh(glowGeometry, glowMaterial); glow.renderOrder = -2; glow.rotation.x = -Math.PI / 2; glow.position.y = -0.415; platform.add(glow);
    const percentageCanvas = document.createElement('canvas'); percentageCanvas.width = 384; percentageCanvas.height = 144;
    const percentageContext = percentageCanvas.getContext('2d')!;
    const percentageTexture = new THREE.CanvasTexture(percentageCanvas); percentageTexture.colorSpace = THREE.SRGBColorSpace; resources.push(percentageTexture);
    const displayHousing = new THREE.Group();
    displayHousing.position.set(0.59, -0.18, 0.81); displayHousing.rotation.y = Math.atan2(0.59, 0.81); platform.add(displayHousing);
    const bezelMaterial = mat('#17476c', 0.30); bezelMaterial.metalness = 0.65;
    box(displayHousing, bezelMaterial, [0, 0, 0], [0.79, 0.30, 0.105]);
    box(displayHousing, mat('#061b30', 0.38), [0, 0, 0.056], [0.70, 0.245, 0.025]);
    const percentageMaterial = new THREE.MeshBasicMaterial({ map: percentageTexture, toneMapped: false }); resources.push(percentageMaterial);
    const percentageGeometry = new THREE.PlaneGeometry(0.65, 0.21); resources.push(percentageGeometry);
    const percentage = new THREE.Mesh(percentageGeometry, percentageMaterial); percentage.position.z = 0.071; displayHousing.add(percentage);
    const screwMaterial = mat('#56819b', 0.3); screwMaterial.metalness = 0.8;
    for (const x of [-0.366, 0.366]) for (const y of [-0.10, 0.10]) ball(displayHousing, screwMaterial, [x, y, 0.057], [0.012, 0.012, 0.006]);
    const displayTrim = new THREE.MeshBasicMaterial({ color: '#34bde6' }); resources.push(displayTrim);
    box(displayHousing, displayTrim, [0, -0.132, 0.057], [0.42, 0.006, 0.006]);
    // A camera-facing halo keeps the light close to the character silhouette.
    const auraGeometry = new THREE.PlaneGeometry(3.2, 5.5); resources.push(auraGeometry);
    const auraMaterial = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `varying vec2 vUv; void main(){
        vec2 offset=(vUv-0.5)*2.0;
        float light=exp(-dot(offset,offset)*2.8);
        float edge=1.0-smoothstep(0.55,1.0,length(offset));
        gl_FragColor=vec4(0.12,0.70,1.0,light*edge*0.82);
      }`
    }); resources.push(auraMaterial);
    const characterAura = new THREE.Mesh(auraGeometry, auraMaterial);
    characterAura.renderOrder = -4; characterAura.visible = false; destinationScene.add(characterAura);
    // Four luminous brackets mark the horizontal scanning plane.
    const scanFrame = new THREE.Group(); destinationScene.add(scanFrame); scanFrame.visible = false;
    const scanFrameMaterial = new THREE.MeshBasicMaterial({ color: '#39dcff', transparent: true, opacity: 0.72, depthWrite: false }); resources.push(scanFrameMaterial);
    const scanBarGeometry = new THREE.BoxGeometry(1, 1, 1); resources.push(scanBarGeometry);
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      const horizontal = new THREE.Mesh(scanBarGeometry, scanFrameMaterial);
      horizontal.scale.set(0.23, 0.009, 0.025); horizontal.position.set(x * 0.79, 0, z * 0.63); scanFrame.add(horizontal);
      const vertical = new THREE.Mesh(scanBarGeometry, scanFrameMaterial);
      vertical.scale.set(0.025, 0.009, 0.18); vertical.position.set(x * 0.895, 0, z * 0.55); scanFrame.add(vertical);
    }
    const laboratoryScene=new THREE.Scene();
    laboratoryScene.add(new THREE.HemisphereLight('#e5f4ff','#214d77',2.8));
    const labSun=sun.clone();labSun.castShadow=false;laboratoryScene.add(labSun,fill.clone());
    const {group:laboratory,chair:laboratoryChair,update:updateLaboratory}=createLaboratory(resources);laboratory.scale.setScalar(.72);laboratory.rotation.y=.78;
    laboratoryScene.add(laboratory);
    const presenter=createLaboratoryPresenter(resources);laboratory.add(presenter.group);
    // Handheld remote only exists in the seated laboratory interaction.
    const laboratoryRemote=new THREE.Group();character.add(laboratoryRemote);laboratoryRemote.visible=false;
    // A grip built around the remote itself, so palm, fingers and thumb
    // stay in contact while the wrist and remote move together.
    const remoteGrip=new THREE.Group();laboratoryRemote.add(remoteGrip);
    const gripSkin=holographicMaterial(skin);
    const gripGeometry=createCartoonGripGeometry();resources.push(gripGeometry);
    mesh(remoteGrip,gripGeometry,gripSkin,[0,0,0],[1,1,1]);
    const remoteBody=mat('#102d47',.35),remoteTrim=mat('#367f9f',.3),remoteDisplay=mat('#4ae9ff',.3);
    remoteDisplay.emissive.set('#00b8e0');remoteDisplay.emissiveIntensity=.75;
    box(laboratoryRemote,remoteTrim,[0,.07,-.035],[.15,.40,.070]);
    box(laboratoryRemote,remoteBody,[0,.07,-.025],[.132,.380,.070]);
    box(laboratoryRemote,remoteDisplay,[.035,.232,.018],[.028,.012,.009]);
    const powerMaterial=mat('#f46d59');ball(laboratoryRemote,powerMaterial,[-.035,.232,.018],[.016,.011,.008]);
    const remoteButtons:THREE.Mesh[]=[];
    for(let row=0;row<7;row++)for(const side of [-1,0,1]){
      const buttonMaterial=mat('#d0f3ff',.35);buttonMaterial.emissive.set('#008cbb');
      remoteButtons.push(ball(laboratoryRemote,buttonMaterial,[side*.036,.180-row*.040,.019],[.013,.012,.008]));
    }
    const hologramBounds = new THREE.Box3();
    let lastPercentage = -1, displayedHologram = 0;
    const smooth = (value: number) => { const t = THREE.MathUtils.clamp(value, 0, 1); return t * t * (3 - 2 * t); };
    const introStartedAt = performance.now();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lastScreenUpdate = -1;
    let displayedExit = 0, displayedLab = 0;
    let displayed = 0, previous = performance.now(), frame = 0, disposed = false;
    const animate = (now: number) => {
      if (disposed) return;
      const delta = Math.min(0.1, (now - previous) / 1000); previous = now;
      displayed += (target.current - displayed) * (1 - Math.exp(-delta * 10));
      displayedExit += (exitTarget.current - displayedExit) * (1 - Math.exp(-delta * 8));
      displayedLab += (labTarget.current-displayedLab)*(1-Math.exp(-delta*8));
      if(Math.abs(displayedLab-labTarget.current)<.001)displayedLab=labTarget.current;
      const laboratoryArrival=smooth(displayedLab/.60);
      laboratory.visible=displayedLab>.001;
      if(laboratory.visible){updateLaboratory(reducedMotion?0:now/1000);presenter.update(reducedMotion?0:now/1000,displayedLab,reducedMotion);}
      laboratory.position.set(-2.7,-.50-(1-laboratoryArrival)*7,1.0);
      destinationScene.position.set(displayedLab*6,displayedLab*9,0);
      const effectiveHologram=hologramTarget.current;
      displayedHologram += (effectiveHologram - displayedHologram) * (1 - Math.exp(-delta * 10));
      if (Math.abs(displayedHologram - effectiveHologram) < 0.001) displayedHologram = effectiveHologram;
      holoUniforms.uHoloProgress.value = displayedHologram; holoUniforms.uHoloTime.value = now / 1000;
      const animationTime = reducedMotion ? 0 : now / 1000;
      weatherIndicator.color.set(isRainy()?'#719bb0':'#e7b956');
      updateDeskCup(animationTime);
      if(room.visible)updateWindowView(animationTime);
      const ringPulse = 0.5 + 0.5 * Math.sin(animationTime * 1.8);
      ringMaterial.opacity = 0.12 + ringPulse * 0.88;
      ringMaterial.color.setRGB(0.025 + ringPulse * 0.04, 0.28 + ringPulse * 0.58, 0.48 + ringPulse * 0.52);
      floorUniforms.uTime.value = animationTime;
      holoUniforms.uHoloTime.value = animationTime;
      beamUniforms.uTime.value = animationTime;
      beamUniforms.uStrength.value = 0.35 + displayedHologram * 0.65;
      beam.scale.y = Math.max(0.18, displayedHologram * holoUniforms.uHoloTop.value);
      const standingLift = displayedExit * 0.85;
      // The platform rises from below and settles before the character lands.
      const platformArrival = smooth((displayedExit - 0.04) / 0.82);
      // Keep the source platform below his feet while the background exits.
      // Its parent moves upward; cancel that movement before lowering the base.
      const platformDescent=smooth(displayedLab/.18)*.35;
      const platformDeparture=smooth((displayedLab-.18)/.65);
      platform.position.x=1.22-destinationScene.position.x+platformDeparture*6;
      platform.position.y=THREE.MathUtils.lerp(-3.8,.85,platformArrival)
        -destinationScene.position.y-platformDescent-platformDeparture*3;
      holoUniforms.uHoloBase.value = 0.13 + standingLift;
      platform.visible = displayedExit > 0.005;
      characterAura.visible = platform.visible;
      characterAura.position.set(1.22, platform.position.y + 2.15, 1.67);
      characterAura.quaternion.copy(camera.quaternion);
      platform.scale.setScalar(1);
      const percent = displayedHologram === 1 ? 100 : Math.floor(displayedHologram * 100);
      if (lastPercentage !== percent) {
        percentageContext.clearRect(0, 0, 384, 144);
        const displayGradient = percentageContext.createLinearGradient(0, 0, 0, 144);
        displayGradient.addColorStop(0, '#103347'); displayGradient.addColorStop(0.45, '#051b30'); displayGradient.addColorStop(1, '#08263c');
        percentageContext.fillStyle = displayGradient; percentageContext.fillRect(0, 0, 384, 144);
        percentageContext.font = 'bold 92px monospace'; percentageContext.textAlign = 'center'; percentageContext.textBaseline = 'middle';
        const numberText = `${String(percent).padStart(3, '0')}%`;
        percentageContext.fillStyle = '#034d69'; percentageContext.fillText(numberText, 193, 79);
        percentageContext.shadowColor = '#27cfff'; percentageContext.shadowBlur = 10;
        percentageContext.fillStyle = '#a0efff'; percentageContext.fillText(numberText, 192, 74);
        percentageContext.shadowBlur = 0;
        percentageContext.fillStyle = 'rgba(175,230,255,0.07)'; percentageContext.fillRect(0, 0, 384, 30);
        percentageTexture.needsUpdate = true; lastPercentage = percent;
      }
      // Move scenery up and to the screen's right, leaving the standing person.
      room.position.set(displayedExit * 6.5, displayedExit * 8.5, -displayedExit * 4.5);
      room.scale.setScalar(1 - displayedExit * 0.22);
      room.visible = displayedExit < 0.998;
      floor.visible = displayedExit < 0.998;
      easedPointer.lerp(scenePointer, 1 - Math.exp(-delta * 4));
      camera.position.copy(cameraBase);
      if (!reducedMotion && !draggingGlobe) {
        camera.position.x += easedPointer.x * 0.13;
        camera.position.y -= easedPointer.y * 0.08;
      }
      camera.up.set(0,1,0);
      const cameraFocus=new THREE.Vector3(0,1.65,0);
      const orbitBlend=smooth((displayedLab-.80)/.20);
      // Bring the seated laboratory closer and frame it farther to the left.
      const laboratoryZoom=1+orbitBlend*.32;
      if(Math.abs(camera.zoom-laboratoryZoom)>.00001){
        camera.zoom=laboratoryZoom;camera.updateProjectionMatrix();
      }
      const laboratoryFraming=new THREE.Vector3(.48,-.48,-.37).multiplyScalar(orbitBlend);
      camera.position.add(laboratoryFraming);
      cameraFocus.add(laboratoryFraming);
      viewYaw+=(orbitYaw-viewYaw)*(1-Math.exp(-delta*12));
      if(orbitBlend>.001){
        const pivot=laboratory.position.clone().add(new THREE.Vector3(0,1.4,0));
        const yawRotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),viewYaw*orbitBlend);
        const orbitRotation=yawRotation;
        camera.position.sub(pivot).applyQuaternion(orbitRotation).add(pivot);
        cameraFocus.sub(pivot).applyQuaternion(orbitRotation).add(pivot);
        camera.up.applyQuaternion(orbitRotation);
        renderer.domElement.style.cursor=laboratoryPointer>=0?'grabbing':'grab';
      }
      camera.lookAt(cameraFocus);
      const introTime = (now - introStartedAt) / 1000;
      // Work resumes whenever the character returns to the desk, including
      // after a full trip to the laboratory. Blend out before standing up.
      const atDesk=(1-smooth(displayed/.035))*(1-smooth(displayedExit/.025))*(1-smooth(displayedLab/.025));
      const working = reducedMotion ? 0 : smooth((introTime - 3.85) / 0.55)*atDesk;
      const workTime = Math.max(0, introTime - 3.85);
      const messagePhase = workTime % 7;
      bubbleMaterial.opacity = working * smooth((messagePhase - 1.1) / 0.4) * (1 - smooth((messagePhase - 4.2) / 0.5));
      messageBubble.visible = bubbleMaterial.opacity > 0.001;
      messageBubble.position.y = 2.85 + Math.sin(workTime * 1.6) * 0.025;
      const phase = workTime % 6;
      const mouseAmount = smooth((phase - 3.5) / 0.45) * (1 - smooth((phase - 5.5) / 0.45));
      computerMouse.position.x = 0.71 + Math.sin(workTime * 2.0) * 0.045 * mouseAmount * working;
      computerMouse.position.z = 0.07 + Math.cos(workTime * 1.6) * 0.035 * mouseAmount * working;
      if (working > 0.01 && introTime - lastScreenUpdate > 0.12) {
        animatedScreens.forEach(update => update(workTime, mouseAmount)); lastScreenUpdate = introTime;
      }
      const introBlend = reducedMotion ? 0 : (1 - smooth((introTime - 2.7) / 1.15)) * (1 - smooth(displayed / 0.16));
      const greeting = smooth((introTime - 0.25) / 0.45) * (1 - smooth((introTime - 2.35) / 0.65)) * introBlend;
      // Turn together while seated, then rise through the chair's open front.
      const chairTurn = smooth((displayed - 0.06) / 0.25);
      const sideStep = smooth((displayed - 0.34) / 0.40);
      const rise = smooth((displayed - 0.35) / 0.35);
      const forwardStep = smooth((displayed - 0.70) / 0.25);
      const turn = smooth((displayed - 0.72) / 0.26);
      const lean = Math.sin(rise * Math.PI) * 0.12;
      const labSit=smooth((displayedLab-.80)/.20);
      chairReady=labSit>.995&&labTarget.current>.99;
      if(!chairReady){chairYawTarget=0;draggingChair=false;}
      chairYaw+=(chairYawTarget-chairYaw)*(1-Math.exp(-delta*14));
      laboratoryChair.rotation.y=chairYaw*labSit;
      const hipY = THREE.MathUtils.lerp(THREE.MathUtils.lerp(.98,1.39,rise),.98,labSit), hipZ = 0;
      // Lift clear of the chair first, then descend into the platform center.
      const landingArc = Math.sin(Math.PI * displayedExit) * 1.15;
      const landingAlignment = smooth((displayedExit - 0.50) / 0.48);
      const arrivingX = THREE.MathUtils.lerp(sideStep * 1.22, 1.22, landingAlignment);
      const arrivingZ = THREE.MathUtils.lerp(0.85 + forwardStep * 0.82, platform.position.z, landingAlignment);
      character.position.set(arrivingX, displayedExit * 0.05 + standingLift + landingArc-platformDescent, arrivingZ);
      const labLanding=smooth((displayedLab-.12)/.64);
      const characterScale=THREE.MathUtils.lerp(1+displayedExit*.20,.76,labLanding);
      const laboratoryFloor=laboratory.position.y+.245*laboratory.scale.y;
      const feetOffset=.067*characterScale;
      const loungeLocal=new THREE.Vector3(0,0,THREE.MathUtils.lerp(-.12,.85,labSit));
      loungeLocal.multiplyScalar(laboratory.scale.y).applyAxisAngle(new THREE.Vector3(0,1,0),laboratory.rotation.y).add(laboratory.position);
      loungeLocal.y=laboratoryFloor-feetOffset;
      character.position.lerp(loungeLocal,labLanding);
      character.position.y+=Math.sin(labLanding*Math.PI)*.65;
      if(labLanding>.7)character.position.y=Math.max(character.position.y,laboratoryFloor-feetOffset);
      character.scale.setScalar(characterScale);
      const chairAngle = -Math.PI / 2 * chairTurn - 1.18 * introBlend;
      chair.rotation.y = chairAngle;
      const standingAngle=chairAngle+(-2.52+Math.PI/2)*turn;
      character.rotation.y=THREE.MathUtils.lerp(standingAngle,laboratory.rotation.y,smooth((displayedLab-.55)/.25))+chairYaw*labSit;
      torso.position.set(0, hipY, hipZ); torso.rotation.x = -lean - working * (0.028 + Math.sin(workTime * 1.3) * 0.006);
      head.rotation.y = -1.28 * introBlend + working * Math.sin(workTime * 0.7) * 0.045;
      chair.position.z = 0.85;
      for (const leg of legs) {
        const footZ = THREE.MathUtils.lerp(THREE.MathUtils.lerp(-.49,0,smooth(rise/.65)),-.49,labSit);
        const hip = new THREE.Vector3(leg.side * 0.17, hipY, hipZ);
        const ankle = new THREE.Vector3(leg.side * 0.21, 0.19, footZ);
        const dy = ankle.y - hip.y, dz = ankle.z - hip.z, distance = Math.hypot(dy, dz);
        const thigh = 0.63, shin = 0.66, d = Math.min(distance, thigh + shin - 0.005);
        const a = (thigh * thigh - shin * shin + d * d) / (2 * d), h = Math.sqrt(Math.max(0, thigh * thigh - a * a));
        const knee = new THREE.Vector3(leg.side * 0.20, hip.y + a * dy / distance - dz / distance * h, hip.z + a * dz / distance + dy / distance * h);
        // One smooth trouser surface from hip to ankle, with no knee seam.
        leg.curve.points[0].copy(hip); leg.curve.points[1].copy(knee); leg.curve.points[2].copy(ankle);
        const frames = leg.curve.computeFrenetFrames(24, false);
        const positions = leg.geometry.attributes.position;
        const normals = leg.geometry.attributes.normal;
        for (let ring = 0; ring <= 24; ring++) {
          const t = ring / 24;
          // Trim only the hidden upper end; keep the knee and ankle pose.
          const legT = 0.10 + t * 0.90;
          const center = leg.curve.getPoint(legT);
          const frameIndex = Math.min(24, Math.round(legT * 24));
          const radius = THREE.MathUtils.lerp(0.12, 0.086, legT);
          for (let radial = 0; radial <= 12; radial++) {
            const angle = radial / 12 * Math.PI * 2;
            const nx = -Math.cos(angle), ny = Math.sin(angle);
            const normal = new THREE.Vector3().copy(frames.normals[frameIndex]).multiplyScalar(nx).addScaledVector(frames.binormals[frameIndex], ny);
            const index = ring * 13 + radial;
            positions.setXYZ(index, center.x + normal.x * radius, center.y + normal.y * radius, center.z + normal.z * radius);
            normals.setXYZ(index, normal.x, normal.y, normal.z);
          }
        }
        positions.needsUpdate = true; normals.needsUpdate = true;
        leg.sock.position.set(ankle.x, 0.25, footZ); leg.shoe.position.set(ankle.x, 0.17, footZ - 0.07); leg.sole.position.set(ankle.x, 0.105, footZ - 0.07);
      }
      const armRelease = Math.max(rise, smooth((displayed - 0.015) / 0.10), introBlend);
      for (const arm of arms) {
        const shoulder = new THREE.Vector3(arm.side * 0.215, 0.49, 0).applyQuaternion(torso.quaternion).add(torso.position);
        const hand = new THREE.Vector3(THREE.MathUtils.lerp(arm.side * 0.26, arm.side * 0.35, armRelease), THREE.MathUtils.lerp(1.48, hipY - 0.24, armRelease), THREE.MathUtils.lerp(-0.80, hipZ - 0.03, armRelease));
        const elbow = new THREE.Vector3(arm.side * (0.39 + 0.04 * (1-rise)), THREE.MathUtils.lerp(1.39, hipY + 0.12, armRelease), THREE.MathUtils.lerp(-0.37, hipZ - 0.02, armRelease));
        hand.lerp(new THREE.Vector3(arm.side*.27,hipY-.05,-.43),labSit);
        elbow.lerp(new THREE.Vector3(arm.side*.35,hipY+.18,-.20),labSit);
        if (working > 0) {
          const typing = 1 - (arm.side === 1 ? mouseAmount : 0);
          const workingHand = new THREE.Vector3(arm.side * 0.22 + Math.sin(workTime * 4 + arm.side) * 0.025, 1.505 + Math.sin(workTime * 13 + arm.side * 1.5) * 0.009 * typing, -0.82 + Math.sin(workTime * 3 + arm.side) * 0.02);
          if (arm.side === 1) workingHand.lerp(new THREE.Vector3(computerMouse.position.x, 1.505, computerMouse.position.z - 0.85), mouseAmount);
          hand.lerp(workingHand, working);
          elbow.lerp(new THREE.Vector3(arm.side * (0.42 + (arm.side === 1 ? mouseAmount * 0.18 : 0)), 1.43, -0.36), working);
          arm.hand.rotation.x = working * (-0.12 + Math.sin(workTime * 13 + arm.side) * 0.035 * typing);
        } else arm.hand.rotation.x = 0;
        if (arm.side === -1) {
          const wave = Math.sin(introTime * 9) * 0.08;
          // Raise the original arm clear of the silhouette, toward the camera.
          elbow.lerp(new THREE.Vector3(-0.67, hipY + 0.65, -0.42), greeting);
          hand.lerp(new THREE.Vector3(-0.86 + wave, hipY + 1.07, -0.60), greeting);
          arm.hand.rotation.z = greeting * (0.15 + Math.sin(introTime * 9) * 0.3);
          arm.hand.scale.set(0.085, 0.12, 0.08 + (1 - greeting) * 0.04);
        }
        const remoteBlend=smooth((labSit-.96)/.04);
        if(arm.side===1){
          const pointing=new THREE.Vector3(.61+Math.sin(animationTime*.72)*.045,hipY+.62+Math.sin(animationTime*1.1)*.035,-.55+Math.sin(animationTime*.9)*.045);
          hand.lerp(pointing,remoteBlend);
          elbow.lerp(new THREE.Vector3(.45,hipY+.25,-.20),remoteBlend);
          arm.hand.visible=remoteBlend<=.01;
          arm.hand.rotation.x=-.20*remoteBlend;
          arm.hand.rotation.z=-.12*remoteBlend;
          arm.hand.scale.set(.095,.08,.12);
          laboratoryRemote.visible=remoteBlend>.01;
          laboratoryRemote.position.copy(hand);
          laboratoryRemote.rotation.set(-.20+Math.sin(animationTime*.9)*.06,.08*Math.sin(animationTime*.72),-.10);
          laboratoryRemote.scale.setScalar(Math.max(.001,remoteBlend)*1.22);
          // Continue the forearm surface inside the palm itself. There is
          // no separate wrist piece and no exposed open ring between them.
          const gripWrist=new THREE.Vector3(.070,-.050,.008)
            .multiplyScalar(laboratoryRemote.scale.x)
            .applyQuaternion(laboratoryRemote.quaternion)
            .add(laboratoryRemote.position);
          hand.lerp(gripWrist,remoteBlend);
          const pressPhase=(animationTime%1.6)/1.6;
          const selected=13;
          const pressing=smooth((pressPhase-.20)/.18)*(1-smooth((pressPhase-.62)/.20));
          for(let index=0;index<remoteButtons.length;index++){
            const button=remoteButtons[index];button.position.z=.019-(index===selected?pressing*.009:0);
            (button.material as THREE.MeshStandardMaterial).emissiveIntensity=index===selected?pressing*.9:0;
          }
          remoteDisplay.emissiveIntensity=.6+.3*(.5+.5*Math.sin(animationTime*3));
        }
        // Slow, small arm lifts only after arriving on the platform.
        const idleArmBlend = reducedMotion ? 0 : smooth((displayedExit - 0.94) / 0.06) * smooth((displayed - 0.94) / 0.06);
        const armLift = (0.5 + 0.5 * Math.sin(animationTime * 1.25 + arm.side * 0.35)) * idleArmBlend * (1-labSit);
        hand.y += armLift * 0.065;
        hand.x += arm.side * armLift * 0.04;
        elbow.y += armLift * 0.035;
        elbow.x += arm.side * armLift * 0.025;
        arm.curve.points[0].copy(shoulder); arm.curve.points[1].copy(elbow); arm.curve.points[2].copy(hand);
        const frames = arm.curve.computeFrenetFrames(24, false);
        const positions = arm.geometry.attributes.position, normals = arm.geometry.attributes.normal;
        for (let ring = 0; ring <= 24; ring++) {
          const t = ring / 24, center = arm.curve.getPoint(t);
          const gripTaper=arm.side===1?remoteBlend*smooth((t-.72)/.28):0;
          const radius = THREE.MathUtils.lerp(0.125, 0.074, t)-.035*gripTaper;
          for (let radial = 0; radial <= 12; radial++) {
            const angle = radial / 12 * Math.PI * 2;
            const normal = new THREE.Vector3().copy(frames.normals[ring]).multiplyScalar(-Math.cos(angle)).addScaledVector(frames.binormals[ring], Math.sin(angle));
            const index = ring * 13 + radial;
            const offset=normal.clone().multiplyScalar(radius);
            if(arm.side===1&&remoteBlend>.01){
              const depthAxis=new THREE.Vector3(0,0,1).applyQuaternion(laboratoryRemote.quaternion);
              offset.addScaledVector(depthAxis,-offset.dot(depthAxis)*.65*remoteBlend*smooth((t-.78)/.22));
            }
            positions.setXYZ(index,center.x+offset.x,center.y+offset.y,center.z+offset.z);
            normals.setXYZ(index, normal.x, normal.y, normal.z);
          }
        }
        positions.needsUpdate = true; normals.needsUpdate = true;
        arm.hand.position.copy(hand);
      }
      if (displayedExit > 0.99) {
        character.updateMatrixWorld(true);
        hologramBounds.setFromObject(head);
        holoUniforms.uHoloTop.value = Math.max(1, hologramBounds.max.y - holoUniforms.uHoloBase.value);
      }
      scanFrame.visible = platform.visible && displayedHologram > 0.001 && displayedHologram < 0.999;
      scanFrame.position.set(platform.position.x, holoUniforms.uHoloBase.value + displayedHologram * holoUniforms.uHoloTop.value, platform.position.z);
      scanFrameMaterial.opacity = 0.65 + (reducedMotion ? 0 : Math.sin(animationTime * 2) * 0.08);
      // Confine office objects to the departing panel, then draw the person
      // independently in front of all furniture and the rug.
      renderer.setScissorTest(false); renderer.clear();
      let renderOffice = true;
      if (officePanel) {
        const view = renderer.domElement.getBoundingClientRect();
        const panel = officePanel.getBoundingClientRect();
        const left = Math.max(0, panel.left - view.left);
        const right = Math.min(view.width, panel.right - view.left);
        const top = Math.max(0, panel.top - view.top);
        const bottom = Math.min(view.height, panel.bottom - view.top);
        renderOffice = right > left && bottom > top;
        if (renderOffice) {
          renderer.setScissor(left, view.height - bottom, right - left, bottom - top);
          renderer.setScissorTest(true);
        }
      }
      if (renderOffice) renderer.render(scene, camera);
      renderer.setScissorTest(false);
      // Seated: preserve depth so the chair back and desk overlap naturally.
      // Leaving the office: place the person above the departing furniture.
      if (displayedExit > 0.005) renderer.clearDepth();
      // Draw the destination only in the area uncovered by the office panel.
      if (officePanel && room.visible) {
        const view = renderer.domElement.getBoundingClientRect();
        const panel = officePanel.getBoundingClientRect();
        const left = THREE.MathUtils.clamp(panel.left - view.left, 0, view.width);
        const bottom = THREE.MathUtils.clamp(panel.bottom - view.top, 0, view.height);
        renderer.setScissorTest(true);
        if (left > 0) {
          renderer.setScissor(0, 0, left, view.height);
          renderer.render(destinationScene, camera);
        }
        if (bottom < view.height && left < view.width) {
          renderer.setScissor(left, 0, view.width - left, view.height - bottom);
          renderer.render(destinationScene, camera);
        }
        renderer.setScissorTest(false);
      } else {
        renderer.render(destinationScene, camera);
      }
      if(laboratory.visible)renderer.render(laboratoryScene,camera);
      if (displayedHologram > 0.001) {
        character.updateMatrixWorld(true);
        for (const part of shellDepthParts) {part.depth.visible=part.source.visible;part.depth.matrix.copy(part.source.matrixWorld);}
        renderer.render(shellDepthScene, camera);
      }
      renderer.render(characterScene, camera);
      frame = requestAnimationFrame(animate);
    };
    const resize = () => {
      const bounds = container.getBoundingClientRect();
      const mobile = window.matchMedia('(max-width: 700px)').matches;
      // Render across the whole screen, retaining the scene's original scale
      // and placement without clipping it to the right-hand column.
      const sceneWidth = bounds.width * (mobile ? 1.20 : 0.73);
      const sceneHeight = Math.max(1, mobile ? bounds.height * 0.63 : bounds.height - 90);
      const halfSceneHeight = Math.max(3.05, 3.2 / (sceneWidth / sceneHeight));
      const unitsPerPixel = halfSceneHeight * 2 / sceneHeight / 1.20;
      const halfWidth = bounds.width * unitsPerPixel / 2;
      const halfHeight = bounds.height * unitsPerPixel / 2;
      const offsetX = bounds.width * (mobile ? 0.02 : 0.185) * unitsPerPixel;
      const offsetY = (mobile ? bounds.height * 0.195 : 45) * unitsPerPixel;
      camera.left = -halfWidth - offsetX; camera.right = halfWidth - offsetX;
      camera.top = halfHeight + offsetY; camera.bottom = -halfHeight + offsetY;
      camera.updateProjectionMatrix(); renderer.setSize(bounds.width, bounds.height);
    };
    const observer = new ResizeObserver(resize); observer.observe(container); resize(); frame = requestAnimationFrame(animate);
    return () => { disposed = true; logoImage.onload = null;
      window.removeEventListener('pointermove', followScenePointer);
      window.removeEventListener('blur', centerScenePointer);
      document.documentElement.removeEventListener('pointerleave', centerScenePointer);
      renderer.domElement.removeEventListener('pointerup',toggleWindowWeather);
      renderer.domElement.removeEventListener('pointerdown',startLabOrbit);
      renderer.domElement.removeEventListener('pointermove',moveLabOrbit);
      renderer.domElement.removeEventListener('pointerup',stopLabOrbit);
      renderer.domElement.removeEventListener('pointercancel',stopLabOrbit);
      renderer.domElement.removeEventListener('pointerdown', startGlobeDrag);
      renderer.domElement.removeEventListener('pointermove', moveGlobe);
      renderer.domElement.removeEventListener('pointerup', stopGlobeDrag);
      renderer.domElement.removeEventListener('pointercancel', stopGlobeDrag);
      cancelAnimationFrame(frame); observer.disconnect(); resources.forEach(item => item.dispose()); renderer.dispose(); renderer.domElement.remove(); };
  }, []);
  return <div ref={host} className="office-scene" role="img" aria-label="Cena 3D de escritório com personagem que se levanta ao rolar a página">{failed && <p className="office-error">Não foi possível exibir a cena 3D neste navegador.</p>}</div>;
}
