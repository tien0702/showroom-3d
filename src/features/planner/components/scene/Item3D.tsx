import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Group, Mesh, MeshBasicMaterial, Plane, Vector3 } from 'three';
import type { PlacedItem, Product } from '@/types';
import { FurnitureModel } from '@/features/furniture/FurnitureModel';
import { usePlanner } from '../../store/plannerStore';
import { DEG } from '../../lib/geometry';

interface Item3DProps {
  item: PlacedItem;
  product: Product;
  /** Called with true while a drag is in progress, so the camera controls can pause. */
  onDragState: (dragging: boolean) => void;
}

const ACCENT = '#2f5bea';
const DANGER = '#d6453d';
const floorPlane = new Plane(new Vector3(0, 1, 0), 0);

/** Damped spring used for the drop-in / exit scale. */
function spring(state: { x: number; v: number }, target: number, dt: number, k = 260, c = 20) {
  const a = k * (target - state.x) - c * state.v;
  state.v += a * dt;
  state.x += state.v * dt;
}

/** True when the camera is on the back side of a wall-mounted item. */
export function isBehind(cam: Vector3, pos: [number, number], rotationY: number) {
  const r = rotationY * DEG;
  return (cam.x - pos[0]) * Math.sin(r) + (cam.z - pos[1]) * Math.cos(r) < 0 && cam.y > 1.9;
}

export const Item3D = memo(function Item3D({ item, product, onDragState }: Item3DProps) {
  const group = useRef<Group>(null);
  const footprint = useRef<Mesh>(null);
  const grab = useRef<Vector3 | null>(null);
  const hit = useMemo(() => new Vector3(), []);
  const scaleState = useRef({ x: 0, v: 0 });
  const spin = useRef(0);
  const placed = useRef(false);
  const { gl } = useThree();

  const selected = usePlanner((s) => s.selected === item.uid);
  const hovered = usePlanner((s) => s.hovered === item.uid);
  const dragging = usePlanner((s) => s.dragging === item.uid);
  const removing = usePlanner((s) => s.removing.includes(item.uid));
  const issue = usePlanner((s) => s.issues[item.uid] ?? null);
  const { beginDrag, dragTo, endDrag, hover, select } = usePlanner.getState();

  const fpMat = useMemo(() => new MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0, depthWrite: false }), []);
  const { w, d } = product.dimensions;
  const isWall = product.rules.placement === 'wall';

  useEffect(() => () => fpMat.dispose(), [fpMat]);

  useFrame(({ camera }, rawDt) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(rawDt, 1 / 30);
    const lift = dragging ? 0.05 : hovered && !isWall ? 0.015 : 0;
    const tx = item.position[0];
    const tz = item.position[1];
    const ty = item.elevation + lift;
    if (!placed.current) {
      g.position.set(tx, ty, tz);
      g.rotation.y = item.rotationY * DEG;
      placed.current = true;
    }
    const k = 1 - Math.exp(-dt * (dragging ? 22 : 12));
    g.position.x += (tx - g.position.x) * k;
    g.position.z += (tz - g.position.z) * k;
    g.position.y += (ty - g.position.y) * k;

    // Rotate along the shortest arc.
    const target = item.rotationY * DEG + spin.current;
    let delta = target - g.rotation.y;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    g.rotation.y += delta * (1 - Math.exp(-dt * 14));

    // Wall-mounted items fade out when their wall is cut away (camera behind it).
    const behind = isWall && isBehind(camera.position, item.position, item.rotationY);
    if (removing) {
      spin.current += dt * 9;
      spring(scaleState.current, 0, dt, 180, 14);
    } else {
      spring(scaleState.current, behind ? 0 : 1, dt);
    }
    const sc = Math.max(0, scaleState.current.x);
    g.scale.setScalar(sc);

    const fp = footprint.current;
    if (fp) {
      const want = selected || dragging ? 0.22 : hovered ? 0.1 : 0;
      fpMat.opacity += (want - fpMat.opacity) * (1 - Math.exp(-dt * 12));
      fpMat.color.set(issue ? DANGER : ACCENT);
      fp.visible = fpMat.opacity > 0.01;
    }
  });

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    (e.target as Element | null)?.setPointerCapture?.(e.pointerId);
    if (!e.ray.intersectPlane(floorPlane, hit)) return;
    grab.current = new Vector3(hit.x - item.position[0], 0, hit.z - item.position[1]);
    beginDrag(item.uid);
    onDragState(true);
    gl.domElement.style.cursor = 'grabbing';
  };

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!grab.current || usePlanner.getState().dragging !== item.uid) return;
    e.stopPropagation();
    if (!e.ray.intersectPlane(floorPlane, hit)) return;
    dragTo(item.uid, [hit.x - grab.current.x, hit.z - grab.current.z], e.altKey);
  };

  const onUp = (e: ThreeEvent<PointerEvent>) => {
    if (!grab.current) return;
    e.stopPropagation();
    (e.target as Element | null)?.releasePointerCapture?.(e.pointerId);
    grab.current = null;
    endDrag();
    onDragState(false);
    gl.domElement.style.cursor = 'grab';
  };

  return (
    <group
      ref={group}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerOver={(e) => {
        e.stopPropagation();
        hover(item.uid);
        if (!usePlanner.getState().dragging) gl.domElement.style.cursor = 'grab';
      }}
      onPointerOut={() => {
        hover(null);
        if (!usePlanner.getState().dragging) gl.domElement.style.cursor = '';
      }}
      onClick={(e) => {
        e.stopPropagation();
        select(item.uid);
      }}
    >
      <FurnitureModel product={product} variant={item.variant} />
      {!isWall && (
        <mesh ref={footprint} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} material={fpMat} renderOrder={2}>
          <planeGeometry args={[w + 0.08, d + 0.08]} />
        </mesh>
      )}
    </group>
  );
});
