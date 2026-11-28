import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import type { FurnishLevel, RoomKind } from '@/types';
import { ROOM_KIND_LABEL, furnish, showroomApi } from '@/features/showroom/api';
import { catalog } from '@/features/catalog/api';
import { ProductCard } from '@/features/catalog/ProductCard';
import { PromoCarousel } from '@/features/promo/PromoCarousel';
import { outlineOf, polygonArea } from '@/features/planner/lib/geometry';
import { Chip, Icons, ImageFrame, Segmented } from '@/shared/ui';
import { formatArea } from '@/shared/lib/format';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import s from './pages.module.css';

/** Pause between automatic steps of the room row. */
const AUTO_SCROLL_MS = 3800;

/** Distance between the starts of two neighbouring cards in a scroll row. */
function stepOf(el: HTMLElement) {
  const first = el.firstElementChild as HTMLElement | null;
  return first ? first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0') : el.clientWidth;
}

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
  const featured = catalog.featured();
  const gridRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const [hold, setHold] = useState(false);

  /** Scroll the room row by one card; wraps around at either end. */
  const scrollRooms = useCallback((dir: 1 | -1) => {
    const el = gridRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 2) return;
    const step = stepOf(el);
    let left = el.scrollLeft + dir * step;
    if (dir > 0 && el.scrollLeft >= max - 4) left = 0;
    else if (dir < 0 && el.scrollLeft <= 4) left = max;
    el.scrollTo({ left, behavior: 'smooth' });
  }, []);

  // Track which room is in view (drives the dots).
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      setActive(el.scrollLeft >= max - 4 ? rooms.length - 1 : Math.round(el.scrollLeft / stepOf(el)));
    };
    el.scrollTo({ left: 0 });
    setActive(0);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [kind, rooms.length]);

  // Auto-advance the row, looping back to the first room. Stops while the user interacts.
  useEffect(() => {
    if (hold || rooms.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => scrollRooms(1), AUTO_SCROLL_MS);
    return () => window.clearInterval(t);
  }, [hold, rooms.length, scrollRooms, kind]);

  return (
    <div className="container">
      <PromoCarousel />

      <section className={`${s.hero} ${s.heroCompact}`}>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}>
          Chọn phòng 3D
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

      <div
        className={s.roomRow}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHold(true)}
        onPointerLeave={() => setHold(false)}
        onTouchStart={() => setHold(true)}
        onFocusCapture={() => setHold(true)}
        onBlurCapture={() => setHold(false)}
      >
      <motion.div layout ref={gridRef} className={s.roomGrid}>
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
      {rooms.length > 1 && (
        <>
          <button type="button" className={`${s.rowArrow} ${s.rowPrev}`} aria-label="Phòng trước" onClick={() => scrollRooms(-1)}>
            <Icons.IconChevronLeft size={20} />
          </button>
          <button type="button" className={`${s.rowArrow} ${s.rowNext}`} aria-label="Phòng sau" onClick={() => scrollRooms(1)}>
            <Icons.IconChevronRight size={20} />
          </button>
        </>
      )}
      </div>
      {rooms.length > 1 && (
        <div className={s.swipeHint} aria-hidden>
          {rooms.map((r, i) => (
            <span key={r.id} data-active={i === active || undefined} />
          ))}
        </div>
      )}

      <section className={s.section}>
        <div className={s.sectionHead}>
          <h2>{featured.title}</h2>
          <Link to="/products" className={s.more}>
            Tất cả <Icons.IconArrowRight size={16} />
          </Link>
        </div>
        <div className={s.productGrid}>
          {featured.products.map((p, i) => (
            <ProductCard key={p.sku} product={p} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
