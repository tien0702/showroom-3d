import data from '@/data/catalog.json';
import { withBase } from '@/lib/withBase';
import { collection } from '@/features/collection/api';
import { toProduct } from '@/features/collection/toProducts';
import type { Category, CategoryId, Product, Variant } from '@/types';

/**
 * Catalog data access. Reads bundled sample data today;
 * swap the bodies for API calls when a backend exists — callers stay the same.
 */
const ngocMinh = collection
  .items()
  .map(toProduct)
  .filter((p): p is Product => p !== null);
/** Ngọc Minh products first, then the sample 3D catalogue. */
const products = [...ngocMinh, ...(withBase(data.products) as unknown as Product[])];
const categories = [...(data.categories as Category[])];
categories.splice(categories.findIndex((c) => c.id === 'dining') + 1, 0, { id: 'vanity', label: 'Bàn trang điểm' });
const bySku = new Map(products.map((p) => [p.sku, p]));
const bySlug = new Map(products.map((p) => [p.slug, p]));

export const catalog = {
  products: () => products,
  categories: () => categories,
  category: (id: CategoryId) => categories.find((c) => c.id === id),
  bySku: (sku: string) => bySku.get(sku),
  bySlug: (slug: string) => bySlug.get(slug),
  map: () => bySku,
  related: (p: Product, limit = 4) =>
    products.filter((x) => x.sku !== p.sku && (x.collection === p.collection || x.category === p.category)).slice(0, limit),
};

export function variantOf(product: Product, variantId?: string): Variant {
  return product.variants.find((v) => v.id === variantId) ?? product.variants[0];
}

export function priceOf(product: Product, variantId?: string): number {
  return product.price + variantOf(product, variantId).priceDelta;
}
