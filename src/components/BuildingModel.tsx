import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import imageUrl from '../assets/particle-building.png';

export default function BuildingModel({ active, depth, effect }: { active: boolean; depth: number; effect: number }) {
  const host = useRef<HTMLDivElement>(null);
  const settings = useRef({ active, depth, effect });
  const [failed, setFailed] = useState(false);
  useEffect(() => { settings.current = { active, depth, effect }; }, [active, depth, effect]);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
    catch { setFailed(true); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2.25, 0);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 5;
    controls.maxDistance = 20;
    controls.minPolarAngle = 0.3;
    controls.maxPolarAngle = Math.PI / 2 + 0.08;
    scene.add(new THREE.HemisphereLight('#dbeafe', '#334155', 2));
    const sun = new THREE.DirectionalLight('#fff4dc', 3);
    sun.position.set(-4, 8, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -7; sun.shadow.camera.right = 7;
    sun.shadow.camera.top = 7; sun.shadow.camera.bottom = -7;
    scene.add(sun);
    const fill = new THREE.DirectionalLight('#a5e7ff', 1);
    fill.position.set(5, 3, -3); scene.add(fill);
    const resources: Array<{ dispose: () => void }> = [];
    const model = new THREE.Group();
    scene.add(model);
    const materials: Array<{ material: THREE.MeshStandardMaterial; color: THREE.Color }> = [];
    const makeMaterial = (color: string, roughness = 0.8, metalness = 0) => {
      const material = new THREE.MeshStandardMaterial({ color, roughness, metalness, transparent: true, opacity: 0 });
      materials.push({ material, color: material.color.clone() }); resources.push(material); return material;
    };
    const stone = makeMaterial('#ddd2ba');
    const glass = makeMaterial('#123b57', 0.18, 0.4);
    const dark = makeMaterial('#172533');
    const metal = makeMaterial('#71818b', 0.25, 0.7);
    const box = new THREE.BoxGeometry(1, 1, 1); resources.push(box);
    const addBox = (parent: THREE.Group, material: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number) => {
      const mesh = new THREE.Mesh(box, material);
      mesh.position.set(x, y, z); mesh.scale.set(w, h, d);
      mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
    };
    const width = 8, count = 30, step = width / count;
    const facadeZ = (x: number) => 0.75 - 0.045 * x * x;
    const roofY = (x: number) => 3.55 + 1.5 * Math.pow(Math.max(0, -x / 4), 1.7);
    // Warm stone with subtle tile joints, rather than noisy displacement.
    const stoneCanvas = document.createElement('canvas'); stoneCanvas.width = 512; stoneCanvas.height = 512;
    const stoneContext = stoneCanvas.getContext('2d')!;
    stoneContext.fillStyle = '#efe1c9'; stoneContext.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 5000; i++) {
      stoneContext.fillStyle = `rgba(120,98,73,${Math.random() * 0.035})`;
      stoneContext.fillRect(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 9, 1 + Math.random() * 4);
    }
    stoneContext.strokeStyle = 'rgba(116,100,81,0.2)'; stoneContext.lineWidth = 1;
    for (let y = 0; y <= 512; y += 128) { stoneContext.beginPath(); stoneContext.moveTo(0, y); stoneContext.lineTo(512, y); stoneContext.stroke(); }
    for (let x = 0; x <= 512; x += 256) { stoneContext.beginPath(); stoneContext.moveTo(x, 0); stoneContext.lineTo(x, 512); stoneContext.stroke(); }
    const stoneTexture = new THREE.CanvasTexture(stoneCanvas); stoneTexture.colorSpace = THREE.SRGBColorSpace;
    stoneTexture.wrapS = stoneTexture.wrapT = THREE.RepeatWrapping; stone.map = stoneTexture; stone.needsUpdate = true; resources.push(stoneTexture);
    const rounded = (w: number, bottom: number, top: number, radius: number) => {
      const path = new THREE.Shape(); const left = -w / 2, right = w / 2;
      path.moveTo(left + radius, bottom); path.lineTo(right - radius, bottom);
      path.quadraticCurveTo(right, bottom, right, bottom + radius); path.lineTo(right, top - radius);
      path.quadraticCurveTo(right, top, right - radius, top); path.lineTo(left + radius, top);
      path.quadraticCurveTo(left, top, left, top - radius); path.lineTo(left, bottom + radius);
      path.quadraticCurveTo(left, bottom, left + radius, bottom); return path;
    };
    const glassCanvas = document.createElement('canvas'); glassCanvas.width = 64; glassCanvas.height = 256;
    const glassContext = glassCanvas.getContext('2d')!;
    const reflection = glassContext.createLinearGradient(0, 0, 64, 256);
    reflection.addColorStop(0, '#507c99'); reflection.addColorStop(0.3, '#1c4e6d'); reflection.addColorStop(0.65, '#35677f'); reflection.addColorStop(1, '#0d2c43');
    glassContext.fillStyle = reflection; glassContext.fillRect(0, 0, 64, 256);
    for (let y = 30; y < 256; y += 47) { glassContext.fillStyle = 'rgba(146,192,211,0.12)'; glassContext.fillRect(0, y, 64, 12); }
    const glassTexture = new THREE.CanvasTexture(glassCanvas); glassTexture.colorSpace = THREE.SRGBColorSpace; resources.push(glassTexture);
    glass.map = glassTexture; glass.color.set('#ffffff'); glass.needsUpdate = true;
    materials.find((entry) => entry.material === glass)!.color.set('#ffffff');
    const archCount = 9, archStep = width / archCount;
    const archShape = new THREE.Shape();
    const halfDoor = archStep * 0.38;
    archShape.moveTo(-archStep / 2, 0); archShape.lineTo(-archStep / 2, 1.06);
    archShape.lineTo(archStep / 2, 1.06); archShape.lineTo(archStep / 2, 0);
    archShape.lineTo(halfDoor, 0); archShape.lineTo(halfDoor, 0.52);
    archShape.quadraticCurveTo(halfDoor, 0.93, 0, 0.93);
    archShape.quadraticCurveTo(-halfDoor, 0.93, -halfDoor, 0.52);
    archShape.lineTo(-halfDoor, 0); archShape.closePath();
    const archGeometry = new THREE.ExtrudeGeometry(archShape, { depth: 0.85, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 1, curveSegments: 24 }); resources.push(archGeometry);
    for (let i = 0; i < archCount; i++) {
      const x = -4 + archStep * (i + 0.5);
      const module = new THREE.Group(); module.position.set(x, 0, facadeZ(x) - 0.65); module.rotation.y = Math.atan(0.09 * x); model.add(module);
      const arch = new THREE.Mesh(archGeometry, stone); arch.castShadow = arch.receiveShadow = true; module.add(arch);
      addBox(module, dark, 0, 0.5, -0.1, archStep, 1, 0.04);
    }
    for (let i = 0; i < count; i++) {
      const x = -4 + step * (i + 0.5);
      const roof = roofY(x);
      const module = new THREE.Group(); module.position.set(x, 0, facadeZ(x)); module.rotation.y = Math.atan(0.09 * x); model.add(module);
      const facade = new THREE.Shape();
      facade.moveTo(-step / 2, 1.0); facade.lineTo(step / 2, 1.0);
      facade.lineTo(step / 2, roofY(x + step / 2)); facade.lineTo(-step / 2, roofY(x - step / 2)); facade.closePath();
      for (const [bottom, top] of [[1.13, 2.20], [2.30, roof - 0.16]]) {
        const windowShape = rounded(step * 0.72, bottom, top, step * 0.18);
        facade.holes.push(new THREE.Path(windowShape.getPoints(16)));
        const paneGeometry = new THREE.ShapeGeometry(windowShape, 16); resources.push(paneGeometry);
        const pane = new THREE.Mesh(paneGeometry, glass); pane.position.z = -0.025; pane.receiveShadow = true; module.add(pane);
        for (let y = bottom + 0.28; y < top - 0.12; y += 0.36) addBox(module, metal, 0, y, -0.005, step * 0.73, 0.012, 0.01);
      }
      const facadeGeometry = new THREE.ExtrudeGeometry(facade, { depth: 0.12, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 16 }); resources.push(facadeGeometry);
      const panel = new THREE.Mesh(facadeGeometry, stone); panel.castShadow = panel.receiveShadow = true; module.add(panel);
      const roofGeometry = new THREE.BoxGeometry(step * 1.04, 0.09, 1.65);
      const roofPositions = roofGeometry.attributes.position;
      for (let vertex = 0; vertex < roofPositions.count; vertex++) {
        roofPositions.setY(vertex, roofPositions.getY(vertex) + roofY(x + roofPositions.getX(vertex)) - roof);
      }
      roofGeometry.computeVertexNormals(); resources.push(roofGeometry);
      const roofSlab = new THREE.Mesh(roofGeometry, stone);
      roofSlab.position.set(0, roof + 0.025, -0.67); roofSlab.castShadow = true; module.add(roofSlab);
      addBox(module, glass, 0, roof - 0.055, -0.05, step, 0.06, 0.1);
      addBox(module, stone, 0, roof / 2, -1.44, step * 1.03, roof, 0.16);
      if ([4, 5, 6, 10, 11, 15, 19, 24, 26].includes(i)) {
        const vent = addBox(module, glass, 0, Math.min(roof - 0.55, 2.85), 0.02, step * 0.7, 0.17, 0.018);
        vent.rotation.x = -0.35;
      }
    }
    addBox(model, stone, -4.06, roofY(-4) / 2, -0.76, 0.16, roofY(-4), 1.66);
    addBox(model, stone, 4.06, 1.8, -0.76, 0.16, 3.6, 1.66);
    // Tower extends from the ground, with cap and rooftop guardrail.
    const towerX = 3.88, towerZ = -0.94;
    addBox(model, stone, towerX, 1.98, towerZ, 0.57, 3.96, 0.65);
    addBox(model, stone, towerX, 3.92, towerZ, 0.72, 0.18, 0.81);
    for (const z of [towerZ - 0.36, towerZ + 0.36]) {
      addBox(model, metal, towerX, 4.2, z, 0.67, 0.018, 0.018);
      for (let i = 0; i < 5; i++) addBox(model, metal, towerX - 0.32 + i * 0.16, 4.10, z, 0.012, 0.2, 0.012);
    }
    addBox(model, metal, towerX, 4.67, towerZ, 0.023, 1.26, 0.023);
    const flagCanvas = document.createElement('canvas'); flagCanvas.width = 240; flagCanvas.height = 160;
    const fc = flagCanvas.getContext('2d')!;
    fc.fillStyle = '#009c3b'; fc.fillRect(0, 0, 240, 160);
    fc.fillStyle = '#ffdf00'; fc.beginPath(); fc.moveTo(120, 18); fc.lineTo(220, 80); fc.lineTo(120, 142); fc.lineTo(20, 80); fc.closePath(); fc.fill();
    fc.fillStyle = '#002776'; fc.beginPath(); fc.arc(120, 80, 39, 0, Math.PI * 2); fc.fill();
    fc.strokeStyle = 'white'; fc.lineWidth = 5; fc.beginPath(); fc.moveTo(84, 69); fc.quadraticCurveTo(120, 61, 157, 91); fc.stroke();
    fc.fillStyle = 'white'; for (let i = 0; i < 15; i++) { fc.beginPath(); fc.arc(98 + (i * 13) % 45, 85 + (i * 7) % 24, 1, 0, Math.PI * 2); fc.fill(); }
    const flagTexture = new THREE.CanvasTexture(flagCanvas); flagTexture.colorSpace = THREE.SRGBColorSpace; resources.push(flagTexture);
    const flagMaterial = makeMaterial('#ffffff'); flagMaterial.map = flagTexture; flagMaterial.side = THREE.DoubleSide;
    const flagGeometry = new THREE.PlaneGeometry(0.62, 0.4, 20, 10); resources.push(flagGeometry);
    const flag = new THREE.Mesh(flagGeometry, flagMaterial); flag.position.set(towerX + 0.32, 5.02, towerZ); model.add(flag);
    const flagVertices = flagGeometry.attributes.position;
    const originalFlag = new Float32Array(flagVertices.array);
    addBox(model, stone, 0, -0.045, -0.45, 8.45, 0.09, 2.65);
    const imageTexture = new THREE.TextureLoader().load(imageUrl, undefined, undefined, () => setFailed(true));
    imageTexture.colorSpace = THREE.SRGBColorSpace; resources.push(imageTexture);
    const photoGeometry = new THREE.PlaneGeometry(8, 5.33); resources.push(photoGeometry);
    const photoMaterial = new THREE.MeshBasicMaterial({ map: imageTexture, transparent: true, side: THREE.DoubleSide }); resources.push(photoMaterial);
    const photo = new THREE.Mesh(photoGeometry, photoMaterial); photo.position.set(0, 2.6, 1.15); scene.add(photo);
    const resize = () => {
      const bounds = container.getBoundingClientRect(); renderer.setSize(bounds.width, bounds.height);
      camera.aspect = bounds.width / Math.max(bounds.height, 1); camera.updateProjectionMatrix();
    };
    const bounds = container.getBoundingClientRect();
    camera.position.set(-5.6, 3.5, bounds.width / Math.max(bounds.height, 1) < 1 ? 19 : 13);
    controls.update();
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let amount = settings.current.active ? 1 : 0;
    let last = performance.now(), frame = 0, disposed = false;
    const render = (now: number) => {
      if (disposed) return;
      const delta = Math.min(0.1, (now - last) / 1000); last = now;
      const target = settings.current.active ? 1 : 0;
      amount += (target - amount) * (reduced ? 1 : 1 - Math.exp(-delta * 3.5));
      photo.visible = amount < 0.995; photoMaterial.opacity = 1 - amount;
      model.visible = amount > 0.005;
      model.scale.z = (0.05 + amount * 0.95) * settings.current.depth;
      if (!reduced && amount > 0.01) {
        for (let i = 0; i < flagVertices.count; i++) {
          const x = originalFlag[i * 3]; const strength = (x + 0.31) / 0.62;
          flagVertices.setZ(i, Math.sin(strength * 7 - now / 350) * 0.055 * strength);
        }
        flagVertices.needsUpdate = true; flagGeometry.computeVertexNormals();
      }
      const fx = settings.current.effect;
      for (const { material, color } of materials) {
        material.opacity = amount * (fx === 4 ? 0.55 : fx === 1 ? 0.7 : 1);
        material.depthWrite = amount > 0.99;
        material.color.copy(color);
        material.emissive.set('#000000');
        if (fx === 1) { material.color.lerp(new THREE.Color('#00ccff'), 0.7); material.emissive.set('#004466'); }
        if (fx === 3) material.color.lerp(new THREE.Color('#0088cc'), 0.55);
        if (fx === 4) material.color.lerp(new THREE.Color('#9ba7b6'), 0.8);
        if (fx === 5) { material.color.lerp(new THREE.Color('#ff6a00'), 0.8); material.emissive.set('#9b2500'); material.emissiveIntensity = 0.7 + (reduced ? 0 : Math.sin(now / 120) * 0.2); }
      }
      controls.update(); renderer.render(scene, camera); frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); resources.forEach((resource) => resource.dispose()); renderer.dispose(); renderer.domElement.remove(); };
  }, []);
  return <div ref={host} className="relief-view" role="img" aria-label="Maquete 3D do edifício com fachada curva, janelas e arcos">{failed && <p className="particle-fallback">Não foi possível carregar a visualização 3D.</p>}</div>;
}
