import { createContext, useContext } from 'react';

/** Shapes of the data files (kept loose: the admin edits them as plain JSON). */
export interface Category {
  id: string;
  label: string;
}
export interface Dims {
  w: number;
  d: number;
  h: number;
}
export interface Item {
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
  model3d?: string | null;
  dimensions?: Dims | null;
}
export interface Collection {
  categories: Category[];
  products: Item[];
}
export interface Banner {
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
  link?: string;
}
export interface Banners {
  intervalMs: number;
  banners: Banner[];
}
export interface Featured {
  title: string;
  slugs: string[];
}
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Showroom {
  id: string;
  name: string;
  style: string;
  kind: string;
  cover: string;
  room: any;
  items: any[];
}
/* eslint-enable @typescript-eslint/no-explicit-any */
export interface Showrooms {
  showrooms: Showroom[];
}
export interface AllData {
  collection: Collection;
  banners: Banners;
  featured: Featured;
  showrooms: Showrooms;
}
export type DataKey = keyof AllData;

const BASE = '/__admin/api';
const H = { 'x-admin': '1' };

async function json<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Lỗi ${res.status}`), { log: data.log });
  return data as T;
}

export const api = {
  load: () => fetch(`${BASE}/data`, { headers: H }).then((r) => json<AllData>(r)),
  save: <K extends DataKey>(key: K, value: AllData[K]) =>
    fetch(`${BASE}/data/${key}`, { method: 'PUT', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify(value) }).then((r) => json(r)),
  upload: (kind: 'product' | 'banner' | 'model', name: string, file: File) =>
    fetch(`${BASE}/upload?kind=${kind}&name=${encodeURIComponent(name)}`, { method: 'POST', headers: H, body: file }).then((r) => json<{ path: string }>(r)),
  renderCover: (id: string) => fetch(`${BASE}/render-cover?id=${encodeURIComponent(id)}`, { method: 'POST', headers: H }).then((r) => json<{ cover: string }>(r)),
  git: () => fetch(`${BASE}/git`, { headers: H }).then((r) => json<{ branch: string; remote: string; changes: string[]; otherChanges: string[] }>(r)),
  publish: (message: string) =>
    fetch(`${BASE}/publish`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) }).then((r) =>
      json<{ log: string }>(r),
    ),
};

export interface Ctx {
  data: AllData;
  save: <K extends DataKey>(key: K, value: AllData[K], note?: string) => Promise<void>;
  toast: (msg: string, kind?: 'ok' | 'err') => void;
}
export const DataCtx = createContext<Ctx | null>(null);
export const useData = () => useContext(DataCtx)!;

/** Vietnamese text → url-safe slug. */
export const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const vnd = (n: number | null | undefined) => (n ? `${new Intl.NumberFormat('vi-VN').format(n)} ₫` : '—');

/** Picks files with a hidden input. */
export function pickFiles(accept: string, multiple = false): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    input.onchange = () => resolve([...(input.files ?? [])]);
    input.click();
  });
}

export function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
}
