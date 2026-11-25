import { useMemo } from 'react';
import { MeshStandardMaterial } from 'three';
import type { MaterialSlot, Product } from '@/types';
import { variantOf } from '@/features/catalog/api';

export type SlotMaterials = Record<MaterialSlot, MeshStandardMaterial>;

const DEFAULTS: Record<MaterialSlot, string> = {
  fabric: '#d9d4ca',
  wood: '#c9a274',
  metal: '#2b2b2b',
  accent: '#e9e4da',
};

const FINISH: Record<MaterialSlot, { roughness: number; metalness: number }> = {
  fabric: { roughness: 0.95, metalness: 0 },
  wood: { roughness: 0.62, metalness: 0 },
  metal: { roughness: 0.35, metalness: 0.65 },
  accent: { roughness: 0.75, metalness: 0 },
};

const cache = new Map<string, MeshStandardMaterial>();

function material(slot: MaterialSlot, color: string) {
  const key = `${slot}:${color}`;
  let m = cache.get(key);
  if (!m) {
    m = new MeshStandardMaterial({ color, ...FINISH[slot] });
    cache.set(key, m);
  }
  return m;
}

/** Resolve the material for each slot from product defaults + chosen variant. */
export function useSlotMaterials(product: Product, variantId?: string): SlotMaterials {
  const variant = variantOf(product, variantId);
  return useMemo(() => {
    const out = {} as SlotMaterials;
    (Object.keys(DEFAULTS) as MaterialSlot[]).forEach((slot) => {
      const color = variant.materials[slot] ?? product.materials[slot] ?? DEFAULTS[slot];
      out[slot] = material(slot, color);
    });
    return out;
  }, [product, variant]);
}

/** Shared neutral materials used by several models. */
export const NEUTRAL = {
  linen: new MeshStandardMaterial({ color: '#f4f2ee', roughness: 0.95 }),
  leaf: new MeshStandardMaterial({ color: '#4f6b45', roughness: 0.8 }),
  leafDark: new MeshStandardMaterial({ color: '#3c5536', roughness: 0.8 }),
  soil: new MeshStandardMaterial({ color: '#3a2e25', roughness: 1 }),
  ink: new MeshStandardMaterial({ color: '#2b2b2b', roughness: 0.7 }),
  glowWarm: new MeshStandardMaterial({ color: '#fff6e0', emissive: '#ffd9a0', emissiveIntensity: 0.6, roughness: 0.9 }),
  books: ['#6f7a62', '#b86b4b', '#d3c3a5', '#3c3c3c', '#9a9a96'].map((c) => new MeshStandardMaterial({ color: c, roughness: 0.85 })),
};
