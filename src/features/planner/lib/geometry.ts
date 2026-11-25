import type { Room, Vec2, Wall, Opening } from '@/types';

export const DEG = Math.PI / 180;

export const add = (a: Vec2, b: Vec2): Vec2 => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: Vec2, b: Vec2): Vec2 => [a[0] - b[0], a[1] - b[1]];
export const scale = (a: Vec2, s: number): Vec2 => [a[0] * s, a[1] * s];
export const dot = (a: Vec2, b: Vec2) => a[0] * b[0] + a[1] * b[1];
export const len = (a: Vec2) => Math.hypot(a[0], a[1]);
export const norm = (a: Vec2): Vec2 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l];
};
export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
export const snap = (v: number, step: number) => Math.round(v / step) * step;
export const normalizeDeg = (deg: number) => ((deg % 360) + 360) % 360;

/**
 * Rotate a plan vector around the Y axis, matching three.js `rotation.y`.
 * An item with rotationY = 0 faces +Z.
 */
export function rotate([x, z]: Vec2, deg: number): Vec2 {
  const r = deg * DEG;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [x * c + z * s, -x * s + z * c];
}

/** Unit vector the item's front faces. */
export const frontOf = (deg: number): Vec2 => rotate([0, 1], deg);

/** Rotation (deg) that makes an item's front face `dir`. */
export const rotationFacing = (dir: Vec2) => normalizeDeg(Math.atan2(dir[0], dir[1]) / DEG);

/** Footprint corners of a w × d box at `pos`, rotated by `deg`. */
export function footprint(pos: Vec2, w: number, d: number, deg: number): Vec2[] {
  const hw = w / 2;
  const hd = d / 2;
  const local: Vec2[] = [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ];
  return local.map((p) => add(pos, rotate(p, deg)));
}

export function pointInPolygon([x, z]: Vec2, poly: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

export function polygonCentroid(poly: Vec2[]): Vec2 {
  let a = 0;
  let cx = 0;
  let cz = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const f = poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
    a += f;
    cx += (poly[j][0] + poly[i][0]) * f;
    cz += (poly[j][1] + poly[i][1]) * f;
  }
  a *= 0.5;
  return Math.abs(a) < 1e-9 ? poly[0] : [cx / (6 * a), cz / (6 * a)];
}

export function polygonArea(poly: Vec2[]): number {
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    a += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
  }
  return Math.abs(a / 2);
}

export const outlineOf = (room: Room): Vec2[] => room.outline.map((id) => room.corners[id]);

export function bounds(poly: Vec2[]) {
  const xs = poly.map((p) => p[0]);
  const zs = poly.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minZ = Math.min(...zs);
  const maxX = Math.max(...xs);
  const maxZ = Math.max(...zs);
  return { minX, minZ, maxX, maxZ, w: maxX - minX, d: maxZ - minZ };
}

/** A wall resolved to geometry with an inward-pointing normal. */
export interface WallSegment {
  wall: Wall;
  a: Vec2;
  b: Vec2;
  dir: Vec2;
  length: number;
  /** Unit normal pointing into the room. */
  normal: Vec2;
}

export function wallSegments(room: Room): WallSegment[] {
  const poly = outlineOf(room);
  return room.walls.map((wall) => {
    const a = room.corners[wall.from];
    const b = room.corners[wall.to];
    const v = sub(b, a);
    const length = len(v);
    const dir = norm(v);
    let normal: Vec2 = [-dir[1], dir[0]];
    const mid = add(a, scale(v, 0.5));
    if (!pointInPolygon(add(mid, scale(normal, 0.05)), poly)) normal = scale(normal, -1);
    return { wall, a, b, dir, length, normal };
  });
}

/** Signed distance from point to the wall's centre line (positive = inside room). */
export const signedDistance = (seg: WallSegment, p: Vec2) => dot(sub(p, seg.a), seg.normal);

/** Position of `p` projected on the wall, as distance from `a`. */
export const along = (seg: WallSegment, p: Vec2) => dot(sub(p, seg.a), seg.dir);

export const pointOnWall = (seg: WallSegment, t: number): Vec2 => add(seg.a, scale(seg.dir, t));

/** Oriented box overlap via the separating axis theorem. Returns penetration depth (0 = none). */
export function obbOverlap(a: Vec2[], b: Vec2[]): number {
  let min = Infinity;
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const p1 = poly[i];
      const p2 = poly[(i + 1) % poly.length];
      const axis = norm([-(p2[1] - p1[1]), p2[0] - p1[0]]);
      const pa = a.map((p) => dot(p, axis));
      const pb = b.map((p) => dot(p, axis));
      const overlap = Math.min(Math.max(...pa), Math.max(...pb)) - Math.max(Math.min(...pa), Math.min(...pb));
      if (overlap <= 0) return 0;
      min = Math.min(min, overlap);
    }
  }
  return min;
}

/** Floor zone a door leaf sweeps through, as a rectangle footprint. */
export function doorZone(seg: WallSegment, opening: Opening): Vec2[] {
  const s = pointOnWall(seg, opening.offset);
  const e = pointOnWall(seg, opening.offset + opening.width);
  const depth = scale(seg.normal, seg.wall.thickness / 2 + opening.width);
  return [s, e, add(e, depth), add(s, depth)];
}

/** Break a wall into solid pieces around its openings, for rendering. */
export interface WallPiece {
  /** Start and end along the wall, metres from `a`. */
  t0: number;
  t1: number;
  /** Bottom and top elevation. */
  y0: number;
  y1: number;
}

export function wallPieces(seg: WallSegment, height: number): WallPiece[] {
  const ops = [...seg.wall.openings].sort((x, y) => x.offset - y.offset);
  const pieces: WallPiece[] = [];
  let cursor = 0;
  for (const o of ops) {
    const s = clamp(o.offset, 0, seg.length);
    const e = clamp(o.offset + o.width, 0, seg.length);
    if (s > cursor) pieces.push({ t0: cursor, t1: s, y0: 0, y1: height });
    if (o.sill > 0) pieces.push({ t0: s, t1: e, y0: 0, y1: o.sill });
    const top = o.sill + o.height;
    if (top < height) pieces.push({ t0: s, t1: e, y0: top, y1: height });
    cursor = Math.max(cursor, e);
  }
  if (cursor < seg.length) pieces.push({ t0: cursor, t1: seg.length, y0: 0, y1: height });
  return pieces;
}
