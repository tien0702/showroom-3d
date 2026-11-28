/**
 * Local admin API. Runs inside `npm run dev` only (never in the GitHub Pages build).
 * The admin page at /_admin/ calls these endpoints to edit the JSON data and
 * files in this repo, then commits + pushes so GitHub Pages redeploys.
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { promisify } from 'node:util';
import type { Plugin } from 'vite';

const run = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, '..');
const API = '/__admin/api';

/** Editable data files (key → path in repo). */
const DATA: Record<string, string> = {
  collection: 'src/data/collection.json',
  banners: 'src/data/banners.json',
  featured: 'src/data/featured.json',
  showrooms: 'src/data/showrooms.json',
};

/** Folders the admin may write uploads into. */
const UPLOAD_DIRS: Record<string, string> = {
  product: 'public/images/ngoc-minh',
  banner: 'public/images/banners',
  model: 'public/models',
};

/** What gets committed when publishing. */
const PUBLISH_PATHS = ['src/data', 'public/images', 'public/models'];

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean) as string[];

const safeName = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

async function body(req: IncomingMessage, limit = 60 * 1024 * 1024): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > limit) throw new Error('File quá lớn (tối đa 60 MB)');
    chunks.push(c as Buffer);
  }
  return Buffer.concat(chunks);
}

function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

async function git(...args: string[]) {
  const { stdout, stderr } = await run('git', args, { cwd: ROOT, maxBuffer: 10 * 1024 * 1024 });
  return (stdout + stderr).replace(/\s+$/, '');
}

async function handle(req: IncomingMessage, res: ServerResponse, origin: string) {
  // Connect strips the mount path, so req.url is already relative to API.
  const url = new URL(req.url ?? '/', 'http://local');
  const route = url.pathname.replace(/\/$/, '') || '/';
  const method = req.method ?? 'GET';

  // GET /data → all data files
  if (method === 'GET' && route === '/data') {
    const out: Record<string, unknown> = {};
    for (const [k, file] of Object.entries(DATA)) out[k] = JSON.parse(await readFile(path.join(ROOT, file), 'utf8'));
    return send(res, 200, out);
  }

  // PUT /data/<key> → overwrite one data file
  const m = route.match(/^\/data\/(\w+)$/);
  if (method === 'PUT' && m) {
    const file = DATA[m[1]];
    if (!file) return send(res, 404, { error: 'Không có dữ liệu này' });
    const json = JSON.parse((await body(req)).toString('utf8'));
    await writeFile(path.join(ROOT, file), JSON.stringify(json, null, 2) + '\n');
    return send(res, 200, { ok: true });
  }

  // POST /upload?kind=product|banner|model&name=<base name> (raw file body)
  if (method === 'POST' && route === '/upload') {
    const kind = url.searchParams.get('kind') ?? '';
    const dir = UPLOAD_DIRS[kind];
    if (!dir) return send(res, 400, { error: 'Loại file không hợp lệ' });
    const base = safeName(url.searchParams.get('name') ?? '') || `file-${Date.now()}`;
    const buf = await body(req);
    await mkdir(path.join(ROOT, dir), { recursive: true });

    if (kind === 'model') {
      if (buf.subarray(0, 4).toString('latin1') !== 'glTF') return send(res, 400, { error: 'Chỉ nhận file .glb (glTF nhị phân)' });
      const name = `${base}.glb`;
      await writeFile(path.join(ROOT, dir, name), buf);
      return send(res, 200, { path: `/${dir.replace(/^public\//, '')}/${name}`, size: buf.length });
    }

    // Images: convert to WebP, max 1600 px wide (banners 2000 px).
    const sharp = (await import('sharp')).default;
    const name = `${base}.webp`;
    await sharp(buf)
      .rotate()
      .resize({ width: kind === 'banner' ? 2000 : 1600, withoutEnlargement: true })
      .webp({ quality: 84 })
      .toFile(path.join(ROOT, dir, name));
    return send(res, 200, { path: `/${dir.replace(/^public\//, '')}/${name}` });
  }

  // POST /render-cover?id=<showroom id> → render the cover image from the 3D room
  if (method === 'POST' && route === '/render-cover') {
    const id = safeName(url.searchParams.get('id') ?? '');
    const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
    if (!chrome) return send(res, 500, { error: 'Không tìm thấy Chrome. Đặt biến CHROME_PATH rồi chạy lại.' });
    try {
      const { stdout } = await run('node', ['scripts/render-thumbnails.mjs', id], {
        cwd: ROOT,
        env: { ...process.env, BASE_URL: origin, CHROME_PATH: chrome },
        timeout: 120_000,
      });
      return send(res, 200, { ok: true, log: stdout.trim(), cover: `/images/showrooms/${id}.webp` });
    } catch (e) {
      return send(res, 500, { error: (e as Error).message });
    }
  }

  // GET /git → pending changes
  if (method === 'GET' && route === '/git') {
    const status = await git('status', '--porcelain', '--', ...PUBLISH_PATHS);
    const branch = await git('rev-parse', '--abbrev-ref', 'HEAD');
    const remote = await git('remote', 'get-url', 'origin').catch(() => '');
    const other = (await git('status', '--porcelain')).split('\n').filter((l) => l && !PUBLISH_PATHS.some((p) => l.slice(3).startsWith(p)));
    return send(res, 200, { branch, remote, changes: status ? status.split('\n') : [], otherChanges: other });
  }

  // POST /publish {message} → commit data + uploads, push
  if (method === 'POST' && route === '/publish') {
    const { message } = JSON.parse((await body(req)).toString('utf8') || '{}') as { message?: string };
    const log: string[] = [];
    try {
      await git('add', '--', ...PUBLISH_PATHS);
      const staged = await git('diff', '--cached', '--name-only', '--', ...PUBLISH_PATHS);
      if (staged) log.push(await git('commit', '-m', (message || 'Cập nhật nội dung từ trang quản trị').slice(0, 200), '--', ...PUBLISH_PATHS));
      else log.push('Không có thay đổi mới để commit.');
      log.push(await git('push'));
      return send(res, 200, { ok: true, log: log.join('\n\n') });
    } catch (e) {
      log.push((e as { stderr?: string }).stderr || (e as Error).message);
      return send(res, 500, { error: 'Đăng lên thất bại', log: log.join('\n\n') });
    }
  }

  send(res, 404, { error: 'Không tìm thấy' });
}

export function adminPlugin(): Plugin {
  return {
    name: 'local-admin',
    apply: 'serve',
    configureServer(server) {
      // /_admin → /_admin/ so the admin's relative assets resolve.
      server.middlewares.use((req, res, next) => {
        if (req.url === '/_admin') {
          res.statusCode = 302;
          res.setHeader('Location', '/_admin/');
          return res.end();
        }
        next();
      });
      server.middlewares.use(API, (req, res) => {
        // A custom header can't be sent cross-site without a CORS preflight, which we never allow.
        if (req.headers['x-admin'] !== '1') return send(res, 403, { error: 'Forbidden' });
        const origin = `http://${req.headers.host ?? 'localhost:5173'}`;
        handle(req, res, origin).catch((e) => send(res, 500, { error: (e as Error).message }));
      });
    },
  };
}
