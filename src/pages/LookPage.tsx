import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { catalog, priceOf, variantOf } from '@/features/catalog/api';
import { showroomApi } from '@/features/showroom/api';
import { usePlanner } from '@/features/planner/store/plannerStore';
import { useCart } from '@/features/cart/store';
import { Button, Icons, ImageFrame, Price } from '@/shared/ui';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import s from './pages.module.css';

const LookScene = lazy(() => import('@/features/planner/components/scene/LookScene').then((m) => ({ default: m.LookScene })));

interface Line {
  key: string;
  sku: string;
  variant: string;
  qty: number;
}

export default function LookPage() {
  const { showroomId = '' } = useParams();
  const showroom = showroomApi.get(showroomId);
  const loaded = usePlanner((st) => st.showroomId);
  const items = usePlanner((st) => st.items);
  const addMany = useCart((c) => c.addMany);
  const setCartOpen = useCart((c) => c.setOpen);
  const [off, setOff] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  useDocumentTitle(showroom ? `Shop the look · ${showroom.name}` : undefined);

  useEffect(() => {
    if (showroom && loaded !== showroom.id) usePlanner.getState().load(showroom.id);
  }, [showroom, loaded]);

  const lines = useMemo<Line[]>(() => {
    const map = new Map<string, Line>();
    for (const it of items) {
      const key = `${it.sku}:${it.variant}`;
      const l = map.get(key);
      if (l) l.qty += 1;
      else map.set(key, { key, sku: it.sku, variant: it.variant, qty: 1 });
    }
    return [...map.values()];
  }, [items]);
  const markers = useMemo(() => new Map(lines.map((l, i) => [l.key, i + 1])), [lines]);

  if (!showroom) return <Navigate to="/" replace />;

  const chosen = lines.filter((l) => !off.has(l.key));
  const total = chosen.reduce((a, l) => {
    const p = catalog.bySku(l.sku);
    return p ? a + priceOf(p, l.variant) * l.qty : a;
  }, 0);
  const count = chosen.reduce((a, l) => a + l.qty, 0);

  const toggle = (key: string) => {
    setAdded(false);
    setOff((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className={`container ${s.look}`}>
      <div className={s.lookScene}>
        <Link to={`/design/${showroom.id}`} className={s.backPill}>
          <Icons.IconArrowLeft size={16} /> Sửa thiết kế
        </Link>
        <Suspense fallback={<div className={s.stageLoading}>Đang dựng phòng…</div>}>
          {loaded === showroom.id && <LookScene room={showroom.room} items={items} markers={markers} active={active} onHover={setActive} />}
        </Suspense>
      </div>

      <section className={s.lookPanel} aria-labelledby="look-title">
        <div className={s.lookHead}>
          <h1 id="look-title" className="clamp-2">{showroom.name}</h1>
          <span className={`${s.muted} nowrap`}>
            {count} / {items.length} món
          </span>
        </div>
        <ul className={s.lookList}>
          {lines.map((l, i) => {
            const p = catalog.bySku(l.sku);
            if (!p) return null;
            const on = !off.has(l.key);
            return (
              <motion.li
                key={l.key}
                className={s.lookRow}
                data-off={!on || undefined}
                data-active={active === l.key || undefined}
                onPointerEnter={() => setActive(l.key)}
                onPointerLeave={() => setActive(null)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <label className={s.check}>
                  <input type="checkbox" checked={on} onChange={() => toggle(l.key)} />
                  <span aria-hidden>
                    <Icons.IconCheck size={14} />
                  </span>
                  <span className="sr-only">Chọn {p.name}</span>
                </label>
                <span className={s.markerNum}>{markers.get(l.key)}</span>
                <Link to={`/products/${p.slug}`} className={s.lookThumb}>
                  <ImageFrame src={p.assets.thumb} alt="" ratio="1" />
                </Link>
                <div className={s.lookInfo}>
                  <Link to={`/products/${p.slug}`} className={`${s.lookName} clamp-2`} title={p.name}>
                    {p.name}
                  </Link>
                  <span className={`${s.muted} truncate`}>
                    {variantOf(p, l.variant).label}
                    {l.qty > 1 ? ` · ×${l.qty}` : ''}
                  </span>
                </div>
                <Price value={priceOf(p, l.variant) * l.qty} className={s.lookPrice} />
              </motion.li>
            );
          })}
        </ul>
        <div className={s.lookFoot}>
          <div className={s.totalRow}>
            <span>Tạm tính</span>
            <Price value={total} animated className={s.lookTotal} />
          </div>
          <AnimatePresence mode="wait" initial={false}>
            {added ? (
              <motion.div key="ok" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className={s.successRow}>
                <span className={s.success}>
                  <Icons.IconCheck size={18} /> Đã thêm {count} món
                </span>
                <Button variant="primary" size="lg" onClick={() => setCartOpen(true)}>
                  Xem giỏ
                </Button>
              </motion.div>
            ) : (
              <motion.div key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Button
                  variant="primary"
                  size="lg"
                  block
                  disabled={count === 0}
                  onClick={() => {
                    addMany(chosen.flatMap((l) => Array.from({ length: l.qty }, () => ({ sku: l.sku, variant: l.variant }))));
                    setAdded(true);
                  }}
                >
                  Thêm {count} món vào giỏ
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          <Button variant="secondary" block icon={<Icons.IconShare size={18} />} onClick={() => window.print()}>
            In báo giá
          </Button>
        </div>
      </section>
    </div>
  );
}
