/**
 * Catalog domain types.
 * Units: metres for all dimensions, VND for prices.
 */

export type CategoryId =
  | 'sofa'
  | 'armchair'
  | 'coffee-table'
  | 'tv-stand'
  | 'bed'
  | 'nightstand'
  | 'storage'
  | 'dining'
  | 'lighting'
  | 'rug'
  | 'decor';

export interface Category {
  id: CategoryId;
  label: string;
}

/** Where an item can be placed in a room. */
export type Placement = 'floor' | 'wall' | 'onTop';

/** Material slots a 3D model exposes. Variants recolour these slots. */
export type MaterialSlot = 'fabric' | 'wood' | 'metal' | 'accent';

export interface Dimensions {
  /** Width along the item's local X axis. */
  w: number;
  /** Depth along the item's local Z axis (front faces +Z). */
  d: number;
  /** Height along Y. */
  h: number;
}

export interface Variant {
  id: string;
  label: string;
  /** Hex colour shown in the swatch. */
  swatch: string;
  /** Overrides per material slot. Slots not listed keep the product default. */
  materials: Partial<Record<MaterialSlot, string>>;
  /** Added to the base price. */
  priceDelta: number;
}

export interface PlacementRules {
  placement: Placement;
  /** Pull the item's back flush to the nearest wall when dragged close. */
  snapToWall: boolean;
  /** Gap kept between the item's back and the wall, metres. */
  wallGap: number;
  /** Participates in collision tests. Rugs set this to false. */
  collides: boolean;
  /** Height of the top surface other items can sit on, metres. */
  surfaceHeight: number | null;
  /** Mount height of the item's bottom edge for wall items, metres. */
  mountHeight: number | null;
  /** Free space required in front of the item, metres. */
  clearanceFront: number;
  /** Rotation snapping step, degrees. */
  rotationStep: number;
}

export interface ProductAssets {
  /** glTF binary. When null the procedural model is used. */
  glb: string | null;
  /** iOS Quick Look file for AR. */
  usdz: string | null;
  /** Square product image shown in cards and lists. */
  thumb: string;
  gallery: string[];
}

export interface Product {
  sku: string;
  slug: string;
  name: string;
  collection: string;
  category: CategoryId;
  price: number;
  /** Base material colours per slot. */
  materials: Partial<Record<MaterialSlot, string>>;
  variants: Variant[];
  dimensions: Dimensions;
  rules: PlacementRules;
  /** Key of the procedural model in the furniture registry. */
  model: string;
  assets: ProductAssets;
  highlights: string[];
}
