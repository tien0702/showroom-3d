import { useEffect, useState } from 'react';
import { api, move, pickFiles, useData, type Banner, type Banners } from './api';

const LINKS = [
  { value: '/', label: 'Trang chủ (phòng 3D)' },
  { value: '/products', label: 'Sản phẩm 3D' },
  { value: '/mau-ngoc-minh', label: 'Mẫu Ngọc Minh' },
  { value: '/gioi-thieu', label: 'Giới thiệu' },
];

export function BannersTab() {
  const { data, save, toast } = useData();
  const [draft, setDraft] = useState<Banners>(data.banners);
  const [busy, setBusy] = useState(false);
  useEffect(() => setDraft(data.banners), [data.banners]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(data.banners);

  const setBanner = (i: number, patch: Partial<Banner>) => setDraft((d) => ({ ...d, banners: d.banners.map((b, k) => (k === i ? { ...b, ...patch } : b)) }));

  const add = async (replace?: number) => {
    const files = await pickFiles('image/*', replace == null);
    if (!files.length) return;
    setBusy(true);
    try {
      const uploaded: Banner[] = [];
      for (const f of files) {
        const id = `b${Date.now().toString(36)}${uploaded.length}`;
        const { path } = await api.upload('banner', id, f);
        uploaded.push({ id, image: path, title: '', subtitle: '', link: '/mau-ngoc-minh' });
      }
      if (replace != null) setBanner(replace, { image: uploaded[0].image });
      else setDraft((d) => ({ ...d, banners: [...d.banners, ...uploaded] }));
    } catch (e) {
      toast((e as Error).message, 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="ad-panel">
      <div className="ad-formHead">
        <div>
          <h2>Ảnh quảng cáo trang chủ</h2>
          <p className="ad-muted">Các ảnh xếp chồng kiểu lá bài và tự thay nhau. Ảnh ngang (khoảng 16:7) đẹp nhất; ảnh vuông sẽ được cắt giữa.</p>
        </div>
        <label className="ad-inline">
          Đổi ảnh sau
          <input
            className="ad-input sm"
            type="number"
            min={2}
            max={20}
            value={Math.round(draft.intervalMs / 100) / 10}
            onChange={(e) => setDraft({ ...draft, intervalMs: Math.max(2, Math.min(20, parseFloat(e.target.value) || 4.5)) * 1000 })}
          />
          giây
        </label>
      </div>

      <ol className="ad-banners">
        {draft.banners.map((b, i) => (
          <li key={b.id}>
            <div className="ad-bannerImg">
              <img src={b.image} alt="" />
              <span className="ad-order">{i + 1}</span>
              <button className="ad-btn sm" onClick={() => add(i)} disabled={busy}>
                Thay ảnh
              </button>
            </div>
            <div className="ad-grid2">
              <label className="span2">
                Tiêu đề
                <input className="ad-input" value={b.title ?? ''} onChange={(e) => setBanner(i, { title: e.target.value })} placeholder="Không bắt buộc" />
              </label>
              <label className="span2">
                Dòng phụ
                <input className="ad-input" value={b.subtitle ?? ''} onChange={(e) => setBanner(i, { subtitle: e.target.value })} placeholder="Không bắt buộc" />
              </label>
              <label className="span2">
                Bấm vào mở trang
                <select className="ad-input" value={b.link ?? ''} onChange={(e) => setBanner(i, { link: e.target.value })}>
                  <option value="">Không mở gì</option>
                  {LINKS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                  {data.collection.products.map((p) => (
                    <option key={p.slug} value={`/mau-ngoc-minh/${p.slug}`}>
                      Sản phẩm {p.code} · {p.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="ad-rowActions">
              <button className="ad-btn ghost sm" onClick={() => setDraft({ ...draft, banners: move(draft.banners, i, i - 1) })} disabled={i === 0}>
                ↑ Lên
              </button>
              <button className="ad-btn ghost sm" onClick={() => setDraft({ ...draft, banners: move(draft.banners, i, i + 1) })} disabled={i === draft.banners.length - 1}>
                ↓ Xuống
              </button>
              <button className="ad-btn ghost sm danger" onClick={() => setDraft({ ...draft, banners: draft.banners.filter((_, k) => k !== i) })}>
                Xoá
              </button>
            </div>
          </li>
        ))}
      </ol>

      <div className="ad-formFoot">
        <button className="ad-btn" onClick={() => add()} disabled={busy}>
          {busy ? 'Đang tải…' : '+ Thêm ảnh'}
        </button>
        <div className="ad-grow" />
        {dirty && (
          <button className="ad-btn ghost" onClick={() => setDraft(data.banners)}>
            Huỷ thay đổi
          </button>
        )}
        <button className="ad-btn primary" disabled={!dirty} onClick={() => save('banners', draft, 'Đã lưu ảnh quảng cáo')}>
          Lưu
        </button>
      </div>
    </section>
  );
}
