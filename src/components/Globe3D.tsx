import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { CompanyResult, Coordinates } from '@/lib/types';
import { BRAZIL_STATES, normalizeBrazilState } from '@/lib/brazilStates';

const EARTH_RADIUS = 2;

// Brighter Earth texture (day map)
const EARTH_TEXTURE_URL =
  'https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-base/january/world.200401.3x5400x2700.jpg';
const COUNTRY_BORDERS_URL =
  'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';
const BRAZIL_STATE_BORDERS_URL =
  'https://cdn.jsdelivr.net/gh/henriquemalvar/br-geojson@main/dist/estados.geojson';
const EARTH_CLOUD_TEXTURE_URL =
  'https://clouds.matteason.co.uk/images/2048x1024/clouds-alpha.png';

type GeoFeatureCollection = {
  features: Array<{
    geometry: { type: string; coordinates: unknown };
    properties?: { sigla?: string };
  }>;
};

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

// Convert lat/lng to equirectangular texture pixel coordinates
function latLngToPixel(lat: number, lng: number, width: number, height: number): [number, number] {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return [x, y];
}

function forEachGeoJsonRing(coordinates: unknown, visit: (ring: unknown[]) => void): void {
  if (!Array.isArray(coordinates)) return;
  if (coordinates.length > 0 && Array.isArray(coordinates[0]) &&
    typeof coordinates[0][0] === 'number') {
    visit(coordinates);
    return;
  }
  coordinates.forEach((child) => forEachGeoJsonRing(child, visit));
}

function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses = (yi > lat) !== (yj > lat) &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function findStateInteriorPoint(
  data: GeoFeatureCollection | null,
  stateCode: string | null
): Coordinates | null {
  if (!data || !stateCode) return null;
  const feature = data.features.find(
    (item) => item.properties?.sigla?.toUpperCase() === stateCode.toUpperCase()
  );
  if (!feature) return null;

  const polygons = feature.geometry.type === 'Polygon'
    ? [feature.geometry.coordinates as number[][][]]
    : feature.geometry.type === 'MultiPolygon'
      ? feature.geometry.coordinates as number[][][][]
      : [];
  const outerRing = polygons
    .map((polygon) => polygon[0])
    .filter((ring): ring is number[][] => Array.isArray(ring) && ring.length > 2)
    .sort((a, b) => Math.abs(polygonArea(b)) - Math.abs(polygonArea(a)))[0];
  if (!outerRing) return null;

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let sumLng = 0;
  let sumLat = 0;
  outerRing.forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    sumLng += lng;
    sumLat += lat;
  });

  const average = { lat: sumLat / outerRing.length, lng: sumLng / outerRing.length };
  if (pointInRing(average.lng, average.lat, outerRing)) return average;

  // For concave states, scan inside the outline and pick the point furthest from its edge.
  let best: Coordinates | null = null;
  let bestDistance = -1;
  const steps = 80;
  for (let y = 1; y < steps; y++) {
    const lat = minLat + ((maxLat - minLat) * y) / steps;
    for (let x = 1; x < steps; x++) {
      const lng = minLng + ((maxLng - minLng) * x) / steps;
      if (!pointInRing(lng, lat, outerRing)) continue;
      let nearestEdge = Infinity;
      for (let i = 1; i < outerRing.length; i++) {
        const [x1, y1] = outerRing[i - 1];
        const [x2, y2] = outerRing[i];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const edgeLengthSquared = dx * dx + dy * dy;
        const t = edgeLengthSquared === 0
          ? 0
          : Math.max(0, Math.min(1, ((lng - x1) * dx + (lat - y1) * dy) / edgeLengthSquared));
        const edgeDistance = Math.hypot(lng - (x1 + t * dx), lat - (y1 + t * dy));
        nearestEdge = Math.min(nearestEdge, edgeDistance);
      }
      if (nearestEdge > bestDistance) {
        bestDistance = nearestEdge;
        best = { lat, lng };
      }
    }
  }
  return best ?? average;
}

function polygonArea(ring: number[][]): number {
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

function GlobeCamera({ focusPoint }: { focusPoint: Coordinates | null }) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 0, 5.5));
  const desiredFov = useRef(45);
  const isAnimating = useRef(false);

  useEffect(() => {
    targetPosition.current.copy(
      focusPoint
        ? latLngToVector3(focusPoint.lat, focusPoint.lng, 2.65)
        : new THREE.Vector3(0, 0, 5.5)
    );
    desiredFov.current = focusPoint ? 32 : 45;
    isAnimating.current = true;
  }, [focusPoint]);

  useFrame((_, delta) => {
    if (!isAnimating.current) return;

    const blend = 1 - Math.exp(-delta * 2.8);
    const currentDirection = camera.position.clone().normalize();
    const targetDirection = targetPosition.current.clone().normalize();
    const radius = THREE.MathUtils.damp(
      camera.position.length(),
      targetPosition.current.length(),
      2.8,
      delta
    );
    camera.position
      .copy(currentDirection.lerp(targetDirection, blend).normalize())
      .multiplyScalar(radius);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.damp(camera.fov, desiredFov.current, 2.8, delta);
      camera.updateProjectionMatrix();
    }
    camera.lookAt(0, 0, 0);

    const fovSettled = !(camera instanceof THREE.PerspectiveCamera) ||
      Math.abs(camera.fov - desiredFov.current) < 0.08;
    if (camera.position.distanceTo(targetPosition.current) < 0.012 && fovSettled) {
      camera.position.copy(targetPosition.current);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = desiredFov.current;
        camera.updateProjectionMatrix();
      }
      camera.lookAt(0, 0, 0);
      isAnimating.current = false;
    }
  });
  return null;
}

function drawCountryBorders(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: GeoFeatureCollection | null
) {
  if (!data) return;

  ctx.strokeStyle = 'rgba(18, 36, 58, 0.9)';
  ctx.lineWidth = Math.max(0.4, width / 5000);
  ctx.lineJoin = 'round';

  const drawRing = (ring: unknown[]) => {
    let previous: [number, number] | null = null;
    for (const point of ring) {
      if (!Array.isArray(point) || point.length < 2) continue;
      const [lng, lat] = point as [number, number];
      if (previous && Math.abs(lng - previous[0]) <= 180) {
        const [x1, y1] = latLngToPixel(previous[1], previous[0], width, height);
        const [x2, y2] = latLngToPixel(lat, lng, width, height);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      previous = [lng, lat];
    }
  };

  data.features.forEach((feature) =>
    forEachGeoJsonRing(feature.geometry.coordinates, drawRing)
  );
}

function lightenOceans(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const image = ctx.getImageData(0, 0, width, height);
  const pixels = image.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const red = pixels[i];
    const green = pixels[i + 1];
    const blue = pixels[i + 2];
    const isOcean = blue > 65 && blue > red * 1.12 && green > red * 1.04;
    if (!isOcean) continue;

    // Blend water toward a brighter blue without ever darkening a channel.
    pixels[i] = red + Math.max(0, 125 - red) * 0.42;
    pixels[i + 1] = green + Math.max(0, 195 - green) * 0.42;
    pixels[i + 2] = blue + Math.max(0, 255 - blue) * 0.42;
  }

  ctx.putImageData(image, 0, 0);
}

// Draw official state polygons and highlight the CNPJ's state.
function drawStatesOnTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  highlightState: string | null,
  data: GeoFeatureCollection | null,
  isActive: boolean
) {
  if (data) {
    for (const feature of data.features) {
      const isHighlighted = feature.properties?.sigla?.toUpperCase() === highlightState?.toUpperCase();
      ctx.beginPath();
      forEachGeoJsonRing(feature.geometry.coordinates, (ring) => {
        let previous: [number, number] | null = null;
        for (const point of ring) {
          if (!Array.isArray(point) || point.length < 2) continue;
          const [lng, lat] = point as [number, number];
          if (previous && Math.abs(lng - previous[0]) > 180) {
            ctx.closePath();
            previous = [lng, lat];
            continue;
          }
          const [x, y] = latLngToPixel(lat, lng, width, height);
          if (!previous) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          previous = [lng, lat];
        }
        ctx.closePath();
      });

      if (isHighlighted) {
        ctx.fillStyle = isActive ? 'rgba(34, 197, 94, 0.68)' : 'rgba(239, 68, 68, 0.68)';
        ctx.fill('evenodd');
      }
      ctx.strokeStyle = isHighlighted
        ? isActive ? 'rgba(74, 222, 128, 0.72)' : 'rgba(248, 113, 113, 0.72)'
        : 'rgba(210, 224, 236, 0.42)';
      ctx.lineWidth = isHighlighted ? Math.max(1.2, width / 2200) : Math.max(0.45, width / 5000);
      ctx.shadowColor = isHighlighted ? isActive ? 'rgba(34, 197, 94, 0.45)' : 'rgba(239, 68, 68, 0.45)' : 'transparent';
      ctx.shadowBlur = isHighlighted ? 10 : 0;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  // State abbreviations follow the globe texture and remain readable when zoomed in.
  const baseFontSize = Math.max(14, Math.round(width / 330));
  for (const state of BRAZIL_STATES) {
    const isHighlighted = state.sigla === highlightState?.toUpperCase();
    const [x, y] = latLngToPixel(state.lat, state.lng, width, height);
    const fontSize = isHighlighted ? Math.round(baseFontSize * 1.5) : baseFontSize;
    ctx.font = `700 ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(4, fontSize * 0.35);
    ctx.strokeStyle = 'rgba(3, 15, 28, 0.95)';
    ctx.strokeText(state.sigla, x, y);
    ctx.fillStyle = isHighlighted
      ? isActive ? '#86efac' : '#fca5a5'
      : '#f8fbff';
    ctx.shadowColor = isHighlighted ? isActive ? '#22c55e' : '#ef4444' : 'transparent';
    ctx.shadowBlur = isHighlighted ? fontSize * 1.5 : 0;
    ctx.fillText(state.sigla, x, y);
    ctx.shadowBlur = 0;
  }
}

interface GlobeProps {
  coords: Coordinates | null;
  highlightState: string | null;
  isActive: boolean;
  cloudsEnabled: boolean;
  companiesEnabled: boolean;
  consultedCompanies: CompanyResult[];
  onCompanySelect: (company: CompanyResult) => void;
}

function companyStatusColor(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized.includes('ATIVA')) return '#34d399';
  if (normalized.includes('BAIXADA')) return '#f87171';
  if (normalized.includes('SUSPENSA')) return '#fbbf24';
  if (normalized.includes('INAPTA')) return '#a78bfa';
  return '#cbd5e1';
}

function vector3ToLatLng(point: THREE.Vector3): Coordinates {
  const lat = Math.asin(THREE.MathUtils.clamp(point.y, -1, 1)) * (180 / Math.PI);
  const rawLng = (Math.atan2(point.z, -point.x) * (180 / Math.PI)) - 180;
  const lng = ((rawLng + 180) % 360 + 360) % 360 - 180;
  return { lat, lng };
}

function isInsideState(
  lat: number,
  lng: number,
  stateCode: string | null,
  stateBorders: GeoFeatureCollection | null
): boolean {
  if (!stateCode || !stateBorders) return true;
  const feature = stateBorders.features.find(
    (item) => item.properties?.sigla?.toUpperCase() === stateCode
  );
  if (!feature) return true;

  const polygons = feature.geometry.type === 'Polygon'
    ? [feature.geometry.coordinates as number[][][]]
    : feature.geometry.type === 'MultiPolygon'
      ? feature.geometry.coordinates as number[][][][]
      : [];
  return polygons.some((polygon) => polygon[0] && pointInRing(lng, lat, polygon[0]));
}

function CompanyMarker({
  company,
  position,
  onCompanySelect,
}: {
  company: CompanyResult;
  position: THREE.Vector3;
  onCompanySelect: (company: CompanyResult) => void;
}) {
  const color = companyStatusColor(company.data.situacao_cadastral || '');

  return (
    <group position={position}>
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          onCompanySelect(company);
        }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <sphereGeometry args={[0.014, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.007, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.003, 12, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}

function CompanyMarkers({
  companies,
  stateBorders,
  highlightState,
  onCompanySelect,
}: {
  companies: CompanyResult[];
  stateBorders: GeoFeatureCollection | null;
  highlightState: string | null;
  onCompanySelect: (company: CompanyResult) => void;
}) {
  const selectedStateCode = normalizeBrazilState(highlightState);
  const locatedCompanies = companies.filter((company) => (
    company.coordinates &&
    (!selectedStateCode || normalizeBrazilState(company.data.endereco.uf) === selectedStateCode)
  ));
  const clusters = new Map<string, CompanyResult[]>();
  locatedCompanies.forEach((company) => {
    const { lat, lng } = company.coordinates!;
    const state = normalizeBrazilState(company.data.endereco.uf) ?? '';
    const key = `${state}:${lat.toFixed(2)},${lng.toFixed(2)}`;
    clusters.set(key, [...(clusters.get(key) ?? []), company]);
  });

  const markers: Array<{ company: CompanyResult; position: THREE.Vector3 }> = [];
  clusters.forEach((cluster) => {
    const { lat, lng } = cluster[0].coordinates!;
    const basePoint = latLngToVector3(lat, lng, 1).normalize();
    const stateCode = normalizeBrazilState(cluster[0].data.endereco.uf);
    const positions = [basePoint.clone()];
    const east = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), basePoint);
    if (east.lengthSq() < 0.0001) east.set(1, 0, 0);
    east.normalize();
    const north = new THREE.Vector3().crossVectors(basePoint, east).normalize();

    for (let index = 1; index < cluster.length; index += 1) {
      let selected = basePoint.clone();
      let found = false;
      // Keep offsets short and choose only positions that stay within the UF.
      for (const spread of [0.004, 0.007, 0.01]) {
        for (let step = 0; step < 36; step += 1) {
          const angle = ((step + index * 7) * Math.PI * 2) / 36;
          const candidate = basePoint.clone()
            .addScaledVector(east, Math.cos(angle) * spread)
            .addScaledVector(north, Math.sin(angle) * spread)
            .normalize();
          const coords = vector3ToLatLng(candidate);
          const separated = positions.every((point) => point.distanceTo(candidate) >= 0.006);
          if (separated && isInsideState(coords.lat, coords.lng, stateCode, stateBorders)) {
            selected = candidate;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      positions.push(selected);
    }

    cluster.forEach((company, index) => {
      markers.push({
        company,
        position: positions[index].clone().multiplyScalar(EARTH_RADIUS + 0.004),
      });
    });
  });

  return (
    <group>
      {markers.map(({ company, position }) => (
        <CompanyMarker
          key={company.data.cnpj}
          company={company}
          position={position}
          onCompanySelect={onCompanySelect}
        />
      ))}
    </group>
  );
}

function CloudsLayer() {
  const cloudsRef = useRef<THREE.Mesh>(null);
  const cloudTexture = useLoader(THREE.TextureLoader, EARTH_CLOUD_TEXTURE_URL);

  useFrame((_, delta) => {
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.012;
  });

  return (
    <mesh ref={cloudsRef} scale={1.008} renderOrder={2}>
      <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
      <meshBasicMaterial
        map={cloudTexture}
        transparent
        opacity={0.2}
        depthWrite={false}
        side={THREE.FrontSide}
        toneMapped={false}
      />
    </mesh>
  );
}

function Globe({
  coords,
  highlightState,
  isActive,
  cloudsEnabled,
  companiesEnabled,
  consultedCompanies,
  onCompanySelect,
}: GlobeProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const [customTexture, setCustomTexture] = useState<THREE.CanvasTexture | null>(null);
  const [countryBorders, setCountryBorders] = useState<GeoFeatureCollection | null>(null);
  const [stateBorders, setStateBorders] = useState<GeoFeatureCollection | null>(null);
  const stateCode = normalizeBrazilState(highlightState);
  const stateCenter = useMemo(
    () => findStateInteriorPoint(stateBorders, stateCode),
    [stateBorders, stateCode]
  );
  const fallbackCenter = useMemo(
    () => BRAZIL_STATES.find((state) => state.sigla === stateCode) ?? null,
    [stateCode]
  );
  // Use the known in-state reference point to center the camera on the selected state.
  // The polygon-derived point remains a fallback for any UF without a centroid entry.
  const focusPoint = stateCode
    ? fallbackCenter ?? stateCenter ?? coords
    : coords;

  // Load original Earth textures
  const earthMap = useLoader(THREE.TextureLoader, EARTH_TEXTURE_URL);

  useEffect(() => {
    let cancelled = false;
    fetch(COUNTRY_BORDERS_URL)
      .then((response) => {
        if (!response.ok) throw new Error('Não foi possível carregar as fronteiras dos países.');
        return response.json() as Promise<GeoFeatureCollection>;
      })
      .then((data) => {
        if (!cancelled) setCountryBorders(data);
      })
      .catch(() => {
        if (!cancelled) setCountryBorders(null);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(BRAZIL_STATE_BORDERS_URL)
      .then((response) => {
        if (!response.ok) throw new Error('Não foi possível carregar os limites estaduais.');
        return response.json() as Promise<GeoFeatureCollection>;
      })
      .then((data) => {
        if (!cancelled) setStateBorders(data);
      })
      .catch(() => {
        if (!cancelled) setStateBorders(null);
      });
    return () => { cancelled = true; };
  }, []);

  // Build a canvas-based texture with state borders drawn onto the Earth image
  useEffect(() => {
    if (!earthMap.image) return;

    const img = earthMap.image as HTMLImageElement;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 2048;
    canvas.height = img.naturalHeight || 1024;
    const ctx = canvas.getContext('2d')!;

    // Draw the Earth image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Add a mild lift to the whole map, then brighten the ocean a little more.
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(155, 205, 255, 0.18)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    lightenOceans(ctx, canvas.width, canvas.height);

    // Draw international boundaries first, then Brazilian state boundaries.
    drawCountryBorders(ctx, canvas.width, canvas.height, countryBorders);
    drawStatesOnTexture(ctx, canvas.width, canvas.height, stateCode, stateBorders, isActive);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    setCustomTexture(texture);

    return () => {
      texture.dispose();
    };
  }, [earthMap, stateCode, countryBorders, stateBorders, isActive]);

  // The globe spins while idle; reset that rotation before focusing so the
  // selected state's texture coordinates line up with the camera direction.
  useEffect(() => {
    if (focusPoint && earthRef.current) {
      earthRef.current.rotation.set(0, 0, 0);
    }
  }, [focusPoint]);

  return (
    <group>
      {/* Earth sphere with custom texture (Earth + state borders painted on) */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
        <meshBasicMaterial
          map={customTexture ?? earthMap}
          color="#ffffff"
          toneMapped={false}
        />
      </mesh>

      {cloudsEnabled && <CloudsLayer />}
      {companiesEnabled && (
        <CompanyMarkers
          companies={consultedCompanies}
          stateBorders={stateBorders}
          highlightState={highlightState}
          onCompanySelect={onCompanySelect}
        />
      )}

      {/* Soft blue rim glow around the Earth */}
      <mesh scale={1.025}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <shaderMaterial
          transparent
          side={THREE.FrontSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          uniforms={{ glowColor: { value: new THREE.Color('#3b9dff') } }}
          vertexShader={`
            varying vec3 vNormal;
            varying vec3 vViewDirection;
            void main() {
              vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
              vNormal = normalize(normalMatrix * normal);
              vViewDirection = normalize(-viewPosition.xyz);
              gl_Position = projectionMatrix * viewPosition;
            }
          `}
          fragmentShader={`
            uniform vec3 glowColor;
            varying vec3 vNormal;
            varying vec3 vViewDirection;
            void main() {
              float rim = 1.0 - max(dot(normalize(vNormal), normalize(vViewDirection)), 0.0);
              float glow = pow(rim, 2.6);
              gl_FragColor = vec4(glowColor, glow * 0.9);
            }
          `}
        />
      </mesh>

      <GlobeCamera focusPoint={focusPoint} />
    </group>
  );
}

interface Globe3DProps {
  coords: Coordinates | null;
  highlightState?: string | null;
  isActive?: boolean;
  cloudsEnabled?: boolean;
  companiesEnabled?: boolean;
  consultedCompanies?: CompanyResult[];
  onCompanySelect?: (company: CompanyResult) => void;
}

export default function Globe3D({
  coords,
  highlightState = null,
  isActive = false,
  cloudsEnabled = false,
  companiesEnabled = false,
  consultedCompanies = [],
  onCompanySelect = () => {},
}: Globe3DProps) {
  return (
    <>
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        className="!absolute inset-0"
        gl={{ antialias: true, alpha: true }}
      >
      {/* Brighter lighting */}
      <ambientLight intensity={0.85} />
      <directionalLight position={[5, 3, 5]} intensity={1.8} />
      <directionalLight position={[-3, -2, -5]} intensity={0.55} color="#a8d4ff" />

      <Stars
        radius={80}
        depth={50}
        count={3000}
        factor={4}
        saturation={0}
        fade
        speed={0.3}
      />

      <Globe
        coords={coords}
        highlightState={highlightState}
        isActive={isActive}
        cloudsEnabled={cloudsEnabled}
        companiesEnabled={companiesEnabled}
        consultedCompanies={consultedCompanies}
        onCompanySelect={onCompanySelect}
      />

      <OrbitControls
        enablePan={false}
        minDistance={2.3}
        maxDistance={9}
        autoRotate={false}
        enableDamping
        dampingFactor={0.05}
      />
      </Canvas>
      <div className="pointer-events-none absolute bottom-2 right-3 z-10 text-[9px] text-slate-500/80">
        Nuvens: contém dados EUMETSAT modificados
      </div>
    </>
  );
}
