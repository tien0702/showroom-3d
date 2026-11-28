import { StrictMode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api, DataCtx, type AllData, type DataKey } from './api';
import { ProductsTab } from './ProductsTab';
import { BannersTab } from './BannersTab';
import { FeaturedTab } from './FeaturedTab';
import { RoomsTab } from './RoomsTab';
import { PublishBar } from './PublishBar';
import '@/styles/tokens.css';
import './admin.css';

const TABS = [
  { id: 'products', label: 'Sản phẩm & model 3D' },
  { id: 'banners', label: 'Ảnh quảng cáo' },
  { id: 'featured', label: 'Sản phẩm đề xuất' },
  { id: 'rooms', label: 'Phòng mẫu 3D' },
] as const;
type TabId = (typeof TABS)[number]['id'];

function App() {
  const [data, setData] = useState<AllData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>(() => (TABS.find((t) => `#${t.id}` === location.hash)?.id ?? 'products'));
  const [toastMsg, setToastMsg] = useState<{ msg: string; kind: 'ok' | 'err'; id: number } | null>(null);
  const [gitTick, setGitTick] = useState(0);

  useEffect(() => {
    api.load().then(setData, (e) => setError(e.message));
  }, []);
  useEffect(() => {
    history.replaceState(null, '', `#${tab}`);
  }, [tab]);

  const toast = useCallback((msg: string, kind: 'ok' | 'err' = 'ok') => setToastMsg({ msg, kind, id: Date.now() }), []);
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3200);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const save = useCallback(
    async <K extends DataKey>(key: K, value: AllData[K], note = 'Đã lưu') => {
      try {
        await api.save(key, value);
        setData((d) => (d ? { ...d, [key]: value } : d));
        setGitTick((n) => n + 1);
        toast(`${note}. Nhớ bấm “Đăng lên web” khi xong.`);
      } catch (e) {
        toast((e as Error).message, 'err');
        throw e;
      }
    },
    [toast],
  );

  if (error)
    return (
      <div className="ad-center">
        <h2>Không kết nối được máy chủ quản trị</h2>
        <p>Trang này chỉ chạy khi bạn mở dự án bằng <code>npm run dev</code> trên máy.</p>
        <p className="ad-muted">{error}</p>
      </div>
    );
  if (!data) return <div className="ad-center">Đang tải dữ liệu…</div>;

  return (
    <DataCtx.Provider value={{ data, save, toast }}>
      <div className="ad-shell">
        <header className="ad-header">
          <div className="ad-brand">
            <img src="/brand/mark.png" alt="" />
            <div>
              <strong>Quản trị Ngọc Minh</strong>
              <span>Chỉ chạy trên máy này</span>
            </div>
          </div>
          <nav className="ad-tabs">
            {TABS.map((t) => (
              <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>
          <a className="ad-link" href="/" target="_blank" rel="noreferrer">
            Xem web ↗
          </a>
        </header>
        <PublishBar tick={gitTick} />
        <main className="ad-main">
          {tab === 'products' && <ProductsTab />}
          {tab === 'banners' && <BannersTab />}
          {tab === 'featured' && <FeaturedTab />}
          {tab === 'rooms' && <RoomsTab />}
        </main>
        {toastMsg && (
          <div key={toastMsg.id} className={`ad-toast ${toastMsg.kind}`} role="status">
            {toastMsg.msg}
          </div>
        )}
      </div>
    </DataCtx.Provider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
