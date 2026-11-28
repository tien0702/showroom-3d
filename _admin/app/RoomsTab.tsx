import { useEffect, useState } from 'react';
import { api, slugify, useData, type Showroom } from './api';

const KINDS = [
  { id: 'living', label: 'Phòng khách' },
  { id: 'bedroom', label: 'Phòng ngủ' },
  { id: 'dining', label: 'Phòng ăn' },
  { id: 'studio', label: 'Studio' },
];

/* eslint-disable @typescript-eslint/no-explicit-any */
interface LocalDesign {
  items: any[];
  room?: any;
  updatedAt: number;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Designs the designer page saved in this browser (same localhost origin). */
function readDesigns(): Record<string, LocalDesign> {
  try {
    return JSON.parse(localStorage.getItem('ngocminh.designs.v1') ?? '{}').state?.saved ?? {};
  } catch {
    return {};
  }
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function RoomsTab() {
  const { data, save, toast } = useData();
  const rooms = data.showrooms.showrooms;
  const [designs, setDesigns] = useState(readDesigns);
  const [rendering, setRendering] = useState<string | null>(null);
  const [bust, setBust] = useState(0);
  const [creating, setCreating] = useState<{ from: string; name: string; style: string; kind: string } | null>(null);

  // Pick up designs made in another tab.
  useEffect(() => {
    const refresh = () => setDesigns(readDesigns());
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const changed = (r: Showroom) => {
    const d = designs[r.id];
    return d && (!same(d.items, r.items) || (d.room && !same(d.room, r.room))) ? d : null;
  };

  const writeRooms = (next: Showroom[], note: string) => save('showrooms', { showrooms: next }, note);

  const renderCover = async (id: string) => {
    setRendering(id);
    try {
      await api.renderCover(id);
      setBust(Date.now());
      toast('Đã chụp lại ảnh bìa từ phòng 3D');
    } catch (e) {
      toast(`Không chụp được ảnh bìa: ${(e as Error).message}`, 'err');
    } finally {
      setRendering(null);
    }
  };

  const overwrite = async (r: Showroom, d: LocalDesign) => {
    if (!confirm(`Ghi đè phòng mẫu “${r.name}” bằng bản bạn đang thiết kế (${d.items.length} món)?`)) return;
    await writeRooms(
      rooms.map((x) => (x.id === r.id ? { ...x, room: d.room ?? x.room, items: d.items } : x)),
      'Đã cập nhật phòng mẫu',
    );
    renderCover(r.id);
  };

  const create = async () => {
    if (!creating) return;
    const base = rooms.find((r) => r.id === creating.from)!;
    const d = designs[creating.from];
    const name = creating.name.trim();
    if (!name) return toast('Đặt tên cho phòng mẫu', 'err');
    let id = slugify(name) || `phong-${Date.now().toString(36)}`;
    while (rooms.some((r) => r.id === id)) id += '-2';
    const room = { ...(d?.room ?? base.room), id: `room-${id}`, name: KINDS.find((k) => k.id === creating.kind)?.label ?? base.room.name };
    const showroom: Showroom = { id, name, style: creating.style.trim() || base.style, kind: creating.kind, cover: `/images/showrooms/${id}.webp`, room, items: d?.items ?? base.items };
    await writeRooms([...rooms, showroom], 'Đã tạo phòng mẫu mới');
    setCreating(null);
    renderCover(id);
  };

  const patch = (id: string, p: Partial<Showroom>) => writeRooms(rooms.map((r) => (r.id === id ? { ...r, ...p } : r)), 'Đã lưu thông tin phòng');

  return (
    <section className="ad-panel">
      <div className="ad-formHead">
        <div>
          <h2>Phòng mẫu 3D</h2>
          <p className="ad-muted">
            Cách làm: bấm “Mở trình thiết kế”, chỉnh kích thước phòng, cửa và đặt đồ trong tab mới. Quay lại đây, bấm “Ghi đè” để cập nhật phòng mẫu đó, hoặc “Lưu thành phòng mới”. Ảnh bìa được chụp lại tự động.
          </p>
        </div>
      </div>

      <ul className="ad-rooms">
        {rooms.map((r) => {
          const d = changed(r);
          return (
            <li key={r.id}>
              <div className="ad-roomCover">
                <img src={`${r.cover}${bust ? `?t=${bust}` : ''}`} alt="" />
                {rendering === r.id && <span className="ad-overlay">Đang chụp ảnh bìa…</span>}
              </div>
              <div className="ad-roomBody">
                <div className="ad-grid2">
                  <label className="span2">
                    Tên phòng
                    <input className="ad-input" defaultValue={r.name} onBlur={(e) => e.target.value.trim() && e.target.value !== r.name && patch(r.id, { name: e.target.value.trim() })} />
                  </label>
                  <label>
                    Phong cách
                    <input className="ad-input" defaultValue={r.style} onBlur={(e) => e.target.value !== r.style && patch(r.id, { style: e.target.value.trim() })} />
                  </label>
                  <label>
                    Loại phòng
                    <select className="ad-input" value={r.kind} onChange={(e) => patch(r.id, { kind: e.target.value })}>
                      {KINDS.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="ad-muted">
                  {r.items.length} món · mã <code>{r.id}</code>
                </p>
                {d ? (
                  <div className="ad-notice">
                    <strong>Có bản thiết kế mới trên máy</strong> ({d.items.length} món{d.room ? ', đã đổi kích thước/cửa' : ''}, sửa lúc {new Date(d.updatedAt).toLocaleString('vi-VN')})
                    <div className="ad-rowActions">
                      <button className="ad-btn primary sm" onClick={() => overwrite(r, d)}>
                        Ghi đè phòng mẫu này
                      </button>
                      <button className="ad-btn sm" onClick={() => setCreating({ from: r.id, name: `${r.name} (mới)`, style: r.style, kind: r.kind })}>
                        Lưu thành phòng mới…
                      </button>
                    </div>
                  </div>
                ) : null}
                <div className="ad-rowActions">
                  <a className="ad-btn sm" href={`/design/${r.id}`} target="_blank" rel="noreferrer">
                    Mở trình thiết kế ↗
                  </a>
                  <button className="ad-btn ghost sm" onClick={() => renderCover(r.id)} disabled={!!rendering}>
                    Chụp lại ảnh bìa
                  </button>
                  {!d && (
                    <button className="ad-btn ghost sm" onClick={() => setCreating({ from: r.id, name: `${r.name} (bản sao)`, style: r.style, kind: r.kind })}>
                      Nhân bản
                    </button>
                  )}
                  <div className="ad-grow" />
                  {rooms.length > 1 && (
                    <button
                      className="ad-btn ghost sm danger"
                      onClick={() => confirm(`Xoá phòng mẫu “${r.name}”?`) && writeRooms(rooms.filter((x) => x.id !== r.id), 'Đã xoá phòng mẫu')}
                    >
                      Xoá
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {creating && (
        <div className="ad-modal" role="dialog" aria-label="Phòng mẫu mới" onClick={(e) => e.target === e.currentTarget && setCreating(null)}>
          <div className="ad-modalBox">
            <h2>Lưu thành phòng mẫu mới</h2>
            <p className="ad-muted">Lấy từ: {rooms.find((r) => r.id === creating.from)?.name}</p>
            <label>
              Tên phòng
              <input className="ad-input" autoFocus value={creating.name} onChange={(e) => setCreating({ ...creating, name: e.target.value })} />
            </label>
            <label>
              Phong cách
              <input className="ad-input" value={creating.style} onChange={(e) => setCreating({ ...creating, style: e.target.value })} />
            </label>
            <label>
              Loại phòng
              <select className="ad-input" value={creating.kind} onChange={(e) => setCreating({ ...creating, kind: e.target.value })}>
                {KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="ad-formFoot">
              <div className="ad-grow" />
              <button className="ad-btn ghost" onClick={() => setCreating(null)}>
                Huỷ
              </button>
              <button className="ad-btn primary" onClick={create}>
                Tạo phòng mẫu
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
