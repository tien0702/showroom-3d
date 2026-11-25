/**
 * Procedural stand-ins for product models.
 * Contract shared with real GLB files: pivot at bottom-centre, front faces +Z,
 * metres, overall size = product.dimensions. Replace with GLBs per SKU when ready.
 */
import { useMemo, type ComponentType } from 'react';
import { CatmullRomCurve3, Vector3 } from 'three';
import type { Dimensions } from '@/types';
import { Box, Cyl, Legs } from '../primitives';
import { NEUTRAL, type SlotMaterials } from '../materials';

export interface ModelProps {
  dims: Dimensions;
  m: SlotMaterials;
}

function Sofa({ dims: { w, d, h }, m }: ModelProps) {
  const arm = 0.16;
  const legH = 0.1;
  const seatH = 0.2;
  const baseY = legH + 0.12;
  const seatCount = w > 1.6 ? 3 : 2;
  const inner = w - arm * 2;
  return (
    <group>
      <Legs w={w - 0.04} d={d - 0.06} h={legH} m={m.wood} r={0.022} />
      <Box p={[0, legH + 0.06, 0]} s={[w, 0.12, d]} m={m.fabric} r={0.03} />
      {Array.from({ length: seatCount }, (_, i) => {
        const cw = inner / seatCount;
        return <Box key={i} p={[-inner / 2 + cw * (i + 0.5), baseY + seatH / 2, 0.06]} s={[cw - 0.01, seatH, d - 0.28]} m={m.fabric} r={0.06} />;
      })}
      <Box p={[0, (baseY + h) / 2, -d / 2 + 0.11]} s={[w - 0.02, h - baseY, 0.22]} m={m.fabric} r={0.06} />
      {Array.from({ length: seatCount }, (_, i) => {
        const cw = inner / seatCount;
        return <Box key={`b${i}`} p={[-inner / 2 + cw * (i + 0.5), baseY + seatH + 0.2, -d / 2 + 0.3]} s={[cw - 0.04, 0.38, 0.16]} m={m.fabric} r={0.07} rot={[-0.18, 0, 0]} />;
      })}
      {[-1, 1].map((sgn) => (
        <Box key={sgn} p={[sgn * (w / 2 - arm / 2), (legH + h * 0.66) / 2 + 0.02, 0]} s={[arm, h * 0.66 - legH, d]} m={m.fabric} r={0.06} />
      ))}
    </group>
  );
}

function SofaCorner({ dims: { w, d, h }, m }: ModelProps) {
  const depth = 0.95;
  const chaise = 0.95;
  const legH = 0.08;
  const baseY = legH + 0.14;
  const backCount = Math.max(2, Math.round((w - 0.4) / 0.7));
  return (
    <group>
      <Box p={[0, legH + 0.07, -d / 2 + depth / 2]} s={[w, 0.14, depth]} m={m.fabric} r={0.03} />
      <Box p={[w / 2 - chaise / 2, legH + 0.07, depth / 2]} s={[chaise, 0.14, d - depth]} m={m.fabric} r={0.03} />
      <Box p={[-0.15, baseY + 0.09, -d / 2 + depth / 2 + 0.08]} s={[w - chaise - 0.3, 0.18, depth - 0.3]} m={m.fabric} r={0.06} />
      <Box p={[w / 2 - chaise / 2, baseY + 0.09, 0.08]} s={[chaise - 0.04, 0.18, d - 0.3]} m={m.fabric} r={0.06} />
      <Box p={[0, (baseY + h) / 2, -d / 2 + 0.11]} s={[w, h - baseY, 0.22]} m={m.fabric} r={0.06} />
      <Box p={[-w / 2 + 0.08, (legH + h * 0.62) / 2, -d / 2 + depth / 2]} s={[0.16, h * 0.62 - legH, depth]} m={m.fabric} r={0.06} />
      {Array.from({ length: backCount }, (_, i) => {
        const cw = (w - 0.4) / backCount;
        return <Box key={i} p={[-w / 2 + 0.2 + cw * (i + 0.5), baseY + 0.38, -d / 2 + 0.3]} s={[cw - 0.08, 0.36, 0.16]} m={m.fabric} r={0.07} rot={[-0.18, 0, 0]} />;
      })}
      {([[-w / 2 + 0.06, -d / 2 + 0.06], [w / 2 - 0.06, -d / 2 + 0.06], [w / 2 - 0.06, d / 2 - 0.06], [-w / 2 + 0.06, -d / 2 + depth - 0.06], [w / 2 - chaise + 0.06, d / 2 - 0.06]] as const).map(([x, z], i) => (
        <Cyl key={i} p={[x, legH / 2, z]} r={0.02} h={legH} m={m.metal} seg={10} />
      ))}
    </group>
  );
}

function Armchair({ dims: { w, d, h }, m }: ModelProps) {
  const legH = 0.16;
  return (
    <group>
      <Legs w={w - 0.08} d={d - 0.1} h={legH} m={m.wood} r={0.024} />
      <Box p={[0, legH + 0.12, 0]} s={[w, 0.24, d]} m={m.fabric} r={0.1} />
      <Box p={[0, legH + 0.3, 0.06]} s={[w - 0.26, 0.12, d - 0.22]} m={m.fabric} r={0.06} />
      <Box p={[0, (legH + h) / 2 + 0.06, -d / 2 + 0.12]} s={[w - 0.04, h - legH - 0.12, 0.24]} m={m.fabric} r={0.11} />
      {[-1, 1].map((s) => (
        <Box key={s} p={[s * (w / 2 - 0.1), legH + 0.26, 0]} s={[0.2, 0.28, d]} m={m.fabric} r={0.1} />
      ))}
    </group>
  );
}

function LoungeChair({ dims: { w, d, h }, m }: ModelProps) {
  const seatY = 0.36;
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box p={[s * (w / 2 - 0.03), seatY / 2, d / 2 - 0.1]} s={[0.04, seatY, 0.04]} m={m.wood} r={0.01} />
          <Box p={[s * (w / 2 - 0.03), seatY / 2 + 0.05, -d / 2 + 0.12]} s={[0.04, seatY + 0.1, 0.04]} m={m.wood} r={0.01} />
          <Box p={[s * (w / 2 - 0.03), 0.56, 0]} s={[0.06, 0.04, d - 0.06]} m={m.wood} r={0.015} />
        </group>
      ))}
      <Box p={[0, seatY, 0.03]} s={[w - 0.08, 0.05, d - 0.2]} m={m.wood} r={0.015} />
      <Box p={[0, seatY + 0.07, 0.04]} s={[w - 0.14, 0.09, d - 0.26]} m={m.fabric} r={0.04} />
      <Box p={[0, (seatY + h) / 2 + 0.04, -d / 2 + 0.12]} s={[w - 0.08, h - seatY, 0.05]} m={m.wood} r={0.015} rot={[-0.22, 0, 0]} />
      {Array.from({ length: 6 }, (_, i) => (
        <Box key={i} p={[0, seatY + 0.08 + i * 0.065, -d / 2 + 0.135 - i * 0.015]} s={[w - 0.12, 0.012, 0.055]} m={m.accent} rot={[-0.22, 0, 0]} />
      ))}
    </group>
  );
}

function CoffeeTableRound({ dims: { w, h }, m }: ModelProps) {
  const r = w / 2;
  return (
    <group>
      <Cyl p={[0, h - 0.02, 0]} r={r} h={0.04} m={m.wood} seg={48} />
      <Cyl p={[0, 0.06, 0]} r={r * 0.82} h={0.02} m={m.wood} seg={48} />
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return <Cyl key={i} p={[Math.cos(a) * r * 0.62, (h - 0.04) / 2, Math.sin(a) * r * 0.62]} r={0.025} h={h - 0.04} m={m.wood} seg={12} />;
      })}
    </group>
  );
}

function CoffeeTableRect({ dims: { w, d, h }, m }: ModelProps) {
  return (
    <group>
      <Box p={[0, h - 0.025, 0]} s={[w, 0.05, d]} m={m.accent} r={0.012} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box p={[s * (w / 2 - 0.08), (h - 0.05) / 2, 0]} s={[0.02, h - 0.05, d - 0.08]} m={m.metal} />
          <Box p={[s * (w / 2 - 0.08), 0.01, 0]} s={[0.05, 0.02, d - 0.08]} m={m.metal} />
        </group>
      ))}
    </group>
  );
}

function TvStand({ dims: { w, d, h }, m }: ModelProps) {
  const legH = 0.12;
  const bodyH = h - legH;
  const n = 3;
  return (
    <group>
      <Legs w={w - 0.1} d={d - 0.08} h={legH} m={m.metal} r={0.015} taper={1} />
      <Box p={[0, legH + bodyH / 2, 0]} s={[w, bodyH, d]} m={m.wood} r={0.012} />
      {Array.from({ length: n }, (_, i) => (
        <group key={i}>
          <Box p={[-w / 2 + (w / n) * (i + 0.5), legH + bodyH / 2, d / 2 + 0.002]} s={[w / n - 0.02, bodyH - 0.04, 0.006]} m={m.wood} r={0.003} />
          <Box p={[-w / 2 + (w / n) * (i + 0.5), legH + bodyH - 0.06, d / 2 + 0.01]} s={[0.12, 0.012, 0.012]} m={m.metal} />
        </group>
      ))}
    </group>
  );
}

function Bed({ dims: { w, d, h }, m }: ModelProps) {
  const frameH = 0.32;
  const mat = 0.2;
  return (
    <group>
      <Legs w={w - 0.08} d={d - 0.08} h={0.08} m={m.wood} r={0.03} taper={1} />
      <Box p={[0, 0.08 + (frameH - 0.08) / 2, 0.02]} s={[w, frameH - 0.08, d - 0.04]} m={m.wood} r={0.015} />
      <Box p={[0, frameH + mat / 2, 0.04]} s={[w - 0.1, mat, d - 0.16]} m={NEUTRAL.linen} r={0.05} />
      <Box p={[0, frameH + mat + 0.02, 0.32]} s={[w - 0.06, 0.06, d * 0.6]} m={m.fabric} r={0.03} />
      <Box p={[0, h / 2, -d / 2 + 0.05]} s={[w, h, 0.1]} m={m.fabric} r={0.04} />
      {[-1, 1].map((s) => (
        <Box key={s} p={[s * (w / 4 - 0.02), frameH + mat + 0.07, -d / 2 + 0.36]} s={[w / 2 - 0.16, 0.13, 0.42]} m={NEUTRAL.linen} r={0.06} rot={[-0.15, 0, 0]} />
      ))}
    </group>
  );
}

function Nightstand({ dims: { w, d, h }, m }: ModelProps) {
  const legH = 0.12;
  return (
    <group>
      <Legs w={w - 0.06} d={d - 0.06} h={legH} m={m.wood} r={0.015} />
      <Box p={[0, legH + (h - legH) / 2, 0]} s={[w, h - legH, d]} m={m.wood} r={0.012} />
      <Box p={[0, h - 0.1, d / 2 + 0.003]} s={[w - 0.04, 0.12, 0.006]} m={m.wood} />
      <Box p={[0, h - 0.1, d / 2 + 0.012]} s={[0.08, 0.012, 0.012]} m={NEUTRAL.ink} />
    </group>
  );
}

function Wardrobe({ dims: { w, d, h }, m }: ModelProps) {
  return (
    <group>
      <Box p={[0, 0.04, 0]} s={[w - 0.04, 0.08, d - 0.04]} m={NEUTRAL.ink} />
      <Box p={[0, 0.08 + (h - 0.08) / 2, 0]} s={[w, h - 0.08, d]} m={m.wood} r={0.01} />
      <Box p={[0, h / 2 + 0.04, d / 2 + 0.002]} s={[0.006, h - 0.16, 0.006]} m={NEUTRAL.ink} />
      {[-1, 1].map((s) => (
        <Box key={s} p={[s * 0.05, h / 2 + 0.04, d / 2 + 0.015]} s={[0.014, 0.3, 0.02]} m={m.metal} r={0.004} />
      ))}
    </group>
  );
}

function Bookshelf({ dims: { w, d, h }, m }: ModelProps) {
  const shelves = 5;
  const gap = (h - 0.04) / (shelves - 1);
  const books = useMemo(
    () =>
      Array.from({ length: shelves - 1 }, (_, row) =>
        Array.from({ length: 4 + (row % 3) }, (_, i) => ({ h: 0.18 + ((row * 7 + i * 3) % 5) * 0.025, mat: NEUTRAL.books[(row + i) % NEUTRAL.books.length], i })),
      ),
    [],
  );
  return (
    <group>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Box key={`${sx}${sz}`} p={[sx * (w / 2 - 0.01), h / 2, sz * (d / 2 - 0.01)]} s={[0.02, h, 0.02]} m={m.metal} />))}
      {Array.from({ length: shelves }, (_, i) => (
        <Box key={i} p={[0, 0.02 + i * gap, 0]} s={[w, 0.025, d]} m={m.wood} r={0.004} />
      ))}
      {books.map((row, r) =>
        row.map((b) => <Box key={`${r}-${b.i}`} p={[-w / 2 + 0.08 + b.i * 0.05, 0.035 + r * gap + b.h / 2, 0]} s={[0.04, b.h, d * 0.7]} m={b.mat} />),
      )}
    </group>
  );
}

function DiningTable({ dims: { w, d, h }, m }: ModelProps) {
  return (
    <group>
      <Box p={[0, h - 0.02, 0]} s={[w, 0.04, d]} m={m.wood} r={0.01} />
      <Legs w={w - 0.08} d={d - 0.08} h={h - 0.04} m={m.wood} r={0.032} inset={0.06} taper={0.8} />
      <Box p={[0, h - 0.08, 0]} s={[w - 0.2, 0.06, d - 0.2]} m={m.wood} />
    </group>
  );
}

function DiningChair({ dims: { w, d, h }, m }: ModelProps) {
  const seat = 0.46;
  return (
    <group>
      <Legs w={w - 0.04} d={d - 0.04} h={seat - 0.03} m={m.wood} r={0.018} inset={0.04} />
      <Box p={[0, seat, 0.02]} s={[w, 0.04, d - 0.04]} m={m.wood} r={0.012} />
      <Box p={[0, seat + 0.03, 0.03]} s={[w - 0.04, 0.03, d - 0.1]} m={m.fabric} r={0.012} />
      <Box p={[0, h - 0.1, -d / 2 + 0.03]} s={[w, 0.16, 0.025]} m={m.wood} r={0.01} rot={[-0.1, 0, 0]} />
      {[-1, 1].map((s) => (
        <Box key={s} p={[s * (w / 2 - 0.04), (seat + h) / 2, -d / 2 + 0.035]} s={[0.025, h - seat, 0.025]} m={m.wood} />
      ))}
    </group>
  );
}

function FloorLamp({ dims: { h }, m }: ModelProps) {
  const curve = useMemo(
    () => new CatmullRomCurve3([new Vector3(-0.1, 0.03, 0), new Vector3(-0.1, h * 0.7, 0), new Vector3(0.0, h * 0.98, 0), new Vector3(0.12, h - 0.1, 0)]),
    [h],
  );
  return (
    <group>
      <Cyl p={[-0.1, 0.015, 0]} r={0.14} h={0.03} m={m.metal} />
      <mesh castShadow material={m.metal}>
        <tubeGeometry args={[curve, 48, 0.012, 8, false]} />
      </mesh>
      <Cyl p={[0.12, h - 0.16, 0]} r={0.17} rTop={0.06} h={0.18} m={m.accent} />
      <Cyl p={[0.12, h - 0.24, 0]} r={0.05} h={0.02} m={NEUTRAL.glowWarm} />
    </group>
  );
}

function TableLamp({ dims: { w, h }, m }: ModelProps) {
  return (
    <group>
      <Cyl p={[0, 0.09, 0]} r={0.06} rTop={0.045} h={0.18} m={m.wood} />
      <Cyl p={[0, 0.2, 0]} r={0.008} h={0.06} m={NEUTRAL.ink} seg={8} />
      <Cyl p={[0, h - 0.09, 0]} r={w / 2} rTop={w / 2 - 0.03} h={0.18} m={m.accent} />
      <Cyl p={[0, h - 0.17, 0]} r={w / 2 - 0.03} h={0.01} m={NEUTRAL.glowWarm} />
    </group>
  );
}

function Rug({ dims: { w, d, h }, m }: ModelProps) {
  return (
    <group>
      <Box p={[0, h / 2, 0]} s={[w, h, d]} m={m.fabric} r={0.004} />
      <Box p={[0, h + 0.0005, 0]} s={[w - 0.2, 0.001, d - 0.2]} m={m.accent} />
      <Box p={[0, h + 0.001, 0]} s={[w - 0.26, 0.001, d - 0.26]} m={m.fabric} />
    </group>
  );
}

function RugRound({ dims: { w, h }, m }: ModelProps) {
  return <Cyl p={[0, h / 2, 0]} r={w / 2} h={h} m={m.fabric} seg={64} />;
}

function Plant({ dims: { w, h }, m }: ModelProps) {
  const potH = 0.32;
  const leaves = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2 + i * 0.4;
        const lift = 0.35 + ((i * 37) % 10) / 22;
        return { a, y: potH + lift * (h - potH) * 0.85, r: 0.12 + ((i * 13) % 5) * 0.025, tilt: 0.5 + ((i * 7) % 4) * 0.12 };
      }),
    [h],
  );
  return (
    <group>
      <Cyl p={[0, potH / 2, 0]} r={w * 0.28} rTop={w * 0.34} h={potH} m={m.accent} />
      <Cyl p={[0, potH - 0.01, 0]} r={w * 0.31} h={0.02} m={NEUTRAL.soil} />
      {leaves.map((l, i) => (
        <group key={i} position={[0, potH, 0]} rotation={[0, l.a, 0]}>
          <mesh position={[0, (l.y - potH) / 2, l.r * 0.4]} rotation={[l.tilt * 0.3, 0, 0]} castShadow material={NEUTRAL.leafDark}>
            <cylinderGeometry args={[0.006, 0.008, l.y - potH, 6]} />
          </mesh>
          <mesh position={[0, l.y - potH, l.r]} rotation={[l.tilt, 0, 0]} scale={[l.r, 0.012, l.r * 1.25]} castShadow material={i % 2 ? NEUTRAL.leaf : NEUTRAL.leafDark}>
            <sphereGeometry args={[1, 16, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function WallArt({ dims: { w, d, h }, m }: ModelProps) {
  return (
    <group>
      <Box p={[0, h / 2, 0]} s={[w, h, d]} m={m.wood} r={0.004} />
      <Box p={[0, h / 2, d / 2 + 0.001]} s={[w - 0.06, h - 0.06, 0.002]} m={m.accent} />
      <Box p={[-0.06, h * 0.55, d / 2 + 0.003]} s={[0.012, h * 0.5, 0.002]} m={NEUTRAL.ink} rot={[0, 0, 0.35]} />
      <mesh position={[0.08, h * 0.38, d / 2 + 0.003]} material={NEUTRAL.books[1]}>
        <circleGeometry args={[w * 0.14, 32]} />
      </mesh>
    </group>
  );
}

/** Upholstered dining chair with metal legs (Ngọc Minh dining sets). Pivot bottom-centre, faces +Z. */
function UpholsteredChair({ m }: { m: SlotMaterials }) {
  const w = 0.46;
  const d = 0.5;
  const seat = 0.47;
  return (
    <group>
      <Legs w={w - 0.04} d={d - 0.06} h={seat - 0.05} m={m.metal} r={0.014} inset={0.04} taper={1} />
      <Box p={[0, seat - 0.03, 0.02]} s={[w, 0.08, d - 0.04]} m={m.fabric} r={0.03} />
      <Box p={[0, seat + 0.2, -d / 2 + 0.05]} s={[w - 0.02, 0.42, 0.07]} m={m.fabric} r={0.03} rot={[-0.08, 0, 0]} />
    </group>
  );
}

/** Table with chairs along both long sides. `chairs` is the total count (4 or 6). */
function makeDiningSet(chairs: number) {
  return function DiningSet({ dims: { w, d }, m }: ModelProps) {
    const tableH = 0.75;
    const tableD = chairs > 4 ? 0.9 : 0.8;
    const perSide = chairs / 2;
    const step = w / perSide;
    const chairZ = d / 2 - 0.25;
    return (
      <group>
        <Box p={[0, tableH - 0.02, 0]} s={[w, 0.04, tableD]} m={m.accent} r={0.01} />
        <Box p={[0, tableH - 0.06, 0]} s={[w - 0.2, 0.04, tableD - 0.2]} m={m.metal} />
        <Legs w={w - 0.1} d={tableD - 0.1} h={tableH - 0.08} m={m.metal} r={0.022} inset={0.05} taper={1} />
        {[-1, 1].flatMap((side) =>
          Array.from({ length: perSide }, (_, i) => (
            <group key={`${side}${i}`} position={[-w / 2 + step * (i + 0.5), 0, side * chairZ]} rotation={[0, side > 0 ? Math.PI : 0, 0]}>
              <UpholsteredChair m={m} />
            </group>
          )),
        )}
      </group>
    );
  };
}

/** Dressing table: drawer desk, framed mirror and a stool tucked underneath. */
function Vanity({ dims: { w, d, h }, m }: ModelProps) {
  const top = 0.75;
  const mirrorW = Math.min(0.6, w * 0.6);
  const mirrorH = h - top - 0.06;
  return (
    <group>
      <Legs w={w - 0.04} d={d - 0.04} h={top - 0.18} m={m.metal} r={0.016} inset={0.04} taper={1} />
      <Box p={[0, top - 0.09, 0]} s={[w, 0.18, d]} m={m.wood} r={0.012} />
      {[-1, 1].map((sgn) => (
        <Box key={sgn} p={[(sgn * w) / 4, top - 0.09, d / 2 + 0.006]} s={[0.1, 0.012, 0.012]} m={m.metal} r={0.004} />
      ))}
      <Box p={[0, top + mirrorH / 2 + 0.02, -d / 2 + 0.06]} s={[mirrorW + 0.06, mirrorH, 0.03]} m={m.wood} r={0.02} />
      <Box p={[0, top + mirrorH / 2 + 0.02, -d / 2 + 0.077]} s={[mirrorW, mirrorH - 0.06, 0.006]} m={NEUTRAL.mirror} />
      <Cyl p={[0, 0.2, d / 2 - 0.2]} r={0.016} h={0.4} m={m.metal} seg={10} />
      <Cyl p={[0, 0.43, d / 2 - 0.2]} r={0.17} h={0.07} m={m.fabric} />
    </group>
  );
}

export const MODEL_REGISTRY: Record<string, ComponentType<ModelProps>> = {
  sofa: Sofa,
  'sofa-corner': SofaCorner,
  armchair: Armchair,
  'lounge-chair': LoungeChair,
  'coffee-table-round': CoffeeTableRound,
  'coffee-table-rect': CoffeeTableRect,
  'tv-stand': TvStand,
  bed: Bed,
  vanity: Vanity,
  'dining-set-4': makeDiningSet(4),
  'dining-set-6': makeDiningSet(6),
  nightstand: Nightstand,
  wardrobe: Wardrobe,
  bookshelf: Bookshelf,
  'dining-table': DiningTable,
  'dining-chair': DiningChair,
  'floor-lamp': FloorLamp,
  'table-lamp': TableLamp,
  rug: Rug,
  'rug-round': RugRound,
  plant: Plant,
  'wall-art': WallArt,
};
