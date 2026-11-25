import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import type { FurnishLevel, RoomKind } from '@/types';
import { ROOM_KIND_LABEL, furnish, showroomApi } from '@/features/showroom/api';
import { catalog } from '@/features/catalog/api';
import { ProductCard } from '@/features/catalog/ProductCard';
import { outlineOf, polygonArea } from '@/features/planner/lib/geometry';
import { Chip, Icons, ImageFrame, Segmented } from '@/shared/ui';
import { formatArea } from '@/shared/lib/format';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import s from './pages.module.css';

const LEVELS: { value: FurnishLevel; label: string }[] = [
  { value: 'full', label: 'Đủ đồ' },
  { value: 'partial', label: 'Một phần' },
  { value: 'empty', label: 'Phòng trống' },
];

export default function ShowroomsPage() {
  useDocumentTitle();
  const [level, setLevel] = useState<FurnishLevel>('full');
  const [kind, setKind] = useState<RoomKind | 'all'>('all');
  const rooms = useMemo(() => showroomApi.list().filter((r) => kind === 'all' || r.kind === kind), [kind]);
  const kinds = useMemo(() => [...new Set(showroomApi.list().map((r) => r.kind))], []);
  const featured = catalog.products().slice(0, 4);

  return (
    <div className="container">
      <section className={s.hero}>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}>
          Chọn phòng để bắt đầu
        </motion.h1>
        <Segmented label="Mức đồ đạc" value={level} options={LEVELS} onChange={setLevel} />
      </section>

      <div className={s.filters} role="toolbar" aria-label="Loại phòng">
        <Chip active={kind === 'all'} onClick={() => setKind('all')}>Tất cả</Chip>
        {kinds.map((k) => (
          <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
            {ROOM_KIND_LABEL[k]}
          </Chip>
        ))}
      </div>

      <motion.div layout className={s.roomGrid}>
        <AnimatePresence mode="popLayout">
          {rooms.map((r, i) => {
            const n = furnish(r, level).length;
            return (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] } }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
              >
                <Link to={`/design/${r.id}?level=${level}`} className={s.roomCard}>
                  <div className={s.roomMedia}>
                    <ImageFrame src={r.cover} alt={r.name} ratio="4 / 3" fit="cover" rounded="none" />
                    <span className={s.roomCta}>
                      Vào thiết kế <Icons.IconArrowRight size={16} />
                    </span>
                  </div>
                  <div className={s.roomBody}>
                    <span className={`${s.roomName} truncate`} title={r.name}>{r.name}</span>
                    <span className={`${s.roomMeta} nowrap`}>
                      {formatArea(polygonArea(outlineOf(r.room)))} · {n} món
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      <section className={s.section}>
        <div className={s.sectionHead}>
          <h2>Sản phẩm xem được 3D</h2>
          <Link to="/products" className={s.more}>
            Tất cả <Icons.IconArrowRight size={16} />
          </Link>
        </div>
        <div className={s.productGrid}>
          {featured.map((p, i) => (
            <ProductCard key={p.sku} product={p} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
