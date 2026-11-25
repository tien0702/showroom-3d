import type { PlacedItem, Product, Room, Vec2 } from '@/types';
import {
  add,
  along,
  clamp,
  doorZone,
  footprint,
  normalizeDeg,
  obbOverlap,
  outlineOf,
  pointInPolygon,
  pointOnWall,
  polygonCentroid,
  rotationFacing,
  scale,
  signedDistance,
  snap,
  wallSegments,
  type WallSegment,
} from './geometry';

/** Tunables for how placement "feels". */
export const PLACEMENT = {
  grid: 0.05,
  wallSnapDistance: 0.25,
  overlapTolerance: 0.01,
  clampIterations: 6,
} as const;

export interface PlacementContext {
  room: Room;
  segments: WallSegment[];
  outline: Vec2[];
  items: PlacedItem[];
  products: Map<string, Product>;
}

export function createContext(room: Room, items: PlacedItem[], products: Map<string, Product>): PlacementContext {
  return { room, segments: wallSegments(room), outline: outlineOf(room), items, products };
}

export type PlacementIssue = 'collision' | 'door' | 'outside';

export interface PlacementResult {
  position: Vec2;
  rotationY: number;
  elevation: number;
  valid: boolean;
  issue: PlacementIssue | null;
  /** Id of the wall the item snapped to, if any. */
  wallId: string | null;
}

interface Request {
  uid: string | null;
  product: Product;
  position: Vec2;
  rotationY: number;
  /** Skip grid snapping (e.g. while holding Alt). */
  free?: boolean;
  /** Keep the requested rotation instead of aligning to a nearby wall (used when rotating). */
  keepRotation?: boolean;
}

/** Find the wall whose inner face is closest to `p` within the wall's length. */
function nearestWall(ctx: PlacementContext, p: Vec2) {
  let best: { seg: WallSegment; dist: number; t: number } | null = null;
  for (const seg of ctx.segments) {
    const t = along(seg, p);
    if (t < -0.05 || t > seg.length + 0.05) continue;
    const dist = signedDistance(seg, p) - seg.wall.thickness / 2;
    if (dist < -0.5) continue;
    if (!best || Math.abs(dist) < Math.abs(best.dist)) best = { seg, dist, t };
  }
  return best;
}

/** Place the item's back against a wall, keeping it inside the wall's length. */
function snapToWall(seg: WallSegment, t: number, product: Product): { position: Vec2; rotationY: number } {
  const { w, d } = product.dimensions;
  const half = w / 2;
  const tt = seg.length >= w ? clamp(t, half, seg.length - half) : seg.length / 2;
  const offset = seg.wall.thickness / 2 + d / 2 + product.rules.wallGap;
  return {
    position: add(pointOnWall(seg, tt), scale(seg.normal, offset)),
    rotationY: rotationFacing(seg.normal),
  };
}

/** Push a footprint back inside the room. */
function clampInside(ctx: PlacementContext, pos: Vec2, product: Product, rot: number): Vec2 {
  let p = pos;
  const { w, d } = product.dimensions;
  for (let i = 0; i < PLACEMENT.clampIterations; i++) {
    let moved = false;
    for (const corner of footprint(p, w, d, rot)) {
      for (const seg of ctx.segments) {
        const t = along(seg, corner);
        if (t < 0 || t > seg.length) continue;
        const min = seg.wall.thickness / 2;
        const sd = signedDistance(seg, corner);
        // Only correct corners that are close to this wall (avoids pushing through opposite walls).
        if (sd < min && sd > -1.5) {
          p = add(p, scale(seg.normal, min - sd + 0.001));
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  return p;
}

function surfaceUnder(ctx: PlacementContext, uid: string | null, p: Vec2): number | null {
  let best: number | null = null;
  for (const it of ctx.items) {
    if (it.uid === uid) continue;
    const prod = ctx.products.get(it.sku);
    const h = prod?.rules.surfaceHeight;
    if (!prod || h == null) continue;
    const fp = footprint(it.position, prod.dimensions.w * 0.9, prod.dimensions.d * 0.9, it.rotationY);
    if (pointInPolygon(p, fp)) best = Math.max(best ?? 0, h);
  }
  return best;
}

function findIssue(ctx: PlacementContext, uid: string | null, product: Product, pos: Vec2, rot: number) {
  const { w, d } = product.dimensions;
  const fp = footprint(pos, w, d, rot);
  if (!fp.every((c) => pointInPolygon(c, ctx.outline))) return 'outside' as const;
  if (!product.rules.collides || product.rules.placement !== 'floor') return null;

  for (const it of ctx.items) {
    if (it.uid === uid) continue;
    const other = ctx.products.get(it.sku);
    if (!other || !other.rules.collides || other.rules.placement !== 'floor') continue;
    const ofp = footprint(it.position, other.dimensions.w, other.dimensions.d, it.rotationY);
    if (obbOverlap(fp, ofp) > PLACEMENT.overlapTolerance) return 'collision' as const;
  }
  for (const seg of ctx.segments) {
    for (const o of seg.wall.openings) {
      if (o.type !== 'door') continue;
      if (obbOverlap(fp, doorZone(seg, o)) > PLACEMENT.overlapTolerance) return 'door' as const;
    }
  }
  return null;
}

/** Resolve where an item ends up when the user drops it at `position`. */
export function resolvePlacement(ctx: PlacementContext, req: Request): PlacementResult {
  const { product } = req;
  const { rules } = product;
  let position: Vec2 = req.free
    ? req.position
    : [snap(req.position[0], PLACEMENT.grid), snap(req.position[1], PLACEMENT.grid)];
  let rotationY = normalizeDeg(req.rotationY);
  let elevation = 0;
  let wallId: string | null = null;

  if (rules.placement === 'wall') {
    const near = nearestWall(ctx, req.position);
    if (near) {
      const s = snapToWall(near.seg, near.t, product);
      position = s.position;
      rotationY = s.rotationY;
      wallId = near.seg.wall.id;
    }
    elevation = rules.mountHeight ?? 1.2;
    return { position, rotationY, elevation, valid: !!near, issue: near ? null : 'outside', wallId };
  }

  if (rules.snapToWall && !req.keepRotation) {
    const near = nearestWall(ctx, req.position);
    if (near && near.dist - product.dimensions.d / 2 < PLACEMENT.wallSnapDistance) {
      const s = snapToWall(near.seg, near.t, product);
      position = s.position;
      rotationY = s.rotationY;
      wallId = near.seg.wall.id;
    }
  }

  if (!wallId) position = clampInside(ctx, position, product, rotationY);

  if (rules.placement === 'onTop') elevation = surfaceUnder(ctx, req.uid, position) ?? 0;

  const issue = findIssue(ctx, req.uid, product, position, rotationY);
  return { position, rotationY, elevation, valid: issue === null, issue, wallId };
}

/** Search the room for a spot where a new item fits, starting near `hint`. */
export function findFreeSpot(ctx: PlacementContext, product: Product, hint?: Vec2): PlacementResult {
  const start = hint ?? polygonCentroid(ctx.outline);
  const step = 0.25;
  let fallback: PlacementResult | null = null;
  for (let ring = 0; ring < 24; ring++) {
    const n = Math.max(1, ring * 8);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      const p: Vec2 = [start[0] + Math.cos(a) * ring * step, start[1] + Math.sin(a) * ring * step];
      if (!pointInPolygon(p, ctx.outline)) continue;
      const r = resolvePlacement(ctx, { uid: null, product, position: p, rotationY: 0 });
      fallback ??= r;
      if (r.valid) return r;
    }
  }
  return fallback ?? resolvePlacement(ctx, { uid: null, product, position: start, rotationY: 0 });
}
