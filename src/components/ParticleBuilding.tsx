import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import imageUrl from '../assets/particle-building.png';

export default function ParticleBuilding({ effectCount = 0 }: { effectCount?: number }) {
  const effects = useRef(effectCount);
  useEffect(() => { effects.current = effectCount; }, [effectCount]);
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
    catch { setFailed(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const composition = new THREE.Group();
    scene.add(composition);
    const extraResources: Array<{ dispose: () => void }> = [];
    const pointer = new THREE.Vector2();
    const movePointer = (event: PointerEvent) => {
      const bounds = container.getBoundingClientRect();
      pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, (event.clientY - bounds.top) / bounds.height * 2 - 1);
    };
    window.addEventListener('pointermove', movePointer);
    const camera = new THREE.OrthographicCamera(-3.2, 3.2, 2.2, -2.2, 0.1, 100);
    camera.position.z = 10;
    let geometry: THREE.BufferGeometry | undefined;
    let material: THREE.ShaderMaterial | undefined;
    let frame = 0;
    let disposed = false;
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height);
      const aspect = width / Math.max(height, 1);
      const halfHeight = Math.max(2.05, 3.05 / aspect);
      const halfWidth = halfHeight * aspect;
      const leftEdge = -3.05;
      camera.left = leftEdge;
      camera.right = leftEdge + halfWidth * 2;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    const source = new Image();
    source.onload = () => {
      if (disposed) return;
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 320;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(source, 0, 0, 480, 320);
      const data = ctx.getImageData(0, 0, 480, 320).data;
      const targets: number[] = [];
      const colors: number[] = [];
      const flagWeights: number[] = [];
      const flagRows: number[] = [];
      // Keep the architecture and flag; omit the sky around the silhouette.
      const outline = new Path2D('M 12 307 L 33 63 L 85 10 L 235 119 Q 257 132 275 132 L 400 145 L 400 134 L 434 112 L 458 118 L 472 307 Z');
      for (let y = 0; y < 320; y += 2) {
        for (let x = 0; x < 480; x += 2) {
          const flag = x >= 432 && x <= 466 && y >= 71 && y <= 117;
          if (!ctx.isPointInPath(outline, x, y) && !flag) continue;
          const i = (y * 480 + x) * 4;
          const color = new THREE.Color(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255).convertSRGBToLinear();
          targets.push((x - 240) / 80, (160 - y) / 80, 0);
          colors.push(color.r, color.g, color.b);
          // Anchor the cloth at the pole; the free edge catches more wind.
          // Use the full sampled flag region so its edge particles move too.
          // The pole stays fixed to the left of the cloth.
          // The rooftop begins below the flag: keep those building points fixed.
          const isFabric = flag && x >= 436 && y <= 108;
          flagWeights.push(isFabric ? Math.max(0.08, Math.min(1, (x - 434) / 32)) : 0);
          flagRows.push((y - 75) / 33);
        }
      }
      const positions = new Float32Array(targets.length);
      const origins = targets.map((value, i) => i % 3 === 0 ? value - 6 - Math.random() * 4 : value + (Math.random() - 0.5) * 5);
      geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      material = new THREE.ShaderMaterial({
        transparent: true, vertexColors: true, depthWrite: false,
        uniforms: { pixelRatio: { value: renderer.getPixelRatio() }, hologram: { value: 0 }, mosaic: { value: 0 }, sweep: { value: 1 }, time: { value: 0 } },
        vertexShader: `uniform float pixelRatio; uniform float mosaic; varying vec3 vColor; varying float vHeight;
          void main() { vColor = color; vHeight = (position.y + 2.0) / 4.0; gl_PointSize = mix(2.8, 5.0, mosaic) * pixelRatio;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform float hologram; uniform float mosaic; uniform float sweep; uniform float time; varying float vHeight; varying vec3 vColor; void main() {
          if (vHeight > sweep) discard;
          float d = length(gl_PointCoord - 0.5); if (d > 0.5 && mosaic < 0.5) discard;
          vec3 tint = mix(vColor * 1.35, vec3(0.12, 0.85, 1.0), hologram * 0.75);
          float scan = mix(1.0, 0.55 + 0.45 * pow(0.5 + 0.5 * sin(vHeight * 180.0 - time * 3.0), 2.0), hologram);
          gl_FragColor = vec4(tint, mix(1.0 - smoothstep(0.25, 0.5, d), 0.9, mosaic) * scan);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      });
      const points = new THREE.Points(geometry, material);
      points.frustumCulled = false;
      composition.add(points);
      // Photo-based relief: this is a height field, not a full architectural model.
      const reliefGeometry = new THREE.PlaneGeometry(6, 4, 120, 80);
      const reliefPositions = reliefGeometry.attributes.position;
      for (let i = 0; i < reliefPositions.count; i++) {
        const x = Math.min(479, Math.max(0, Math.round((reliefPositions.getX(i) + 3) * 80)));
        const y = Math.min(319, Math.max(0, Math.round((2 - reliefPositions.getY(i)) * 80)));
        const offset = (y * 480 + x) * 4;
        reliefPositions.setZ(i, (data[offset] + data[offset + 1] + data[offset + 2]) / 765 * 0.35 - 0.4);
      }
      reliefGeometry.computeVertexNormals();
      for (let y = 0; y < 320; y++) {
        for (let x = 0; x < 480; x++) {
          if (!ctx.isPointInPath(outline, x, y) && !(x >= 432 && x <= 466 && y >= 71 && y <= 108)) data[(y * 480 + x) * 4 + 3] = 0;
        }
      }
      ctx.putImageData(new ImageData(data, 480, 320), 0, 0);
      const reliefTexture = new THREE.CanvasTexture(canvas);
      reliefTexture.colorSpace = THREE.SRGBColorSpace;
      const reliefMaterial = new THREE.MeshBasicMaterial({ map: reliefTexture, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide });
      const relief = new THREE.Mesh(reliefGeometry, reliefMaterial);
      composition.add(relief);
      extraResources.push(reliefGeometry, reliefTexture, reliefMaterial);

      const contours: number[] = [];
      const connections: number[] = [];
      const inside = (x: number, y: number) => x >= 0 && x < 480 && y >= 0 && y < 320 && data[(y * 480 + x) * 4 + 3] > 0;
      const segment = (array: number[], x: number, y: number, xx: number, yy: number) => array.push((x - 240) / 80, (160 - y) / 80, 0.04, (xx - 240) / 80, (160 - yy) / 80, 0.04);
      const brightness = (x: number, y: number) => { const i = (y * 480 + x) * 4; return (data[i] + data[i + 1] + data[i + 2]) / 3; };
      for (let y = 4; y < 316; y += 4) {
        for (let x = 4; x < 476; x += 4) {
          if (!inside(x, y)) continue;
          if (!inside(x - 4, y) || Math.abs(brightness(x, y) - brightness(x - 4, y)) > 28) segment(contours, x, y, x, y + 4);
          if (!inside(x, y - 4) || Math.abs(brightness(x, y) - brightness(x, y - 4)) > 28) segment(contours, x, y, x + 4, y);
          if (x % 16 === 0 && y % 16 === 0) {
            if (inside(x + 16, y)) segment(connections, x, y, x + 16, y);
            if (inside(x, y + 16)) segment(connections, x, y, x, y + 16);
            if (inside(x + 16, y + 16)) segment(connections, x, y, x + 16, y + 16);
          }
        }
      }
      const makeLines = (vertices: number[], opacity: number) => {
        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const lineMaterial = new THREE.LineBasicMaterial({ color: '#67e8f9', transparent: true, opacity, depthWrite: false });
        const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
        composition.add(lines);
        extraResources.push(lineGeometry, lineMaterial);
        return lines;
      };
      const wireframe = makeLines(contours, 0.65);
      const network = makeLines(connections, 0.22);
      let previousLevel = effects.current;
      let revealStart = previousLevel >= 6 ? performance.now() / 1000 : -10;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const start = performance.now();
      const animate = (now: number) => {
        if (disposed || !geometry) return;
        const elapsed = (now - start) / 1000;
        const level = effects.current;
        if (level >= 6 && previousLevel < 6) revealStart = now / 1000;
        previousLevel = level;
        const reveal = level >= 6 && !reduced ? Math.min(1, (now / 1000 - revealStart) / 2.5) : 1;
        relief.visible = level >= 1;
        wireframe.visible = level >= 3 && reveal >= 1;
        network.visible = level >= 4 && reveal >= 1;
        reliefMaterial.opacity = reveal < 1 ? 0 : 0.28;
        if (material) {
          material.uniforms.hologram.value = level >= 2 ? 1 : 0;
          material.uniforms.mosaic.value = level >= 5 ? 1 : 0;
          material.uniforms.sweep.value = reveal;
          material.uniforms.time.value = reduced ? 0 : elapsed;
        }
        composition.rotation.y = level >= 7 && !reduced ? pointer.x * 0.055 : 0;
        composition.rotation.x = level >= 7 && !reduced ? pointer.y * 0.035 : 0;
        const progress = reduced ? 1 : Math.min(elapsed / 2.6, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const gust = 0.8 + 0.2 * Math.sin(elapsed * 0.75);
        for (let point = 0; point < flagWeights.length; point++) {
          const i = point * 3;
          for (let axis = 0; axis < 3; axis++) {
            positions[i + axis] = origins[i + axis] + (targets[i + axis] - origins[i + axis]) * ease;
          }
          if (level >= 1) positions[i + 2] += (colors[i] + colors[i + 1] + colors[i + 2]) / 3 * 0.18 * ease;
          if (reduced) continue;
          const weight = flagWeights[point];
          if (weight > 0) {
            const phase = weight * 8 - elapsed * 4.2 + flagRows[point] * 1.8;
            const wave = Math.sin(phase) + 0.3 * Math.sin(phase * 1.7 + elapsed);
            const amplitude = weight * gust * ease;
            positions[i] += Math.sin(phase + 0.8) * 0.035 * amplitude;
            positions[i + 1] += wave * 0.065 * amplitude;
            positions[i + 2] += wave * 0.18 * amplitude;
          } else {
            positions[i + 2] += Math.sin(elapsed + i * 0.1) * 0.025;
          }
        }
        geometry.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
        // Also redraw on resize when reduced motion is enabled.
        frame = requestAnimationFrame(animate);
      };
      animate(performance.now());

    };
    source.onerror = () => { if (!disposed) setFailed(true); };
    source.src = imageUrl;
    return () => {
      disposed = true;
      source.onload = null;
      source.onerror = null;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('pointermove', movePointer);
      extraResources.forEach((resource) => resource.dispose());
      renderer.setAnimationLoop(null);
      geometry?.dispose();
      material?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return <div ref={host} className="particle-building" role="img" aria-label="Edifício da imagem enviada, com bandeira do Brasil ondulando ao vento, formado por partículas">{failed && <p className="particle-fallback">Não foi possível carregar as partículas do edifício.</p>}</div>;
}
