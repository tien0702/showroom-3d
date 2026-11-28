import { useEffect, useMemo, useState } from 'react';
import { move, slugify, useData, vnd, type Featured } from './api';

/** Pick and order the products shown under the room row on the home page. */
export function FeaturedTab() {
  const { data, save } = useData();
  const [draft, setDraft] = useState<Featured>(data.featured);
  const [q, setQ] = useState('');
  useEffect(() => setDraft(data.featured), [data.featured]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(data.featured);
  const bySlug = useMemo(() => new Map(data.collection.products.map((p) => [p.slug, p])), [data.collection.products]);
  // Only priced products exist in the 3D catalogue the home page draws from.
  const pool = data.collection.products
    .filter((p) => (p.salePrice ?? p.price) && !draft.slugs.includes(p.slug) && (!q || slugify(`${p.code} ${p.name}`).includes(slugify(q))))
    .sort((a, b) => a.code.localeCompare(b.code));

  return (
    <div className="ad-split">
      <section className="ad-panel">
        <h2>Sản phẩm đề xuất trên trang chủ</h2>
        <label>
          Tiêu đề mục
          <input className="ad-input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </label>
        <p className="ad-muted">Thứ tự dưới đây là thứ tự hiển thị. Nên chọn số chẵn (2 cột trên điện thoại).</p>
        <ol className="ad-plist numbered">
          {draft.slugs.map((slug, i) => {
            const p = bySlug.get(slug);
            return (
              <li key={slug}>
                <div className="ad-prow">
                  {p?.images[0] ? <img src={p.images[0]} alt="" /> : <span className="ad-noimg">?</span>}
                  <span className="ad-pmain">
                    <strong>{p ? `${p.code} · ${p.name}` : `${slug} (đã bị xoá)`}</strong>
                    <span className="ad-muted">{vnd(p?.salePrice ?? p?.price)}</span>
                  </span>
                  <button className="ad-btn ghost sm" onClick={() => setDraft({ ...draft, slugs: move(draft.slugs, i, i - 1) })} disabled={i === 0}>
                    ↑
                  </button>
                  <button className="ad-btn ghost sm" onClick={() => setDraft({ ...draft, slugs: move(draft.slugs, i, i + 1) })} disabled={i === draft.slugs.length - 1}>
                    ↓
                  </button>
                  <button className="ad-btn ghost sm danger" onClick={() => setDraft({ ...draft, slugs: draft.slugs.filter((s) => s !== slug) })}>
                    Bỏ
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
        {!draft.slugs.length && <p className="ad-muted">Chưa chọn sản phẩm nào: trang chủ sẽ hiện 4 sản phẩm đầu tiên.</p>}
        <div className="ad-formFoot">
          <div className="ad-grow" />
          {dirty && (
            <button className="ad-btn ghost" onClick={() => setDraft(data.featured)}>
              Huỷ thay đổi
            </button>
          )}
          <button className="ad-btn primary" disabled={!dirty} onClick={() => save('featured', draft, 'Đã lưu sản phẩm đề xuất')}>
            Lưu
          </button>
        </div>
      </section>

      <section className="ad-panel">
        <h2>Thêm vào đề xuất</h2>
        <input className="ad-input" placeholder="Tìm mã hoặc tên…" value={q} onChange={(e) => setQ(e.target.value)} />
        <ul className="ad-plist">
          {pool.map((p) => (
            <li key={p.slug}>
              <button onClick={() => setDraft({ ...draft, slugs: [...draft.slugs, p.slug] })}>
                {p.images[0] ? <img src={p.images[0]} alt="" /> : <span className="ad-noimg">?</span>}
                <span className="ad-pmain">
                  <strong>
                    {p.code} · {p.name}
                  </strong>
                  <span className="ad-muted">{vnd(p.salePrice ?? p.price)}</span>
                </span>
                <span className="ad-tag">+ Thêm</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
