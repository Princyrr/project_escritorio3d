import { Component, useEffect, useRef, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, RoundedBox } from '@react-three/drei';
import { Group, MathUtils } from 'three';

export interface MouseRobotProps {
  className?: string;
  tracking?: boolean;
}

function Shell({ position, scale, chrome = false }: {
  position: [number, number, number];
  scale: [number, number, number];
  chrome?: boolean;
}) {
  return <RoundedBox args={[1, 1, 1]} radius={0.23} smoothness={4} position={position} scale={scale}>
    <meshStandardMaterial color={chrome ? '#b8bec5' : '#17191c'} metalness={chrome ? 1 : 0.85} roughness={chrome ? 0.12 : 0.25} />
  </RoundedBox>;
}

function Joint({ position, radius = 0.13 }: { position: [number, number, number]; radius?: number }) {
  return <mesh position={position}><sphereGeometry args={[radius, 24, 20]} /><meshStandardMaterial color="#747b85" metalness={1} roughness={0.2} /></mesh>;
}

function Robot({ tracking }: { tracking: boolean }) {
  const head = useRef<Group>(null);
  const target = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const center = () => { target.current = { x: 0, y: 0 }; };
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      target.current = {
        x: MathUtils.clamp(event.clientX / window.innerWidth * 2 - 1, -1, 1),
        y: MathUtils.clamp(event.clientY / window.innerHeight * 2 - 1, -1, 1),
      };
    };
    window.addEventListener('pointermove', move);
    document.documentElement.addEventListener('pointerleave', center);
    window.addEventListener('blur', center);
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', center);
      window.removeEventListener('blur', center);
    };
  }, []);
  useFrame((_, delta) => {
    if (!head.current) return;
    head.current.rotation.y = MathUtils.damp(head.current.rotation.y, tracking ? target.current.x * 0.65 : 0, 7, delta);
    head.current.rotation.x = MathUtils.damp(head.current.rotation.x, tracking ? target.current.y * 0.32 : 0, 7, delta);
    head.current.rotation.z = MathUtils.damp(head.current.rotation.z, tracking ? -target.current.x * 0.06 : 0, 7, delta);
  });
  return <group position={[0, -0.12, 0]}>
    <group ref={head} position={[0, 1.38, 0]}>
      <Shell position={[0, 0.43, 0]} scale={[0.86, 1, 0.72]} chrome />
      <Shell position={[0, 0.43, 0.34]} scale={[0.69, 0.76, 0.16]} />
      {[-1, 1].map(side => <group key={side}>
        <Shell position={[side * 0.43, 0.42, 0]} scale={[0.09, 0.49, 0.37]} />
        {[0, 1, 2].map(row => [0, 1, 2].map(col => <mesh key={`${row}-${col}`} position={[side * 0.16 + (col - 1) * 0.033, 0.47 + row * 0.033, 0.429]}>
          <sphereGeometry args={[0.009, 8, 8]} /><meshBasicMaterial color="#dcfaff" />
        </mesh>))}
      </group>)}
    </group>
    <Shell position={[0, 1.28, 0]} scale={[0.2, 0.34, 0.22]} chrome />
    <mesh position={[0, 0.46, 0]}><cylinderGeometry args={[0.61, 0.34, 1.45, 8]} /><meshStandardMaterial color="#17191c" metalness={0.85} roughness={0.28} /></mesh>
    <Shell position={[0, 0.61, 0.27]} scale={[0.83, 1.05, 0.24]} />
    <mesh position={[0, 0.91, 0.41]}><circleGeometry args={[0.045, 24]} /><meshBasicMaterial color="#b8f3f5" /></mesh>
    {[-1, 1].map(side => <group key={side}>
      <Joint position={[side * 0.67, 0.97, 0]} radius={0.2} />
      <group position={[side * 0.82, 0.64, 0]} rotation={[0, 0, side * 0.18]}>
        <Shell position={[0, 0, 0]} scale={[0.36, 0.78, 0.4]} />
        <Joint position={[0, -0.43, 0]} />
        <group position={[0, -0.44, 0.23]} rotation={[-0.95, 0, -side * 0.3]}>
          <Shell position={[0, -0.17, 0]} scale={[0.35, 0.54, 0.36]} />
          <Shell position={[0, -0.49, 0]} scale={[0.28, 0.24, 0.18]} chrome />
          {[0, 1, 2, 3].map(finger => <Shell key={finger} position={[(finger - 1.5) * 0.067, -0.65, 0.04]} scale={[0.055, 0.25, 0.085]} />)}
        </group>
      </group>
      <Joint position={[side * 0.25, -0.43, 0]} radius={0.18} />
      <Shell position={[side * 0.25, -0.78, 0]} scale={[0.35, 0.61, 0.38]} />
      <Joint position={[side * 0.25, -1.16, 0]} />
      <Shell position={[side * 0.25, -1.55, 0]} scale={[0.38, 0.66, 0.4]} />
      <Shell position={[side * 0.25, -1.94, 0.12]} scale={[0.42, 0.2, 0.69]} />
    </group>)}
    <Shell position={[0, -0.36, 0]} scale={[0.65, 0.21, 0.42]} chrome />
  </group>;
}

class RobotBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <p role="status" className="p-8 text-center text-slate-600">Não foi possível exibir o robô. Verifique se a aceleração gráfica está ativada no navegador.</p> : this.props.children;
  }
}

/** Self-contained robot. Tracks the pointer across the page; no external model required. */
export default function MouseRobot({ className = '', tracking = true }: MouseRobotProps) {
  const reducedMotion = useRef(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  return <div className={`h-[min(72vh,760px)] min-h-[360px] w-full ${className}`} role="img" aria-label="Robô preto e cromado em 3D cuja cabeça acompanha o mouse">
    <RobotBoundary>
      <Canvas camera={{ position: [0, 0.25, 8.6], fov: 34 }} dpr={[1, 1.75]} fallback={<p>Visualização 3D indisponível neste navegador.</p>}>
        <color attach="background" args={['#e5e5e3']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 5, 5]} intensity={3} />
        <Environment resolution={128}>
          <Lightformer position={[-3, 2, 4]} scale={[2, 6, 1]} intensity={4} />
          <Lightformer position={[3, 1, 3]} scale={[1, 5, 1]} intensity={3} />
          <Lightformer position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[5, 5, 1]} intensity={2} />
        </Environment>
        <Robot tracking={tracking && !reducedMotion.current} />
      </Canvas>
    </RobotBoundary>
  </div>;
}
