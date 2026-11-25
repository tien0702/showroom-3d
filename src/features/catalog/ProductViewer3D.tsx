import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import type { Product } from '@/types';
import { FurnitureModel } from '@/features/furniture/FurnitureModel';
import s from './catalog.module.css';

interface Props {
  product: Product;
  variant: string;
  autoRotate?: boolean;
  preserveDrawingBuffer?: boolean;
  /** Camera azimuth in degrees, used by thumbnail capture. */
  azimuth?: number;
  background?: string | null;
}

/** Turntable viewer: true-scale model, soft contact shadow, orbit + zoom. */
export function ProductViewer3D({ product, variant, autoRotate = true, preserveDrawingBuffer, azimuth = 35, background = null }: Props) {
  const { w, d, h } = product.dimensions;
  const r = Math.max(w, d, h);
  const dist = r * 1.9 + 0.6;
  const az = (azimuth * Math.PI) / 180;
  const flat = product.rules.placement === 'wall';
  const pos: [number, number, number] = flat
    ? [Math.sin(az * 0.6) * dist, h / 2 + 0.3, Math.cos(az * 0.6) * dist]
    : [Math.sin(az) * dist, h * 0.5 + dist * 0.42, Math.cos(az) * dist];
  return (
    <div className={s.viewer}>
      <Canvas shadows="percentage" dpr={[1, 2]} camera={{ position: pos, fov: 30 }} gl={{ preserveDrawingBuffer, alpha: background === null }}>
        {background && <color attach="background" args={[background]} />}
        <hemisphereLight args={['#ffffff', '#d9cbb5', 0.5]} />
        <directionalLight position={[3, 6, 4]} intensity={1.35} castShadow shadow-mapSize={[1024, 1024]} />
        <Suspense fallback={null}>
          <Environment resolution={128} frames={1}>
            <Lightformer intensity={1.2} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
            <Lightformer intensity={0.7} position={[-5, 2, 3]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} color="#fff3e2" />
            <Lightformer intensity={0.5} position={[5, 2, -3]} rotation-y={-Math.PI / 2} scale={[8, 4, 1]} />
          </Environment>
        </Suspense>
        <group position={[0, flat ? 0 : 0, 0]}>
          <FurnitureModel product={product} variant={variant} />
        </group>
        <ContactShadows position={[0, 0.001, 0]} opacity={0.45} scale={r * 3} blur={2.4} far={r} resolution={512} frames={preserveDrawingBuffer ? 1 : Infinity} />
        <OrbitControls
          makeDefault
          target={[0, flat ? h / 2 : h * 0.4, 0]}
          autoRotate={autoRotate}
          autoRotateSpeed={0.9}
          enableDamping
          enablePan={false}
          minDistance={r * 1.1}
          maxDistance={r * 4}
          maxPolarAngle={Math.PI * 0.49}
        />
      </Canvas>
    </div>
  );
}
