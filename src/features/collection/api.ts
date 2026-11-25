import data from '@/data/collection.json';
import { withBase } from '@/lib/withBase';

/** Ready-made products from the Ngọc Minh workshop (migrated from sofamiennam.com.vn). */
export interface CollectionItem {
  code: string;
  slug: string;
  name: string;
  category: string;
  size: string | null;
  material: string | null;
  price: number | null;
  salePrice: number | null;
  images: string[];
  details: string[];
}

export interface CollectionCategory {
  id: string;
  label: string;
}

const categories = data.categories as CollectionCategory[];
const order = (id: string) => categories.findIndex((c) => c.id === id);
const items = (withBase(data.products) as CollectionItem[]).sort((a, b) => order(a.category) - order(b.category) || a.code.localeCompare(b.code));
const bySlug = new Map(items.map((p) => [p.slug, p]));

export const collection = {
  items: () => items,
  categories: () => categories,
  category: (id: string) => categories.find((c) => c.id === id),
  bySlug: (slug: string) => bySlug.get(slug),
  related: (p: CollectionItem, limit = 4) => items.filter((x) => x.slug !== p.slug && x.category === p.category).slice(0, limit),
};

/** Final selling price, or null when the old site listed it as "Liên hệ". */
export const finalPrice = (p: CollectionItem) => p.salePrice ?? p.price;

export const discountPct = (p: CollectionItem) =>
  p.price && p.salePrice ? Math.round((1 - p.salePrice / p.price) * 100) : 0;

export const CARE_NOTES = [
  'Không để hoá chất, dung môi tiếp xúc trực tiếp với sản phẩm (trừ chất làm sạch chuyên dụng do Ngọc Minh tư vấn).',
  'Tránh ánh nắng rọi trực tiếp: tia cực tím làm lão hoá lớp sơn, bạc màu vải, da hoặc simili.',
  'Không đặt sản phẩm ở môi trường khắc nghiệt, nóng lạnh đột ngột.',
];

export const WARRANTY_NOTE =
  'Tất cả sản phẩm của Ngọc Minh được bảo hành từ 01 đến 03 năm (tuỳ sản phẩm) và bảo trì vĩnh viễn. Trong thời gian bảo trì, Ngọc Minh hỗ trợ chi phí nhân công sửa chữa; khách hàng chỉ trả chi phí thay thế phụ kiện hư hỏng (nếu có).';
