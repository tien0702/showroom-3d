import { useDeferredValue, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { CategoryId } from '@/types';
import { catalog } from '@/features/catalog/api';
import { Chip, Icons, ImageFrame, Price, Tooltip } from '@/shared/ui';
import { usePlanner } from '../store/plannerStore';
import s from './Planner.module.css';

const normalize = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();

export function CatalogPanel({ onAdded }: { onAdded?: () => void }) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<CategoryId | 'all'>('all');
  const q = useDeferredValue(query);
  const items = usePlanner((st) => st.items);
  const inRoom = useMemo(() => new Set(items.map((i) => i.sku)), [items]);
  const addProduct = usePlanner((st) => st.addProduct);

  const products = useMemo(() => {
    const nq = normalize(q.trim());
    return catalog
      .products()
      .filter((p) => (cat === 'all' || p.category === cat) && (!nq || normalize(`${p.name} ${p.collection}`).includes(nq)));
  }, [q, cat]);

  return (
    <div className={s.catalog}>
      <label className={s.search}>
        <Icons.IconSearch size={18} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm sản phẩm" aria-label="Tìm sản phẩm" />
        {query && (
          <button className={s.searchClear} onClick={() => setQuery('')} aria-label="Xóa tìm kiếm">
            <Icons.IconClose size={16} />
          </button>
        )}
      </label>
      <div className={s.chips} role="toolbar" aria-label="Danh mục">
        <Chip active={cat === 'all'} onClick={() => setCat('all')}>Tất cả</Chip>
        {catalog.categories().map((c) => (
          <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
            {c.label}
          </Chip>
        ))}
      </div>
      <div className={s.productGrid}>
        <AnimatePresence mode="popLayout" initial={false}>
          {products.map((p, i) => (
            <motion.div
              key={p.sku}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.025 } }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22 }}
            >
              <Tooltip label="Bấm để đặt vào phòng" side="right">
                {({ ref, ...aria }) => (
                  <button
                    ref={ref}
                    {...aria}
                    className={s.productCard}
                    onClick={() => {
                      addProduct(p.sku);
                      onAdded?.();
                    }}
                  >
                    <div className={s.productThumb}>
                      <ImageFrame src={p.assets.thumb} alt="" ratio="1" />
                      <span className={s.addBadge} aria-hidden>
                        <Icons.IconPlus size={16} />
                      </span>
                      <AnimatePresence>
                        {inRoom.has(p.sku) && (
                          <motion.span className={s.inRoom} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 24 }}>
                            <Icons.IconCheck size={12} />
                            <span className="sr-only">Đã có trong phòng</span>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <span className={`${s.productName} clamp-2`} title={p.name}>{p.name}</span>
                    <Price value={p.price} className={s.productPrice} />
                  </button>
                )}
              </Tooltip>
            </motion.div>
          ))}
        </AnimatePresence>
        {products.length === 0 && <p className={s.empty}>Không tìm thấy sản phẩm phù hợp</p>}
      </div>
    </div>
  );
}
