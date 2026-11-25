import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { Room } from '@/types';
import { catalog } from '@/features/catalog/api';
import { bounds, outlineOf, polygonCentroid } from '../../lib/geometry';
import { usePlanner, type CameraMode } from '../../store/plannerStore';
import { Item3D } from './Item3D';
import { Room3D } from './Room3D';

interface Scene3DProps {
  /** Used by the capture page to freeze the camera. */
  interactive?: boolean;
  preserveDrawingBuffer?: boolean;
}

export function Scene3D({ interactive = true, preserveDrawingBuffer = false }: Scene3DProps) {
  const room = usePlanner((s) => s.room);
  if (!room) return null;
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 2]}
      camera={{ fov: 40, near: 0.05, far: 200, position: [8, 8, 10] }}
      gl={{ antialias: true, preserveDrawingBuffer }}
      onPointerMissed={(e) => e.button === 0 && usePlanner.getState().select(null)}
    >
      <color attach="background" args={['#e9e7e2']} />
      <fog attach="fog" args={['#e9e7e2', 24, 60]} />
      <Lights room={room} />
      <Suspense fallback={null}>
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={1.4} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
          <Lightformer intensity={0.6} position={[-6, 3, 4]} rotation-y={Math.PI / 2} scale={[10, 4, 1]} color="#fff3e2" />
          <Lightformer intensity={0.5} position={[6, 3, -4]} rotation-y={-Math.PI / 2} scale={[10, 4, 1]} color="#e8f0ff" />
        </Environment>
      </Suspense>
      <SceneContent room={room} interactive={interactive} />
    </Canvas>
  );
}

function Lights({ room }: { room: Room }) {
  const c = useMemo(() => polygonCentroid(outlineOf(room)), [room]);
  const b = useMemo(() => bounds(outlineOf(room)), [room]);
  const ext = Math.max(b.w, b.d) / 2 + 2;
  return (
    <>
      <hemisphereLight args={['#ffffff', '#d9cbb5', 0.55]} />
      <directionalLight
        position={[c[0] + 4, 9, c[1] + 6]}
        intensity={1.7}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-ext}
        shadow-camera-right={ext}
        shadow-camera-top={ext}
        shadow-camera-bottom={-ext}
        shadow-camera-near={1}
        shadow-camera-far={30}
      >
        <object3D attach="target" position={[c[0], 0, c[1]]} />
      </directionalLight>
    </>
  );
}

function SceneContent({ room, interactive }: { room: Room; interactive: boolean }) {
  const items = usePlanner((s) => s.items);
  const camera = usePlanner((s) => s.camera);
  const controls = useRef<OrbitControlsImpl>(null);
  const [dragging, setDragging] = useState(false);
  const products = catalog.map();

  return (
    <>
      <Room3D room={room} cutaway={camera !== 'eye'} />
      {items.map((it) => {
        const p = products.get(it.sku);
        return p ? <Item3D key={it.uid} item={it} product={p} onDragState={setDragging} /> : null;
      })}
      <OrbitControls
        ref={controls}
        makeDefault
        enabled={interactive && !dragging}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={camera === 'eye' ? Math.PI * 0.62 : Math.PI * 0.46}
        minDistance={camera === 'eye' ? 0.1 : 2.5}
        maxDistance={24}
        screenSpacePanning={false}
      />
      <CameraRig room={room} mode={camera} controls={controls} />
    </>
  );
}

/** Animates camera + target to a preset whenever the mode or room changes. */
function CameraRig({ room, mode, controls }: { room: Room; mode: CameraMode; controls: React.RefObject<OrbitControlsImpl | null> }) {
  const { camera, size } = useThree();
  const anim = useRef<{ pos: Vector3; target: Vector3; t: number } | null>(null);

  const preset = useMemo(() => {
    const poly = outlineOf(room);
    const c = polygonCentroid(poly);
    const b = bounds(poly);
    const aspect = size.width / Math.max(size.height, 1);
    const dist = (Math.max(b.w, b.d) * 1.05) / Math.min(1, aspect * 0.9) + 2;
    const target = new Vector3(c[0], 0.4, c[1]);
    if (mode === 'top') return { pos: new Vector3(c[0], Math.max(b.w, b.d) * 1.7 + 3, c[1] + 0.01), target: new Vector3(c[0], 0, c[1]) };
    if (mode === 'eye') return { pos: new Vector3(b.minX + 0.6, 1.6, b.maxZ - 0.6), target: new Vector3(c[0] + 0.5, 1.1, c[1] - 0.5) };
    return { pos: new Vector3(c[0] + dist * 0.55, dist * 0.78, c[1] + dist * 0.8), target };
  }, [room, mode, size.width, size.height]);

  useEffect(() => {
    anim.current = { pos: preset.pos.clone(), target: preset.target.clone(), t: 0 };
  }, [preset]);

  useFrame((_, dt) => {
    const a = anim.current;
    const ctl = controls.current;
    if (!a || !ctl) return;
    a.t = Math.min(1, a.t + dt / 0.9);
    const k = 1 - Math.pow(1 - a.t, 3);
    camera.position.lerp(a.pos, k * 0.25 + (a.t === 1 ? 1 : 0));
    ctl.target.lerp(a.target, k * 0.25 + (a.t === 1 ? 1 : 0));
    ctl.update();
    if (a.t === 1) anim.current = null;
  });

  return null;
}
