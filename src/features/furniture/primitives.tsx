import { RoundedBox } from '@react-three/drei';
import type { Material } from 'three';

type V3 = [number, number, number];

interface BoxProps {
  /** Centre position. */
  p: V3;
  /** Size w, h, d. */
  s: V3;
  m: Material;
  r?: number;
  rot?: V3;
}

/** Box or rounded box that casts and receives shadows. */
export function Box({ p, s, m, r = 0, rot }: BoxProps) {
  if (r > 0) {
    const radius = Math.min(r, Math.min(...s) / 2 - 0.001);
    return (
      <RoundedBox args={s} radius={Math.max(radius, 0.001)} smoothness={3} position={p} rotation={rot} material={m} castShadow receiveShadow />
    );
  }
  return (
    <mesh position={p} rotation={rot} material={m} castShadow receiveShadow>
      <boxGeometry args={s} />
    </mesh>
  );
}

interface CylProps {
  p: V3;
  r: number;
  h: number;
  m: Material;
  rTop?: number;
  seg?: number;
  rot?: V3;
}

export function Cyl({ p, r, h, m, rTop, seg = 32, rot }: CylProps) {
  return (
    <mesh position={p} rotation={rot} material={m} castShadow receiveShadow>
      <cylinderGeometry args={[rTop ?? r, r, h, seg]} />
    </mesh>
  );
}

/** Four legs inset from the footprint corners. */
export function Legs({ w, d, h, inset = 0.06, r = 0.018, m, taper = 0.7 }: { w: number; d: number; h: number; inset?: number; r?: number; m: Material; taper?: number }) {
  const x = w / 2 - inset;
  const z = d / 2 - inset;
  return (
    <>
      {([[-x, -z], [x, -z], [x, z], [-x, z]] as const).map(([lx, lz], i) => (
        <Cyl key={i} p={[lx, h / 2, lz]} r={r * taper} rTop={r} h={h} m={m} seg={12} />
      ))}
    </>
  );
}
