import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { Suspense, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { Vector3, type Group } from 'three';
import type { PlacedItem, Room } from '@/types';
import { catalog } from '@/features/catalog/api';
import { FurnitureModel } from '@/features/furniture/FurnitureModel';
import { bounds, DEG, outlineOf, polygonCentroid } from '../../lib/geometry';
import { Room3D } from './Room3D';
import { isBehind } from './Item3D';
import s from './scene.module.css';

interface LookSceneProps {
  room: Room;
  items: PlacedItem[];
  /** sku:variant → marker number. */
  markers: Map<string, number>;
  active: string | null;
  onHover: (key: string | null) => void;
}

interface Marker {
  key: string;
  n: number;
  label: string;
  /** World anchor above the item. */
  at: Vector3;
}

/** Read-only room render with numbered hotspots for "shop the look". */
export function LookScene({ room, items, markers, active, onHover }: LookSceneProps) {
  const poly = outlineOf(room);
  const c = polygonCentroid(poly);
  const b = bounds(poly);
  const dist = Math.max(b.w, b.d) * 1.25 + 2;
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  // One marker per product line, anchored on its first floor-standing instance.
  const list = useMemo<Marker[]>(() => {
    const out: Marker[] = [];
    const seen = new Set<string>();
    for (const it of items) {
      const p = catalog.bySku(it.sku);
      const key = `${it.sku}:${it.variant}`;
      const n = markers.get(key);
      if (!p || n == null || seen.has(key) || p.rules.placement === 'wall') continue;
      seen.add(key);
      out.push({ key, n, label: p.name, at: new Vector3(it.position[0], it.elevation + p.dimensions.h + 0.12, it.position[1]) });
    }
    return out;
  }, [items, markers]);

  return (
    <div className={s.lookRoot}>
      <Canvas shadows="percentage" dpr={[1, 2]} camera={{ position: [c[0] + dist * 0.5, dist * 0.8, c[1] + dist * 0.85], fov: 38 }}>
        <color attach="background" args={['#ebe9e4']} />
        <hemisphereLight args={['#ffffff', '#d9cbb5', 0.55]} />
        <directionalLight position={[c[0] + 4, 9, c[1] + 6]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
        <Suspense fallback={null}>
          <Environment resolution={128} frames={1}>
            <Lightformer intensity={1.3} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
          </Environment>
        </Suspense>
        <Room3D room={room} />
        {items.map((it) => {
          const p = catalog.bySku(it.sku);
          if (!p) return null;
          return (
            <StaticItem key={it.uid} item={it} wall={p.rules.placement === 'wall'}>
              <FurnitureModel product={p} variant={it.variant} />
            </StaticItem>
          );
        })}
        <OrbitControls makeDefault target={[c[0], 0.3, c[1]]} enableDamping maxPolarAngle={Math.PI * 0.45} minDistance={3} maxDistance={20} enablePan={false} />
        <Projector markers={list} refs={refs} />
      </Canvas>
      <div className={s.overlay}>
        {list.map((m, i) => (
          <button
            key={m.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={s.marker}
            data-active={active === m.key || undefined}
            onPointerEnter={() => onHover(m.key)}
            onPointerLeave={() => onHover(null)}
            onFocus={() => onHover(m.key)}
            onBlur={() => onHover(null)}
            aria-label={m.label}
          >
            <span className={s.markerDot} style={{ animationDelay: `${i * 60}ms` }}>
              {m.n}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Projects marker anchors to screen space every frame and moves the DOM buttons. */
function Projector({ markers, refs }: { markers: Marker[]; refs: RefObject<Array<HTMLButtonElement | null>> }) {
  const { camera, size } = useThree();
  const v = useMemo(() => new Vector3(), []);
  useFrame(() => {
    markers.forEach((m, i) => {
      const el = refs.current?.[i];
      if (!el) return;
      v.copy(m.at).project(camera);
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      el.style.visibility = v.z > 1 ? 'hidden' : 'visible';
    });
  });
  return null;
}

function StaticItem({ item, wall, children }: { item: PlacedItem; wall: boolean; children: ReactNode }) {
  const ref = useRef<Group>(null);
  useFrame(({ camera }, dt) => {
    if (!wall || !ref.current) return;
    const target = isBehind(camera.position, item.position, item.rotationY) ? 0 : 1;
    const g = ref.current;
    g.scale.setScalar(g.scale.x + (target - g.scale.x) * Math.min(1, dt * 10));
  });
  return (
    <group ref={ref} position={[item.position[0], item.elevation, item.position[1]]} rotation={[0, item.rotationY * DEG, 0]}>
      {children}
    </group>
  );
}
