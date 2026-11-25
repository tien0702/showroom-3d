import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, Group, MeshStandardMaterial, Shape, Vector3 } from 'three';
import type { Room } from '@/types';
import { outlineOf, signedDistance, wallPieces, wallSegments, type WallSegment } from '../../lib/geometry';
import { plankTexture } from '../../lib/textures';

interface Room3DProps {
  room: Room;
  /** Lower walls that sit between the camera and the room (dollhouse cut). */
  cutaway?: boolean;
  onFloorPointerDown?: () => void;
}

const CUT_HEIGHT = 0.14;
const glass = new MeshStandardMaterial({ color: '#cfe3ef', transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.1, side: DoubleSide, depthWrite: false });

export function Room3D({ room, cutaway = true, onFloorPointerDown }: Room3DProps) {
  const outline = useMemo(() => outlineOf(room), [room]);
  const segments = useMemo(() => wallSegments(room), [room]);

  const floor = useMemo(() => {
    const shape = new Shape();
    outline.forEach(([x, z], i) => (i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)));
    shape.closePath();
    return shape;
  }, [outline]);

  const floorMat = useMemo(() => {
    const map = plankTexture(room.floor.color).clone();
    map.needsUpdate = true;
    map.repeat.set(1 / 1.2, 1 / 1.2);
    return new MeshStandardMaterial({ map, roughness: 0.78 });
  }, [room.floor.color]);

  const wallMat = useMemo(() => new MeshStandardMaterial({ color: room.wallColor, roughness: 0.92 }), [room.wallColor]);
  const capMat = useMemo(() => new MeshStandardMaterial({ color: '#3a3b3e', roughness: 0.9 }), []);

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        material={floorMat}
        onPointerDown={(e) => {
          if (e.button === 0) onFloorPointerDown?.();
        }}
      >
        <shapeGeometry args={[floor]} />
      </mesh>
      {segments.map((seg) => (
        <WallMesh key={seg.wall.id} seg={seg} height={room.height} mat={wallMat} cap={capMat} cutaway={cutaway} />
      ))}
    </group>
  );
}

function WallMesh({ seg, height, mat, cap, cutaway }: { seg: WallSegment; height: number; mat: MeshStandardMaterial; cap: MeshStandardMaterial; cutaway: boolean }) {
  const group = useRef<Group>(null);
  const pieces = useMemo(() => wallPieces(seg, height), [seg, height]);
  const angle = -Math.atan2(seg.dir[1], seg.dir[0]);
  const t = seg.wall.thickness;
  const tmp = useMemo(() => new Vector3(), []);

  useFrame(({ camera }, dt) => {
    const g = group.current;
    if (!g) return;
    tmp.copy(camera.position);
    // Wall is "in front" when the camera is on its outer side and looking down at the room.
    const outside = signedDistance(seg, [tmp.x, tmp.z]) < 0;
    const target = cutaway && outside && camera.position.y > 1.9 ? CUT_HEIGHT / height : 1;
    g.scale.y += (target - g.scale.y) * Math.min(1, dt * 7);
  });

  return (
    <group position={[seg.a[0], 0, seg.a[1]]} rotation={[0, angle, 0]}>
      <group ref={group}>
        {pieces.map((p, i) => {
          // Extend solid full-height ends so corners close neatly.
          const ext0 = p.t0 === 0 ? t / 2 : 0;
          const ext1 = p.t1 === seg.length ? t / 2 : 0;
          const l = p.t1 - p.t0 + ext0 + ext1;
          const cx = (p.t0 - ext0 + p.t1 + ext1) / 2;
          return (
            <mesh key={i} position={[cx, (p.y0 + p.y1) / 2, 0]} material={mat} castShadow receiveShadow>
              <boxGeometry args={[l, p.y1 - p.y0, t]} />
            </mesh>
          );
        })}
        {pieces
          .filter((p) => p.y1 === height)
          .map((p, i) => {
            const ext0 = p.t0 === 0 ? t / 2 : 0;
            const ext1 = p.t1 === seg.length ? t / 2 : 0;
            return (
              <mesh key={`cap${i}`} position={[(p.t0 - ext0 + p.t1 + ext1) / 2, height + 0.004, 0]} material={cap}>
                <boxGeometry args={[p.t1 - p.t0 + ext0 + ext1, 0.008, t + 0.002]} />
              </mesh>
            );
          })}
        {seg.wall.openings
          .filter((o) => o.type === 'window')
          .map((o) => (
            <mesh key={o.id} position={[o.offset + o.width / 2, o.sill + o.height / 2, 0]} material={glass}>
              <planeGeometry args={[o.width, o.height]} />
            </mesh>
          ))}
      </group>
    </group>
  );
}
