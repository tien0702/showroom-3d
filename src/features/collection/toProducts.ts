import type { CategoryId, Dimensions, MaterialSlot, PlacementRules, Product, Variant } from '@/types';
import { finalPrice, type CollectionItem } from './api';

/**
 * Turns Ngọc Minh catalogue entries into 3D products for the planner.
 * Sizes come from the listed size; colours are the usual made-to-order options.
 */

type Palette = { id: string; label: string; color: string }[];

const LEATHER: Palette = [
  { id: 'grey', label: 'Xám', color: '#8f8f8c' },
  { id: 'cream', label: 'Kem', color: '#e6dccb' },
  { id: 'brown', label: 'Nâu bò', color: '#7a5236' },
  { id: 'black', label: 'Đen', color: '#2e2e2e' },
];
const FABRIC: Palette = [
  { id: 'light-grey', label: 'Xám nhạt', color: '#b9bcbd' },
  { id: 'cream', label: 'Kem', color: '#e7e0d3' },
  { id: 'blue', label: 'Xanh dương', color: '#5d7895' },
  { id: 'moss', label: 'Xanh rêu', color: '#6f7a62' },
];
const COWHIDE: Palette = [
  { id: 'brown', label: 'Nâu', color: '#6b4226' },
  { id: 'cream', label: 'Kem', color: '#e6dccb' },
];
const CHAIR: Palette = [
  { id: 'grey', label: 'Xám', color: '#8a8d90' },
  { id: 'cream', label: 'Kem', color: '#ddd3c2' },
  { id: 'teal', label: 'Xanh ngọc', color: '#3f6f72' },
  { id: 'orange', label: 'Cam đất', color: '#c0703d' },
];
const VANITY: Palette = [
  { id: 'white', label: 'Trắng', color: '#f1eee8' },
  { id: 'oak', label: 'Gỗ sồi', color: '#c9a274' },
  { id: 'walnut', label: 'Óc chó', color: '#6e4b33' },
];

const floor = (over: Partial<PlacementRules>): PlacementRules => ({
  placement: 'floor',
  snapToWall: true,
  wallGap: 0.03,
  collides: true,
  surfaceHeight: null,
  mountHeight: null,
  clearanceFront: 0.5,
  rotationStep: 15,
  ...over,
});

function paletteFor(item: CollectionItem): Palette {
  const mat = (item.material ?? '').toLowerCase();
  if (item.category === 'dining') return CHAIR;
  if (item.category === 'vanity') return VANITY;
  if (mat.includes('da bò')) return COWHIDE;
  if (mat.includes('da')) return LEATHER;
  return FABRIC;
}

/** Slots each colour option recolours. Upholstered beds use the colour for the frame too. */
function slotsFor(category: string): MaterialSlot[] {
  if (category === 'bed') return ['fabric', 'wood'];
  if (category === 'vanity') return ['wood'];
  return ['fabric'];
}

function shape(item: CollectionItem): { model: string; dims: Dimensions; category: CategoryId; rules: PlacementRules; base: Product['materials'] } {
  const size = item.size ?? '';
  switch (item.category) {
    case 'bed':
      return {
        model: 'bed',
        dims: { w: 1.86, d: 2.15, h: 1.15 },
        category: 'bed',
        rules: floor({ clearanceFront: 0.6, rotationStep: 90 }),
        base: { fabric: '#d8d2c6', wood: '#d8d2c6' },
      };
    case 'dining': {
      const six = /6\s*ghế/.test(size);
      return {
        model: six ? 'dining-set-6' : 'dining-set-4',
        dims: six ? { w: 1.6, d: 1.94, h: 0.86 } : { w: 1.2, d: 1.84, h: 0.86 },
        category: 'dining',
        rules: floor({ snapToWall: false, surfaceHeight: 0.75, clearanceFront: 0.3, rotationStep: 90 }),
        base: { accent: '#eeebe6', metal: '#232323' },
      };
    }
    case 'vanity':
      return {
        model: 'vanity',
        dims: { w: 1.0, d: 0.45, h: 1.45 },
        category: 'vanity',
        rules: floor({ clearanceFront: 0.6, rotationStep: 90 }),
        base: { metal: '#b89a5e', fabric: '#e6dccb' },
      };
    default: {
      const m = size.match(/([\d.]+)\s*m\s*x\s*([\d.]+)\s*m/);
      if (m) {
        return {
          model: 'sofa-corner',
          dims: { w: parseFloat(m[1]), d: parseFloat(m[2]), h: 0.85 },
          category: 'sofa',
          rules: floor({}),
          base: { metal: '#2b2b2b' },
        };
      }
      const len = parseFloat(size) || 2.2;
      return {
        model: 'sofa',
        dims: { w: len, d: 0.92, h: 0.85 },
        category: 'sofa',
        rules: floor({}),
        base: { wood: '#5a3b26' },
      };
    }
  }
}

export const NM_SKU_PREFIX = 'NM-';

export function toProduct(item: CollectionItem): Product | null {
  const price = finalPrice(item);
  if (!price) return null;
  const { model, dims, category, rules, base } = shape(item);
  const slots = slotsFor(item.category);
  const variants: Variant[] = paletteFor(item).map((p) => ({
    id: p.id,
    label: p.label,
    swatch: p.color,
    materials: Object.fromEntries(slots.map((s) => [s, p.color])),
    priceDelta: 0,
  }));
  return {
    sku: `${NM_SKU_PREFIX}${item.code}`,
    slug: `nm-${item.slug}`,
    name: `${item.name} ${item.code}`,
    collection: 'Ngọc Minh',
    category,
    price,
    materials: { ...base, ...variants[0].materials },
    variants,
    dimensions: item.dimensions ?? dims,
    rules,
    model,
    assets: { glb: item.model3d ?? null, usdz: null, thumb: item.images[0], gallery: item.images },
    highlights: item.details.filter((d) => !/NGỌC MINH$/i.test(d)).slice(0, 4),
  };
}
