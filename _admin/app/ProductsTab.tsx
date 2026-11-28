import { useMemo, useState } from 'react';
import { api, move, pickFiles, slugify, useData, vnd, type Item } from './api';

const EMPTY: Item = { code: '', slug: '', name: '', category: 'sofa', size: '', material: '', price: null, salePrice: null, images: [], details: [], model3d: null, dimensions: null };

const num = (v: string) => {
  const n = parseInt(v.replace(/\D/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function ProductsTab() {
  const { data, save, toast } = useData();
  const { categories, products } = data.collection;
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [editing, setEditing] = useState<{ original: string | null; item: Item } | null>(null);

  const list = useMemo(() => {
    const nq = slugify(q);
    return products
      .filter((p) => (cat === 'all' || p.category === cat) && (!nq || slugify(`${p.code} ${p.name}`).includes(nq)))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [products, q, cat]);

  const catLabel = (id: string) => categories.find((c) => c.id === id)?.label ?? id;

  return (
    <div className="ad-split">
      <section className="ad-panel">
        <div className="ad-toolbar">
          <input className="ad-input" placeholder="Tìm mã hoặc tên…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="ad-input" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="all">Tất cả loại</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <button className="ad-btn primary" onClick={() => setEditing({ original: null, item: { ...EMPTY, category: cat === 'all' ? 'sofa' : cat } })}>
            + Thêm sản phẩm
          </button>
        </div>
        <p className="ad-muted">{list.length} sản phẩm</p>
        <ul className="ad-plist">
          {list.map((p) => (
            <li key={p.slug}>
              <button className={editing?.original === p.slug ? 'on' : ''} onClick={() => setEditing({ original: p.slug, item: structuredClone(p) })}>
                {p.images[0] ? <img src={p.images[0]} alt="" /> : <span className="ad-noimg">?</span>}
                <span className="ad-pmain">
                  <strong>
                    {p.code} · {p.name}
                  </strong>
                  <span className="ad-muted">
                    {catLabel(p.category)} · {vnd(p.salePrice ?? p.price)}
                  </span>
                </span>
                <span className="ad-tags">
                  {p.model3d && <span className="ad-tag blue">GLB</span>}
                  {!(p.salePrice ?? p.price) && <span className="ad-tag">Ẩn 3D</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="ad-panel">
        {editing ? (
          <ProductForm
            key={editing.original ?? 'new'}
            initial={editing.item}
            isNew={!editing.original}
            onCancel={() => setEditing(null)}
            onDelete={async () => {
              if (!confirm(`Xoá sản phẩm ${editing.item.code}? (ảnh vẫn giữ trong thư mục)`)) return;
              await save('collection', { ...data.collection, products: products.filter((p) => p.slug !== editing.original) }, 'Đã xoá sản phẩm');
              setEditing(null);
            }}
            onSave={async (item) => {
              const clash = products.find((p) => p.slug === item.slug && p.slug !== editing.original);
              if (clash) return toast(`Mã ${item.code} đã có rồi`, 'err');
              const next = editing.original ? products.map((p) => (p.slug === editing.original ? item : p)) : [...products, item];
              await save('collection', { ...data.collection, products: next }, editing.original ? 'Đã lưu sản phẩm' : 'Đã thêm sản phẩm');
              setEditing({ original: item.slug, item });
            }}
          />
        ) : (
          <div className="ad-empty">
            <p>Chọn một sản phẩm bên trái để sửa, hoặc bấm “Thêm sản phẩm”.</p>
            <p className="ad-muted">Sản phẩm có giá sẽ tự xuất hiện trong showroom 3D. Không có file GLB thì web dùng model dựng sẵn theo loại và kích thước.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function ProductForm({ initial, isNew, onSave, onCancel, onDelete }: { initial: Item; isNew: boolean; onSave: (i: Item) => Promise<void> | void; onCancel: () => void; onDelete: () => void }) {
  const { data, toast } = useData();
  const [it, setIt] = useState<Item>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const set = (patch: Partial<Item>) => setIt((x) => ({ ...x, ...patch }));
  const slug = slugify(it.code);
  const dims = it.dimensions;

  const uploadImages = async () => {
    if (!slug) return toast('Nhập mã sản phẩm trước', 'err');
    const files = await pickFiles('image/*', true);
    if (!files.length) return;
    setBusy('Đang tải ảnh…');
    try {
      const paths: string[] = [];
      for (const f of files) paths.push((await api.upload('product', `${slug}-${Date.now().toString(36)}`, f)).path);
      set({ images: [...it.images, ...paths] });
    } catch (e) {
      toast((e as Error).message, 'err');
    } finally {
      setBusy(null);
    }
  };

  const uploadModel = async () => {
    if (!slug) return toast('Nhập mã sản phẩm trước', 'err');
    const [f] = await pickFiles('.glb,model/gltf-binary');
    if (!f) return;
    setBusy('Đang tải model…');
    try {
      const { path } = await api.upload('model', slug, f);
      set({ model3d: `${path}?v=${Date.now().toString(36)}` });
      toast('Đã nhập model. Kiểm tra kích thước thật bên dưới.');
    } catch (e) {
      toast((e as Error).message, 'err');
    } finally {
      setBusy(null);
    }
  };

  const submit = async () => {
    if (!it.code.trim() || !it.name.trim()) return toast('Cần có mã và tên sản phẩm', 'err');
    setBusy('Đang lưu…');
    try {
      await onSave({
        ...it,
        code: it.code.trim().toUpperCase(),
        slug,
        name: it.name.trim(),
        size: it.size?.trim() || null,
        material: it.material?.trim() || null,
        details: it.details.map((d) => d.trim()).filter(Boolean),
        model3d: it.model3d || null,
        dimensions: dims && dims.w > 0 && dims.d > 0 && dims.h > 0 ? dims : null,
      });
    } finally {
      setBusy(null);
    }
  };

  const setDim = (k: 'w' | 'd' | 'h', cm: string) => {
    const v = parseFloat(cm) / 100;
    const base = dims ?? { w: 0, d: 0, h: 0 };
    set({ dimensions: { ...base, [k]: Number.isFinite(v) ? v : 0 } });
  };

  return (
    <div className="ad-form">
      <div className="ad-formHead">
        <h2>{isNew ? 'Sản phẩm mới' : `${initial.code} · ${initial.name}`}</h2>
        {!isNew && (
          <a className="ad-link" href={`/mau-ngoc-minh/${initial.slug}`} target="_blank" rel="noreferrer">
            Xem trên web ↗
          </a>
        )}
      </div>

      <div className="ad-grid2">
        <label>
          Mã sản phẩm *<input className="ad-input" value={it.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} placeholder="SF19" />
        </label>
        <label>
          Loại
          <select className="ad-input" value={it.category} onChange={(e) => set({ category: e.target.value })}>
            {data.collection.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="span2">
          Tên sản phẩm *<input className="ad-input" value={it.name} onChange={(e) => set({ name: e.target.value })} placeholder="Sofa Phòng Khách Góc L" />
        </label>
        <label>
          Kích thước (chữ)
          <input className="ad-input" value={it.size ?? ''} onChange={(e) => set({ size: e.target.value })} placeholder="2.8m x 1.7m" />
        </label>
        <label>
          Chất liệu
          <input className="ad-input" value={it.material ?? ''} onChange={(e) => set({ material: e.target.value })} placeholder="Vải, Da công nghiệp…" />
        </label>
        <label>
          Giá gốc (₫)
          <input className="ad-input" inputMode="numeric" value={it.price ?? ''} onChange={(e) => set({ price: num(e.target.value) })} placeholder="Trống = Liên hệ" />
        </label>
        <label>
          Giá khuyến mãi (₫)
          <input className="ad-input" inputMode="numeric" value={it.salePrice ?? ''} onChange={(e) => set({ salePrice: num(e.target.value) })} placeholder="Không bắt buộc" />
        </label>
      </div>

      <h3>Ảnh sản phẩm</h3>
      <div className="ad-images">
        {it.images.map((src, i) => (
          <figure key={src}>
            <img src={src} alt="" />
            {i === 0 && <span className="ad-tag">Ảnh chính</span>}
            <div className="ad-imgActions">
              <button title="Lên trước" onClick={() => set({ images: move(it.images, i, i - 1) })} disabled={i === 0}>
                ←
              </button>
              <button title="Ra sau" onClick={() => set({ images: move(it.images, i, i + 1) })} disabled={i === it.images.length - 1}>
                →
              </button>
              <button title="Bỏ ảnh" onClick={() => set({ images: it.images.filter((_, k) => k !== i) })}>
                ✕
              </button>
            </div>
          </figure>
        ))}
        <button className="ad-addImg" onClick={uploadImages}>
          + Thêm ảnh
        </button>
      </div>

      <h3>Model 3D</h3>
      <div className="ad-model">
        {it.model3d ? (
          <>
            <span className="ad-tag blue">GLB</span> <code>{it.model3d.split('?')[0]}</code>
            <button className="ad-btn ghost sm" onClick={() => set({ model3d: null })}>
              Bỏ model
            </button>
          </>
        ) : (
          <span className="ad-muted">Chưa có. Web đang dùng model dựng sẵn theo loại sản phẩm.</span>
        )}
        <button className="ad-btn sm" onClick={uploadModel}>
          {it.model3d ? 'Thay file .glb' : 'Nhập file .glb'}
        </button>
      </div>
      <p className="ad-muted">
        File GLB cần: đơn vị mét, gốc toạ độ ở tâm đáy, mặt trước hướng +Z. Kích thước thật bên dưới dùng để đặt đồ trong phòng (để trống thì tự đoán từ “Kích thước (chữ)”).
      </p>
      <div className="ad-grid3">
        {(['w', 'd', 'h'] as const).map((k) => (
          <label key={k}>
            {{ w: 'Rộng', d: 'Sâu', h: 'Cao' }[k]} (cm)
            <input className="ad-input" inputMode="numeric" value={dims?.[k] ? Math.round(dims[k] * 100) : ''} onChange={(e) => setDim(k, e.target.value)} placeholder="—" />
          </label>
        ))}
      </div>

      <h3>Mô tả chi tiết</h3>
      <textarea
        className="ad-input"
        rows={6}
        value={it.details.join('\n')}
        onChange={(e) => set({ details: e.target.value.split('\n') })}
        placeholder={'Mỗi dòng một ý, ví dụ:\nKhung gỗ dầu sấy chống mối mọt\nMút D40 không xẹp lún'}
      />

      <div className="ad-formFoot">
        {!isNew && (
          <button className="ad-btn danger" onClick={onDelete}>
            Xoá sản phẩm
          </button>
        )}
        <div className="ad-grow" />
        {busy && <span className="ad-muted">{busy}</span>}
        <button className="ad-btn ghost" onClick={onCancel}>
          Đóng
        </button>
        <button className="ad-btn primary" onClick={submit} disabled={!!busy}>
          {isNew ? 'Thêm sản phẩm' : 'Lưu thay đổi'}
        </button>
      </div>
    </div>
  );
}
