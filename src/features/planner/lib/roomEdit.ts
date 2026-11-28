import type { Opening, OpeningType, Room, Vec2 } from '@/types';
import { bounds, len, outlineOf, sub, wallSegments } from './geometry';

/** Limits for editable room values, in metres. */
export const ROOM_LIMITS = {
  minSide: 1.5,
  maxSide: 20,
  minHeight: 2.2,
  maxHeight: 5,
  /** Gap kept between an opening and the wall ends / ceiling. */
  margin: 0.05,
  minOpening: 0.4,
} as const;

export const OPENING_DEFAULTS: Record<OpeningType, Omit<Opening, 'id' | 'offset'>> = {
  door: { type: 'door', width: 0.9, height: 2.1, sill: 0 },
  window: { type: 'window', width: 1.4, height: 1.4, sill: 0.85 },
};

const round = (v: number) => Math.round(v * 100) / 100;
const clampTo = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));

export function roomSize(room: Room) {
  const b = bounds(outlineOf(room));
  return { width: round(b.maxX - b.minX), depth: round(b.maxZ - b.minZ), height: room.height };
}

export const wallLength = (room: Room, wallId: string) => {
  const w = room.walls.find((x) => x.id === wallId);
  return w ? len(sub(room.corners[w.to], room.corners[w.from])) : 0;
};

/** Keep an opening inside its wall and under the ceiling. */
export function fitOpening(o: Opening, wallLen: number, roomHeight: number): Opening {
  const { margin, minOpening } = ROOM_LIMITS;
  const width = clampTo(o.width, minOpening, wallLen - 2 * margin);
  const sill = o.type === 'door' ? 0 : clampTo(o.sill, 0, roomHeight - minOpening - margin);
  const height = clampTo(o.height, minOpening, roomHeight - sill - margin);
  const offset = clampTo(o.offset, margin, wallLen - width - margin);
  return { ...o, width: round(width), height: round(height), sill: round(sill), offset: round(offset) };
}

function refitOpenings(room: Room, scaleByWall?: Record<string, number>): Room {
  return {
    ...room,
    walls: room.walls.map((w) => {
      const l = len(sub(room.corners[w.to], room.corners[w.from]));
      const k = scaleByWall?.[w.id] ?? 1;
      return { ...w, openings: w.openings.map((o) => fitOpening({ ...o, offset: o.offset * k + (o.width * (k - 1)) / 2 }, l, room.height)) };
    }),
  };
}

/**
 * Stretch the room to a new overall width (x) / depth (z) / height.
 * Every corner moves proportionally, so L-shaped rooms keep their shape;
 * doors and windows stay at the same relative spot on their wall.
 */
export function resizeRoom(room: Room, next: { width?: number; depth?: number; height?: number }) {
  const b = bounds(outlineOf(room));
  const w0 = b.maxX - b.minX;
  const d0 = b.maxZ - b.minZ;
  const { minSide, maxSide, minHeight, maxHeight } = ROOM_LIMITS;
  const w1 = clampTo(next.width ?? w0, minSide, maxSide);
  const d1 = clampTo(next.depth ?? d0, minSide, maxSide);
  const kx = w1 / w0;
  const kz = d1 / d0;
  const map = (p: Vec2): Vec2 => [round(b.minX + (p[0] - b.minX) * kx), round(b.minZ + (p[1] - b.minZ) * kz)];

  const corners = Object.fromEntries(Object.entries(room.corners).map(([id, p]) => [id, map(p)]));
  const oldLen = Object.fromEntries(wallSegments(room).map((s) => [s.wall.id, s.length]));
  const resized: Room = { ...room, corners, height: round(clampTo(next.height ?? room.height, minHeight, maxHeight)) };
  const scaleByWall = Object.fromEntries(resized.walls.map((w) => [w.id, len(sub(corners[w.to], corners[w.from])) / (oldLen[w.id] || 1)]));
  return { room: refitOpenings(resized, scaleByWall), map };
}

export function updateOpening(room: Room, wallId: string, openingId: string, patch: Partial<Opening>): Room {
  const l = wallLength(room, wallId);
  return {
    ...room,
    walls: room.walls.map((w) =>
      w.id !== wallId ? w : { ...w, openings: w.openings.map((o) => (o.id === openingId ? fitOpening({ ...o, ...patch }, l, room.height) : o)) },
    ),
  };
}

export function removeOpening(room: Room, wallId: string, openingId: string): Room {
  return { ...room, walls: room.walls.map((w) => (w.id !== wallId ? w : { ...w, openings: w.openings.filter((o) => o.id !== openingId) })) };
}

/** Free stretch of a wall where an opening of `width` fits, preferring the middle. */
function freeOffset(room: Room, wallId: string, width: number): number | null {
  const wall = room.walls.find((w) => w.id === wallId);
  if (!wall) return null;
  const l = wallLength(room, wallId);
  const gap = 0.1;
  const taken = wall.openings.map((o) => [o.offset - gap, o.offset + o.width + gap] as const).sort((a, b) => a[0] - b[0]);
  const free: Array<[number, number]> = [];
  let cursor: number = ROOM_LIMITS.margin;
  for (const [a, b] of taken) {
    if (a > cursor) free.push([cursor, a]);
    cursor = Math.max(cursor, b);
  }
  if (l - ROOM_LIMITS.margin > cursor) free.push([cursor, l - ROOM_LIMITS.margin]);
  const fits = free.filter(([a, b]) => b - a >= width);
  if (!fits.length) return null;
  const mid = l / 2;
  const best = fits
    .map(([a, b]) => clampTo(mid - width / 2, a, b - width))
    .sort((x, y) => Math.abs(x + width / 2 - mid) - Math.abs(y + width / 2 - mid))[0];
  return round(best);
}

export function addOpening(room: Room, wallId: string, type: OpeningType, id: string): Room | null {
  const base = OPENING_DEFAULTS[type];
  const l = wallLength(room, wallId);
  const width = Math.min(base.width, l - 2 * ROOM_LIMITS.margin);
  const offset = freeOffset(room, wallId, width);
  if (offset == null) return null;
  const opening = fitOpening({ ...base, id, width, offset }, l, room.height);
  return { ...room, walls: room.walls.map((w) => (w.id === wallId ? { ...w, openings: [...w.openings, opening] } : w)) };
}

const SIDE_LABEL = { top: 'trên', bottom: 'dưới', left: 'trái', right: 'phải' } as const;

/** Human label for each wall as seen on the 2D plan, e.g. "Tường 2 · phải". */
export function wallLabels(room: Room): Record<string, string> {
  return Object.fromEntries(
    wallSegments(room).map((seg, i) => {
      // `normal` points into the room; the wall sits on the opposite side.
      const [nx, nz] = seg.normal;
      const side = Math.abs(nx) > Math.abs(nz) ? (nx > 0 ? 'left' : 'right') : nz > 0 ? 'top' : 'bottom';
      return [seg.wall.id, `Tường ${i + 1} · ${SIDE_LABEL[side]}`];
    }),
  );
}
