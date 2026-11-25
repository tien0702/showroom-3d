import data from '@/data/catalog.json';
import { withBase } from '@/lib/withBase';
import type { Category, CategoryId, Product, Variant } from '@/types';

/**
 * Catalog data access. Reads bundled sample data today;
 * swap the bodies for API calls when a backend exists — callers stay the same.
 */
const products = withBase(data.products) as unknown as Product[];
const categories = data.categories as Category[];
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
