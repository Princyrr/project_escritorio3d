import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import imageUrl from '../assets/particle-building.png';

export default function ReliefBuilding({ depth, effect = 0 }: { depth: number; effect?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const depthRef = useRef(depth);
  const effectRef = useRef(effect);
  useEffect(() => { effectRef.current = effect; }, [effect]);
  const updateDepth = useRef<(() => void) | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { depthRef.current = depth; }, [depth]);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
    catch { setError(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0.65, 0.25, 8.5);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 5;
    controls.maxDistance = 15;
    controls.minAzimuthAngle = -0.75;
    controls.maxAzimuthAngle = 0.75;
    controls.minPolarAngle = Math.PI * 0.28;
    controls.maxPolarAngle = Math.PI * 0.7;
    scene.add(new THREE.AmbientLight('#dbeafe', 1.5));
    const light = new THREE.DirectionalLight('#ffffff', 2.2);
    light.position.set(-4, 5, 6);
    scene.add(light);
    const fill = new THREE.DirectionalLight('#67e8f9', 0.5);
    fill.position.set(4, 0, 3);
    scene.add(fill);
    let geometry: THREE.PlaneGeometry | undefined;
    let material: THREE.MeshStandardMaterial | undefined;
    let texture: THREE.CanvasTexture | undefined;
    const effectUniforms = {
      uTime: { value: 0 },
      uEffects: { value: [1, 0, 0, 0, 0, 0] },
    };
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lastRender = performance.now();
    let renderedDepth = depthRef.current;
    let disposed = false;
    let frame = 0;
    const resize = () => {
      const bounds = container.getBoundingClientRect();
      renderer.setSize(bounds.width, bounds.height);
      camera.aspect = bounds.width / Math.max(bounds.height, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    const image = new Image();
    image.onload = () => {
      if (disposed) return;
      const canvas = document.createElement('canvas');
      canvas.width = 960;
      canvas.height = 640;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, 0, 0, 960, 640);
      const outline = new Path2D('M 24 614 L 66 126 L 170 20 L 470 238 Q 514 264 550 264 L 800 290 L 800 268 L 868 224 L 916 236 L 944 614 Z');
      const pixels = ctx.getImageData(0, 0, 960, 640);
      for (let y = 0; y < 640; y++) {
        for (let x = 0; x < 960; x++) {
          if (!ctx.isPointInPath(outline, x, y) && !(x >= 864 && x <= 932 && y >= 142 && y <= 224)) pixels.data[(y * 960 + x) * 4 + 3] = 0;
        }
      }
      ctx.putImageData(pixels, 0, 0);
      texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const depthCanvas = document.createElement('canvas');
      depthCanvas.width = 240;
      depthCanvas.height = 160;
      const depthContext = depthCanvas.getContext('2d')!;
      depthContext.filter = 'blur(1.5px)';
      depthContext.drawImage(image, 0, 0, 240, 160);
      const depthPixels = depthContext.getImageData(0, 0, 240, 160).data;
      geometry = new THREE.PlaneGeometry(6, 4, 240, 160);
      const position = geometry.attributes.position;
      const heights = new Float32Array(position.count);
      for (let i = 0; i < position.count; i++) {
        const x = Math.min(239, Math.max(0, Math.round((position.getX(i) + 3) * 40)));
        const y = Math.min(159, Math.max(0, Math.round((2 - position.getY(i)) * 40)));
        const offset = (y * 240 + x) * 4;
        // Lighter masonry projects forward; darker windows become recesses.
        heights[i] = (depthPixels[offset] * 0.2126 + depthPixels[offset + 1] * 0.7152 + depthPixels[offset + 2] * 0.0722) / 255;
      }
      updateDepth.current = () => {
        if (!geometry) return;
        for (let i = 0; i < position.count; i++) position.setZ(i, (heights[i] - 0.5) * renderedDepth);
        position.needsUpdate = true;
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
      };
      updateDepth.current();
      material = new THREE.MeshStandardMaterial({ map: texture, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide, roughness: 0.9, metalness: 0.05 });
      material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, effectUniforms);
        shader.uniforms.uImage = { value: texture };
        const declarations = `uniform float uTime; uniform float uEffects[6]; varying vec2 vEffectUv;`;
        shader.vertexShader = declarations + '\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nvEffectUv = uv;');
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
          #include <begin_vertex>
          float wave = sin(uv.x * 24.0 + uTime * 2.5) * cos(uv.y * 18.0 - uTime * 2.0);
          transformed.z += wave * 0.12 * uEffects[3];
          transformed.x += sin(uv.y * 16.0 - uTime * 1.6) * 0.055 * uEffects[4];
          transformed.y += sin(uv.x * 22.0 + uTime * 4.0) * 0.045 * uEffects[5];
        `);
        shader.fragmentShader = declarations + `
          uniform sampler2D uImage;
          float hashEffect(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float noiseEffect(vec2 p) {
            vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
            return mix(mix(hashEffect(i), hashEffect(i + vec2(1.0, 0.0)), f.x), mix(hashEffect(i + vec2(0.0, 1.0)), hashEffect(i + vec2(1.0)), f.x), f.y);
          }
          float cloudEffect(vec2 p) {
            return noiseEffect(p) * 0.57 + noiseEffect(p * 2.03) * 0.28 + noiseEffect(p * 4.01) * 0.15;
          }
        ` + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
          vec2 effectUv = vEffectUv;
          effectUv += vec2(sin(effectUv.y * 25.0 + uTime * 2.4), cos(effectUv.x * 24.0 - uTime * 2.0)) * 0.008 * uEffects[3];
          float cloud = cloudEffect(vEffectUv * vec2(9.0, 6.0) + vec2(uTime * 0.22, -uTime * 0.55));
          effectUv.x += (cloud - 0.5) * 0.035 * uEffects[4];
          float flame = cloudEffect(vEffectUv * vec2(14.0, 9.0) + vec2(0.0, -uTime * 1.7));
          effectUv.x += sin(vEffectUv.y * 28.0 - uTime * 5.0) * 0.009 * uEffects[5];
          vec4 photo = texture2D(uImage, clamp(effectUv, vec2(0.001), vec2(0.999)));
          float luminance = dot(photo.rgb, vec3(0.2126, 0.7152, 0.0722));
          float scan = 0.60 + 0.40 * sin(vEffectUv.y * 350.0 - uTime * 5.0);
          vec3 hologram = vec3(0.04, 0.65, 1.0) * (0.35 + luminance * 1.5) * scan;
          vec2 bricks = vEffectUv * vec2(55.0, 38.0);
          bricks.x += mod(floor(bricks.y), 2.0) * 0.5;
          vec2 tile = fract(bricks);
          float mortar = smoothstep(0.015, 0.06, min(min(tile.x, 1.0 - tile.x), min(tile.y, 1.0 - tile.y)));
          vec3 textured = photo.rgb * mix(0.45, 1.1, mortar) * (0.92 + 0.16 * noiseEffect(vEffectUv * 450.0));
          float ripple = sin(vEffectUv.y * 55.0 - uTime * 3.0 + sin(vEffectUv.x * 18.0)) * 0.5 + 0.5;
          vec3 water = mix(photo.rgb, vec3(0.03, 0.32, 0.65), 0.5) + vec3(0.05, 0.2, 0.25) * pow(ripple, 8.0);
          vec3 smoke = mix(vec3(0.08, 0.12, 0.18), vec3(0.65, 0.72, 0.8), cloud) * (0.6 + luminance * 0.6);
          float heat = clamp(flame * 1.6 + (1.0 - vEffectUv.y) * 0.25, 0.0, 1.0);
          vec3 fire = mix(vec3(0.7, 0.015, 0.002), vec3(1.0, 0.65, 0.04), smoothstep(0.2, 0.85, heat));
          fire = mix(fire, vec3(1.0, 0.95, 0.5), smoothstep(0.8, 1.0, heat));
          fire *= 0.55 + luminance * 1.0;
          vec3 transformedColor = photo.rgb * uEffects[0] + hologram * uEffects[1] + textured * uEffects[2] + water * uEffects[3] + smoke * uEffects[4] + fire * uEffects[5];
          float transformedAlpha = photo.a * (1.0 - uEffects[1] * 0.28) * mix(1.0, smoothstep(0.2, 0.65, cloud), uEffects[4]);
          diffuseColor *= vec4(transformedColor, transformedAlpha);
        `);
        shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
          #include <emissivemap_fragment>
          totalEmissiveRadiance += diffuseColor.rgb * (uEffects[1] * 0.8 + uEffects[5] * 1.5);
        `);
      };
      scene.add(new THREE.Mesh(geometry, material));
    };
    image.onerror = () => { if (!disposed) setError(true); };
    image.src = imageUrl;
    const render = (now: number) => {
      if (disposed) return;
      const delta = Math.min((now - lastRender) / 1000, 0.1);
      lastRender = now;
      effectUniforms.uTime.value = reducedMotion ? 0 : now / 1000;
      const blend = reducedMotion ? 1 : 1 - Math.exp(-delta * 4);
      if (updateDepth.current && Math.abs(renderedDepth - depthRef.current) > 0.001) {
        renderedDepth += (depthRef.current - renderedDepth) * blend;
        if (Math.abs(renderedDepth - depthRef.current) < 0.001) renderedDepth = depthRef.current;
        updateDepth.current();
      }
      for (let i = 0; i < 6; i++) {
        const target = i === effectRef.current ? 1 : 0;
        effectUniforms.uEffects.value[i] += (target - effectUniforms.uEffects.value[i]) * blend;
      }
      if (material) {
        material.roughness = effectRef.current === 3 ? 0.25 : 0.9;
        material.metalness = effectRef.current === 1 ? 0.25 : 0.05;
      }
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      image.onload = null;
      image.onerror = null;
      updateDepth.current = null;
      geometry?.dispose();
      material?.dispose();
      texture?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return <div ref={host} className="relief-view" role="img" aria-label="Edifício em relevo 3D, arraste para mudar o ângulo">{error && <p className="particle-fallback">Não foi possível exibir o relevo 3D neste navegador.</p>}</div>;
}
