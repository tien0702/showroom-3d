import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
import type { Product } from '@/types';
import { useSlotMaterials } from './materials';
import { MODEL_REGISTRY } from './models';

interface FurnitureModelProps {
  product: Product;
  variant?: string;
}

/**
 * Renders a product at true scale with pivot at bottom-centre.
 * Uses the product's GLB when available, otherwise its procedural model.
 */
export function FurnitureModel({ product, variant }: FurnitureModelProps) {
  if (product.assets.glb) {
    return (
      <Suspense fallback={<Procedural product={product} variant={variant} />}>
        <GlbModel url={product.assets.glb} product={product} />
      </Suspense>
    );
  }
  return <Procedural product={product} variant={variant} />;
}

function Procedural({ product, variant }: FurnitureModelProps) {
  const m = useSlotMaterials(product, variant);
  const Model = MODEL_REGISTRY[product.model];
  if (!Model) {
    const { w, d, h } = product.dimensions;
    return (
      <mesh position={[0, h / 2, 0]} material={m.accent} castShadow>
        <boxGeometry args={[w, h, d]} />
      </mesh>
    );
  }
  return <Model dims={product.dimensions} m={m} />;
}

/** GLB path: normalises the file to the catalog dimensions in case the export is off. */
function GlbModel({ url, product }: { url: string; product: Product }) {
  const { scene } = useGLTF(url);
  const { object, scale } = useMemo(() => {
    const object = scene.clone(true);
    object.traverse((o) => {
      o.castShadow = true;
      o.receiveShadow = true;
    });
    const size = new Box3().setFromObject(object).getSize(new Vector3());
    const { w, d, h } = product.dimensions;
    const k = Math.min(w / (size.x || w), d / (size.z || d), h / (size.y || h));
    return { object, scale: Number.isFinite(k) && Math.abs(k - 1) > 0.02 ? k : 1 };
  }, [scene, product.dimensions]);
  return <primitive object={object} scale={scale} />;
}
