import { collection } from '@/features/collection/api';
import { toProduct } from '@/features/collection/toProducts';
import type { Category, CategoryId, Product, Variant } from '@/types';

/**
 * Catalog data access: the Ngọc Minh range turned into 3D products.
 * Swap the bodies for API calls when a backend exists — callers stay the same.
 */
const products = collection
  .items()
  .map(toProduct)
  .filter((p): p is Product => p !== null);

const CATEGORY_LABELS: Category[] = [
  { id: 'sofa', label: 'Sofa' },
  { id: 'bed', label: 'Giường' },
  { id: 'dining', label: 'Bàn ăn' },
  { id: 'vanity', label: 'Bàn trang điểm' },
];
/** Only categories that have products. */
const categories = CATEGORY_LABELS.filter((c) => products.some((p) => p.category === c.id));
const bySku = new Map(products.map((p) => [p.sku, p]));
const bySlug = new Map(products.map((p) => [p.slug, p]));

export const catalog = {
  products: () => products,
  categories: () => categories,
  category: (id: CategoryId) => categories.find((c) => c.id === id),
  bySku: (sku: string) => bySku.get(sku),
  bySlug: (slug: string) => bySlug.get(slug),
  map: () => bySku,
  related: (p: Product, limit = 4) => products.filter((x) => x.sku !== p.sku && x.category === p.category).slice(0, limit),
};

export function variantOf(product: Product, variantId?: string): Variant {
  return product.variants.find((v) => v.id === variantId) ?? product.variants[0];
}

export function priceOf(product: Product, variantId?: string): number {
  return product.price + variantOf(product, variantId).priceDelta;
}
