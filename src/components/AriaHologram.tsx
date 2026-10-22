import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export default function AriaHologram({ rotating = false }: { rotating?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(rotating);
  const [status, setStatus] = useState('Carregando modelo Aria…');
  useEffect(() => { rotationRef.current = rotating; }, [rotating]);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
    catch { setStatus('Não foi possível iniciar o holograma 3D neste navegador.'); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
    camera.position.set(0, 0, 6.2);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 12;
    controls.autoRotateSpeed = 0.7;
    scene.add(new THREE.HemisphereLight('#fff4e9', '#67778b', 2.2));
    const keyLight = new THREE.DirectionalLight('#fff1df', 2.5); keyLight.position.set(-3, 4, 6); scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight('#e0edff', 1.2); fillLight.position.set(4, 1, 4); scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight('#88bfff', 1); rimLight.position.set(1, 3, -4); scene.add(rimLight);
    const surfaceTexture = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}textura_holograma.png`);
    surfaceTexture.colorSpace = THREE.SRGBColorSpace;
    surfaceTexture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    const material = new THREE.MeshStandardMaterial({ map: surfaceTexture, roughness: 0.65, metalness: 0.08, transparent: false, side: THREE.DoubleSide });
    let root: THREE.Group | null = null;
    let disposed = false, frame = 0;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const release = (object: THREE.Object3D) => {
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      object.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        geometries.add(child.geometry);
        (Array.isArray(child.material) ? child.material : [child.material]).forEach((item) => materials.add(item));
      });
      geometries.forEach((item) => item.dispose());
      materials.forEach((item) => { if (item !== material) item.dispose(); });
    };
    const loader = new GLTFLoader();
    loader.load(`${import.meta.env.BASE_URL}models/aria.glb`, (gltf) => {
      if (disposed) { release(gltf.scene); return; }
      root = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(root);
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      const scale = 2.8 / Math.max(size.y, 0.001);
      root.scale.setScalar(scale);
      root.position.copy(center).multiplyScalar(-scale);
      const originalMaterials = new Set<THREE.Material>();
      root.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        if (!child.geometry.attributes.normal) child.geometry.computeVertexNormals();
        (Array.isArray(child.material) ? child.material : [child.material]).forEach((item) => originalMaterials.add(item));
        // This GLB has no exported UVs. Use a cylindrical projection only as
        // a temporary placement of the supplied texture, not its original atlas.
        if (!child.geometry.attributes.uv) {
          const positions = child.geometry.attributes.position;
          const uv = new Float32Array(positions.count * 2);
          child.geometry.computeBoundingBox();
          const localBounds = child.geometry.boundingBox!;
          const height = Math.max(0.001, localBounds.max.y - localBounds.min.y);
          for (let i = 0; i < positions.count; i++) {
            uv[i * 2] = Math.atan2(positions.getX(i), positions.getZ(i)) / (Math.PI * 2) + 0.5;
            uv[i * 2 + 1] = (positions.getY(i) - localBounds.min.y) / height;
          }
          child.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        }
        child.geometry.deleteAttribute('color');
        child.material = material;
      });
      originalMaterials.forEach((item) => item.dispose());
      scene.add(root);
      setStatus('');
    }, (progress) => {
      if (!disposed && progress.total > 0) setStatus(`Carregando Aria… ${Math.round(progress.loaded / progress.total * 100)}%`);
    }, () => { if (!disposed) setStatus('Não foi possível carregar /models/aria.glb.'); });
    const resize = () => {
      const bounds = container.getBoundingClientRect();
      renderer.setSize(bounds.width, bounds.height);
      camera.aspect = bounds.width / Math.max(bounds.height, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    const render = () => {
      if (disposed) return;
      controls.autoRotate = rotationRef.current && !reducedMotion;
      controls.update(); renderer.render(scene, camera); frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); controls.dispose();
      if (root) release(root);
      material.dispose(); surfaceTexture.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  return <div className="face-hologram-view" role="img" aria-label="Modelo Aria 3D com a textura holográfica enviada"><div ref={host} className="absolute inset-0" />{status && <p role="status" className="absolute inset-0 flex items-center justify-center px-6 text-center text-cyan-200">{status}</p>}</div>;
}
