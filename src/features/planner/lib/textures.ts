import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

const cache = new Map<string, CanvasTexture>();

/** Procedural wood-plank texture tinted to `base`. 1 repeat ≈ 1.2 m. */
export function plankTexture(base: string): CanvasTexture {
  const hit = cache.get(base);
  if (hit) return hit;
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  const rows = 6;
  const rh = size / rows;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let r = 0; r < rows; r++) {
    let x = -rnd() * size * 0.5;
    while (x < size) {
      const len = size * (0.45 + rnd() * 0.5);
      const shade = (rnd() - 0.5) * 0.12;
      g.fillStyle = shade > 0 ? `rgba(255,255,255,${shade})` : `rgba(60,40,20,${-shade})`;
      g.fillRect(x, r * rh, len, rh);
      for (let k = 0; k < 6; k++) {
        g.strokeStyle = `rgba(80,55,30,${0.03 + rnd() * 0.04})`;
        g.lineWidth = 1;
        const y = r * rh + rnd() * rh;
        g.beginPath();
        g.moveTo(x, y);
        g.bezierCurveTo(x + len * 0.3, y + (rnd() - 0.5) * 6, x + len * 0.6, y + (rnd() - 0.5) * 6, x + len, y);
        g.stroke();
      }
      g.fillStyle = 'rgba(50,35,20,0.28)';
      g.fillRect(x + len - 1, r * rh, 1.5, rh);
      x += len;
    }
    g.fillStyle = 'rgba(50,35,20,0.3)';
    g.fillRect(0, r * rh, size, 1.5);
  }
  const tex = new CanvasTexture(c);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  cache.set(base, tex);
  return tex;
}
