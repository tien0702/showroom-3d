import { memo, useCallback, useMemo, useRef, useState, type PointerEvent as RPointerEvent, type WheelEvent } from 'react';
import type { PlacedItem, Product, Room, Vec2 } from '@/types';
import { catalog } from '@/features/catalog/api';
import { IconButton, Icons } from '@/shared/ui';
import { formatArea, formatCm } from '@/shared/lib/format';
import { add, bounds, len, outlineOf, polygonArea, scale, sub, wallPieces, wallSegments, type WallSegment } from '../lib/geometry';
import { usePlanner } from '../store/plannerStore';
import s from './Planner.module.css';

const PAD = 0.9;
const ORDER: Record<string, number> = { rug: 0 };
const layerOf = (p: Product) => (p.rules.placement === 'wall' ? 3 : p.rules.placement === 'onTop' ? 2 : ORDER[p.category] ?? 1);

const CATEGORY_TINT: Partial<Record<Product['category'], string>> = {
  rug: '#efe9de',
  sofa: '#e3e7f4',
  armchair: '#e8e5f2',
  bed: '#e6eef0',
  'coffee-table': '#efe6d9',
  dining: '#efe6d9',
  storage: '#ece8df',
  'tv-stand': '#ece8df',
  nightstand: '#ece8df',
  lighting: '#f5efd9',
  decor: '#e3ede2',
};

export function Plan2D() {
  const room = usePlanner((st) => st.room);
  const items = usePlanner((st) => st.items);
  const showDims = usePlanner((st) => st.showDimensions);
  const svg = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Vec2>([0, 0]);
  const panning = useRef<{ start: Vec2; pan: Vec2 } | null>(null);

  const base = useMemo(() => {
    if (!room) return null;
    const b = bounds(outlineOf(room));
    return { x: b.minX - PAD, y: b.minZ - PAD, w: b.w + PAD * 2, h: b.d + PAD * 2 };
  }, [room]);

  const toPlan = useCallback((clientX: number, clientY: number): Vec2 => {
    const el = svg.current;
    const m = el?.getScreenCTM();
    if (!el || !m) return [0, 0];
    const pt = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return [pt.x, pt.y];
  }, []);

  if (!room || !base) return null;

  const vw = base.w / zoom;
  const vh = base.h / zoom;
  const vx = base.x + (base.w - vw) / 2 + pan[0];
  const vy = base.y + (base.h - vh) / 2 + pan[1];

  const sorted = [...items]
    .map((it) => ({ it, p: catalog.bySku(it.sku)! }))
    .filter((x) => x.p)
    .sort((a, b) => layerOf(a.p) - layerOf(b.p));

  const onWheel = (e: WheelEvent) => {
    setZoom((z) => Math.min(4, Math.max(0.6, z * (e.deltaY > 0 ? 0.9 : 1.1))));
  };

  const onBgDown = (e: RPointerEvent<SVGRectElement>) => {
    usePlanner.getState().select(null);
    (e.target as Element).setPointerCapture(e.pointerId);
    panning.current = { start: [e.clientX, e.clientY], pan };
  };
  const onBgMove = (e: RPointerEvent<SVGRectElement>) => {
    const p = panning.current;
    const el = svg.current;
    if (!p || !el) return;
    const k = vw / el.clientWidth;
    setPan([p.pan[0] - (e.clientX - p.start[0]) * k, p.pan[1] - (e.clientY - p.start[1]) * k]);
  };

  return (
    <div className={s.planWrap}>
      <svg
        ref={svg}
        className={s.planSvg}
        viewBox={`${vx} ${vy} ${vw} ${vh}`}
        preserveAspectRatio="xMidYMid meet"
        onWheel={onWheel}
        role="application"
        aria-label="Mặt bằng 2D"
      >
        <defs>
          <pattern id="grid-minor" width="0.25" height="0.25" patternUnits="userSpaceOnUse">
            <path d="M0.25 0H0V0.25" fill="none" stroke="#e4e1da" strokeWidth="0.006" />
          </pattern>
          <pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse">
            <rect width="1" height="1" fill="url(#grid-minor)" />
            <path d="M1 0H0V1" fill="none" stroke="#d8d4cc" strokeWidth="0.01" />
          </pattern>
        </defs>
        <rect
          x={vx - 50}
          y={vy - 50}
          width={vw + 100}
          height={vh + 100}
          fill="url(#grid)"
          onPointerDown={onBgDown}
          onPointerMove={onBgMove}
          onPointerUp={() => (panning.current = null)}
          style={{ cursor: 'grab' }}
        />
        <RoomShape room={room} showDims={showDims} />
        {sorted.map(({ it, p }) => (
          <PlanItem key={it.uid} item={it} product={p} toPlan={toPlan} showDims={showDims} />
        ))}
      </svg>
      <div className={s.zoomBar}>
        <IconButton label="Thu nhỏ" size="sm" icon={<Icons.IconMinus size={16} />} onClick={() => setZoom((z) => Math.max(0.6, z / 1.2))} />
        <button className={s.zoomValue} onClick={() => { setZoom(1); setPan([0, 0]); }} aria-label="Về 100%">
          {Math.round(zoom * 100)}%
        </button>
        <IconButton label="Phóng to" size="sm" icon={<Icons.IconPlus size={16} />} onClick={() => setZoom((z) => Math.min(4, z * 1.2))} />
      </div>
    </div>
  );
}

const RoomShape = memo(function RoomShape({ room, showDims }: { room: Room; showDims: boolean }) {
  const outline = useMemo(() => outlineOf(room), [room]);
  const segs = useMemo(() => wallSegments(room), [room]);
  const area = polygonArea(outline);
  const b = bounds(outline);
  const c: Vec2 = [(b.minX + b.maxX) / 2, b.maxZ + 0.62];
  return (
    <g>
      <polygon points={outline.map((p) => p.join(',')).join(' ')} fill="#fbfaf7" />
      <text x={c[0]} y={c[1]} className={s.roomLabel} textAnchor="middle">
        {room.name} · {formatArea(area)}
      </text>
      {segs.map((seg) => (
        <WallShape key={seg.wall.id} seg={seg} height={room.height} showDims={showDims} />
      ))}
    </g>
  );
});

function WallShape({ seg, height, showDims }: { seg: WallSegment; height: number; showDims: boolean }) {
  const t = seg.wall.thickness;
  const pieces = wallPieces(seg, height).filter((p) => p.y0 === 0);
  const n = seg.normal;
  const quad = (t0: number, t1: number, inset = 0) => {
    const a = add(seg.a, scale(seg.dir, t0));
    const b = add(seg.a, scale(seg.dir, t1));
    const h = t / 2 - inset;
    return [add(a, scale(n, h)), add(b, scale(n, h)), add(b, scale(n, -h)), add(a, scale(n, -h))].map((p) => p.join(',')).join(' ');
  };
  const labelPos = add(add(seg.a, scale(seg.dir, seg.length / 2)), scale(n, -t / 2 - 0.32));
  return (
    <g>
      {pieces.map((p, i) => {
        const e0 = p.t0 === 0 ? -t / 2 : 0;
        const e1 = p.t1 === seg.length ? t / 2 : 0;
        const isSill = p.y1 < height;
        return <polygon key={i} points={quad(p.t0 + e0, p.t1 + e1, isSill ? t * 0.3 : 0)} fill={isSill ? '#9fb0c8' : '#2e3033'} />;
      })}
      {seg.wall.openings.map((o) =>
        o.type === 'door' ? (
          <DoorSwing key={o.id} seg={seg} offset={o.offset} width={o.width} />
        ) : (
          <polygon key={o.id} points={quad(o.offset, o.offset + o.width, t * 0.32)} fill="#cfe0f2" stroke="#7d93b3" strokeWidth={0.012} />
        ),
      )}
      {showDims && (
        <g className={s.dim}>
          <text x={labelPos[0]} y={labelPos[1]} textAnchor="middle" dominantBaseline="middle">
            {formatCm(seg.length)}
          </text>
        </g>
      )}
    </g>
  );
}

function DoorSwing({ seg, offset, width }: { seg: WallSegment; offset: number; width: number }) {
  const hinge = add(add(seg.a, scale(seg.dir, offset)), scale(seg.normal, seg.wall.thickness / 2));
  const closed = add(hinge, scale(seg.dir, width));
  const open = add(hinge, scale(seg.normal, width));
  return (
    <g>
      <path d={`M${closed.join(',')} A${width},${width} 0 0 ${sweep(seg)} ${open.join(',')}`} fill="none" stroke="#8a8d93" strokeWidth={0.012} strokeDasharray="0.04 0.03" />
      <line x1={hinge[0]} y1={hinge[1]} x2={open[0]} y2={open[1]} stroke="#2e3033" strokeWidth={0.03} strokeLinecap="round" />
    </g>
  );
}

const sweep = (seg: WallSegment) => (seg.dir[0] * seg.normal[1] - seg.dir[1] * seg.normal[0] > 0 ? 1 : 0);

interface PlanItemProps {
  item: PlacedItem;
  product: Product;
  toPlan: (x: number, y: number) => Vec2;
  showDims: boolean;
}

const PlanItem = memo(function PlanItem({ item, product, toPlan, showDims }: PlanItemProps) {
  const selected = usePlanner((st) => st.selected === item.uid);
  const hovered = usePlanner((st) => st.hovered === item.uid);
  const dragging = usePlanner((st) => st.dragging === item.uid);
  const removing = usePlanner((st) => st.removing.includes(item.uid));
  const issue = usePlanner((st) => st.issues[item.uid] ?? null);
  const grab = useRef<Vec2 | null>(null);
  const { w, d } = product.dimensions;
  const clipId = `clip-${item.uid}`;
  const round = product.model.includes('round') || product.model === 'plant' || product.model === 'table-lamp' || product.model === 'floor-lamp';
  const fill = issue ? '#fde3e1' : CATEGORY_TINT[product.category] ?? '#ecebe6';
  const stroke = issue ? '#d6453d' : selected || dragging ? '#2f5bea' : hovered ? '#6f86d6' : '#8a8780';
  const label = product.name.split(' ').slice(0, 2).join(' ');
  const fontSize = Math.min(0.15, Math.max(0.085, Math.min(w, d) * 0.22));
  const showLabel = Math.min(w, d) >= (round ? 0.7 : 0.45) && product.rules.placement !== 'wall';
  const vertical = Math.abs(((item.rotationY % 180) + 180) % 180 - 90) < 30;
  const wOff = vertical ? 0.38 : 0.12;
  const dOff = vertical ? 0.12 : 0.32;

  const onDown = (e: RPointerEvent<SVGGElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const p = toPlan(e.clientX, e.clientY);
    grab.current = sub(p, item.position);
    usePlanner.getState().beginDrag(item.uid);
  };
  const onMove = (e: RPointerEvent<SVGGElement>) => {
    if (!grab.current) return;
    const p = toPlan(e.clientX, e.clientY);
    usePlanner.getState().dragTo(item.uid, sub(p, grab.current), e.altKey);
  };
  const onUp = (e: RPointerEvent<SVGGElement>) => {
    if (!grab.current) return;
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    const moved = len(sub(toPlan(e.clientX, e.clientY), add(item.position, grab.current))) > 0.01;
    grab.current = null;
    usePlanner.getState().endDrag();
    if (!moved) usePlanner.getState().select(item.uid);
  };

  return (
    <g
      className={s.planItem}
      data-removing={removing || undefined}
      data-dragging={dragging || undefined}
      transform={`translate(${item.position[0]} ${item.position[1]}) rotate(${-item.rotationY})`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerEnter={() => usePlanner.getState().hover(item.uid)}
      onPointerLeave={() => usePlanner.getState().hover(null)}
      role="button"
      aria-label={product.name}
      aria-pressed={selected}
    >
      <g className={s.planItemInner}>
        <clipPath id={clipId}>
          <rect x={-w / 2} y={-d / 2} width={w} height={d} />
        </clipPath>
        {round ? (
          <ellipse rx={w / 2} ry={d / 2} fill={fill} stroke={stroke} strokeWidth={selected ? 0.028 : 0.016} />
        ) : (
          <rect x={-w / 2} y={-d / 2} width={w} height={d} rx={Math.min(0.05, w * 0.08)} fill={fill} fillOpacity={product.category === 'rug' ? 0.85 : 1} stroke={stroke} strokeWidth={selected ? 0.028 : 0.016} />
        )}
        {product.rules.placement !== 'wall' && product.category !== 'rug' && !round && (
          <line x1={-w / 2 + 0.06} x2={w / 2 - 0.06} y1={d / 2 - 0.035} y2={d / 2 - 0.035} stroke={stroke} strokeOpacity={0.5} strokeWidth={0.012} />
        )}
        {showLabel && (
          <g clipPath={`url(#${clipId})`}>
            <text className={s.itemLabel} style={{ fontSize }} textAnchor="middle" dominantBaseline="middle" transform={`rotate(${item.rotationY})`}>
              {label}
            </text>
          </g>
        )}
        {selected && showDims && (
          <g className={s.dim}>
            <text transform={`translate(0 ${-d / 2 - wOff}) rotate(${item.rotationY})`} textAnchor="middle" dominantBaseline="middle">{formatCm(w)}</text>
            <text transform={`translate(${w / 2 + dOff} 0) rotate(${item.rotationY})`} textAnchor="middle" dominantBaseline="middle">{formatCm(d)}</text>
          </g>
        )}
      </g>
    </g>
  );
});
