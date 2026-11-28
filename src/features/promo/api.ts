import data from '@/data/banners.json';
import { withBase } from '@/lib/withBase';

export interface Banner {
  id: string;
  /** Image path ("/images/...") or full URL. Any aspect ratio — it is cropped to fill the frame. */
  image: string;
  title?: string;
  subtitle?: string;
  /** In-site path to open on click. */
  link?: string;
}

/** Ad banners shown on the home page. Edit `src/data/banners.json` to change them. */
export const banners: Banner[] = (data.banners as Banner[]).map((b) => ({ ...b, image: withBase(b.image) }));

export const bannerInterval: number = data.intervalMs ?? 4500;
