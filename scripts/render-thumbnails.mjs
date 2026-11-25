/**
 * Renders product + showroom images from the 3D models into public/images.
 * Usage:  npm run dev   (in another terminal)
 *         CHROME_PATH="/path/to/chrome" npm run thumbnails
 * Requires a local Chrome/Chromium; uses playwright-core (no browser download).
 */
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const CHROME = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const catalog = JSON.parse(await readFile(new URL('../src/data/catalog.json', import.meta.url)));
const showrooms = JSON.parse(await readFile(new URL('../src/data/showrooms.json', import.meta.url)));
const only = process.argv[2];

await mkdir(new URL('../public/images/products/', import.meta.url), { recursive: true });
await mkdir(new URL('../public/images/showrooms/', import.meta.url), { recursive: true });

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

async function shot(url, out, size, opaque) {
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__captureReady === true, null, { timeout: 30000 });
  const png = await page.screenshot({ omitBackground: !opaque });
  await sharp(png).webp({ quality: 86, alphaQuality: 90 }).toFile(new URL(`../public/images/${out}`, import.meta.url).pathname);
  await page.close();
  console.log('✓', out);
}

for (const p of catalog.products) {
  if (only && !p.sku.includes(only)) continue;
  await shot(`/__capture?sku=${p.sku}&az=35`, `products/${p.slug}.webp`, { width: 800, height: 800 });
  await shot(`/__capture?sku=${p.sku}&az=-50`, `products/${p.slug}-angle.webp`, { width: 800, height: 800 });
}
for (const s of showrooms.showrooms) {
  if (only && only !== "rooms" && !s.id.includes(only)) continue;
  await shot(`/__capture?room=${s.id}`, `showrooms/${s.id}.webp`, { width: 1200, height: 900 }, true);
}
await browser.close();
