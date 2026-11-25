import data from '@/data/showrooms.json';
import type { CategoryId, FurnishLevel, PlacedItem, Showroom } from '@/types';
import { catalog } from '@/features/catalog/api';
import { withBase } from '@/lib/withBase';

const showrooms = withBase(data.showrooms) as unknown as Showroom[];

/** Pieces kept when a showroom is shown "partially furnished". */
const ANCHOR_CATEGORIES: CategoryId[] = ['sofa', 'bed', 'tv-stand', 'dining', 'storage'];

export const showroomApi = {
  list: () => showrooms,
  get: (id: string) => showrooms.find((s) => s.id === id),
};

export function furnish(showroom: Showroom, level: FurnishLevel): PlacedItem[] {
  if (level === 'empty') return [];
  if (level === 'full') return showroom.items;
  return showroom.items.filter((it) => {
    const p = catalog.bySku(it.sku);
    return p && ANCHOR_CATEGORIES.includes(p.category);
  });
}

export const ROOM_KIND_LABEL: Record<Showroom['kind'], string> = {
  living: 'Phòng khách',
  bedroom: 'Phòng ngủ',
  dining: 'Phòng ăn',
  studio: 'Studio',
};

/** Best showroom to preview a product in. */
export function showroomFor(category: CategoryId): Showroom {
  const id =
    category === 'bed' || category === 'nightstand'
      ? 'minimal-bedroom'
      : category === 'dining'
        ? 'japandi-living'
        : 'nordic-living';
  return showroomApi.get(id) ?? showrooms[0];
}
