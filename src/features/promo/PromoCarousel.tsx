import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, type PanInfo, type TargetAndTransition, type Transition } from 'motion/react';
import { Icons } from '@/shared/ui';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { banners, bannerInterval } from './api';
import s from './promo.module.css';

/** Cards visible in the pile; deeper ones wait hidden under the last. */
const VISIBLE = 3;
/** Length of the "pull the top card out and tuck it under" move, in seconds. */
const FLY_S = 0.8;
/** Point in the move (0–1) where the card passes behind the pile. */
const TUCK_AT = 0.42;

interface Pose {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  opacity: number;
}

/** Resting pose at a given depth: deeper cards shift up-right and tilt, so their edges show. */
function poseAt(depth: number, step: number): Pose {
  const d = Math.min(depth, VISIBLE - 1);
  return {
    x: d * step,
    y: -d * step,
    rotate: [0, 2.4, -1.8][d],
    scale: 1,
    opacity: depth < VISIBLE ? 1 : 0,
  };
}

type Fly = { id: string; kind: 'out' | 'in'; dir: 1 | -1 } | null;

/**
 * Ad banners as a pile of cards. Every few seconds (or on swipe) the top card
 * is pulled up and out, then tucked under the pile, revealing the next one.
 */
export function PromoCarousel() {
  const n = banners.length;
  const [index, setIndex] = useState(0);
  const [fly, setFly] = useState<Fly>(null);
  const [tucked, setTucked] = useState(false);
  const [paused, setPaused] = useState(false);
  const narrow = useMediaQuery('(max-width: 640px)');
  const reduce = useMediaQuery('(prefers-reduced-motion: reduce)');
  const step = narrow ? 7 : 12;
  const busy = useRef(false);

  const go = useCallback(
    (delta: 1 | -1, dir: 1 | -1 = delta) => {
      if (busy.current || n < 2) return;
      busy.current = true;
      // Next: the current top card flies out. Prev: the bottom card flies back on top.
      const id = delta > 0 ? banners[index].id : banners[(index - 1 + n) % n].id;
      setFly({ id, kind: delta > 0 ? 'out' : 'in', dir });
      setTucked(false);
      setIndex((i) => (i + delta + n) % n);
      window.setTimeout(() => setTucked(true), FLY_S * TUCK_AT * 1000);
      window.setTimeout(() => {
        setFly(null);
        busy.current = false;
      }, FLY_S * 1000);
    },
    [index, n],
  );

  useEffect(() => {
    if (paused || n < 2 || reduce) return;
    const t = window.setTimeout(() => go(1, 1), bannerInterval);
    return () => window.clearTimeout(t);
  }, [index, paused, go, n, reduce]);

  if (!n) return null;

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 50 || Math.abs(info.velocity.x) > 400) go(1, info.offset.x < 0 ? -1 : 1);
  };

  return (
    <section
      className={s.root}
      aria-roledescription="carousel"
      aria-label="Khuyến mãi"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div className={s.stage} style={{ ['--peek' as string]: `${step * (VISIBLE - 1)}px` }}>
        {banners.map((b, i) => {
          const depth = (i - index + n) % n;
          const rest = poseAt(depth, step);
          const flying = fly?.id === b.id;
          const top = depth === 0;

          // Pile order; a flying card stays above the pile until it passes behind it (or comes out from behind).
          let z = n - depth;
          if (flying) z = fly.kind === 'out' ? (tucked ? 0 : n + 1) : tucked ? n + 1 : 0;

          let animate: TargetAndTransition = { ...rest };
          let transition: Transition = { type: 'spring', stiffness: 240, damping: 28 };
          if (flying && !reduce) {
            const out = { x: fly.dir * (narrow ? 200 : 380), y: narrow ? -40 : -70, rotate: fly.dir * 13 };
            const from = fly.kind === 'in' ? poseAt(VISIBLE - 1, step) : null;
            animate = {
              x: [from ? from.x : null, out.x, rest.x],
              y: [from ? from.y : null, out.y, rest.y],
              rotate: [from ? from.rotate : null, out.rotate, rest.rotate],
              scale: [null, 0.96, rest.scale],
              opacity: [null, 1, rest.opacity],
            };
            transition = { duration: FLY_S, times: [0, TUCK_AT, 1], ease: ['easeOut', [0.4, 0, 0.2, 1]] };
          }

          return (
            <motion.div
              key={b.id}
              className={s.card}
              style={{ zIndex: z }}
              initial={false}
              animate={animate}
              transition={transition}
              drag={top && !fly && n > 1 ? 'x' : false}
              dragSnapToOrigin
              dragElastic={0.5}
              onDragEnd={top ? onDragEnd : undefined}
              aria-hidden={!top}
              data-top={top || undefined}
            >
              <Link
                to={b.link || '#'}
                className={s.link}
                tabIndex={top ? 0 : -1}
                draggable={false}
                onClick={(e) => (!top || !b.link) && e.preventDefault()}
              >
                <img src={b.image} alt={b.title ?? ''} className={s.img} draggable={false} />
                {(b.title || b.subtitle) && (
                  <div className={s.caption}>
                    {b.title && <strong>{b.title}</strong>}
                    {b.subtitle && <span>{b.subtitle}</span>}
                  </div>
                )}
              </Link>
            </motion.div>
          );
        })}
        {n > 1 && (
          <>
            <button type="button" className={`${s.arrow} ${s.prev}`} aria-label="Ảnh trước" onClick={() => go(-1)}>
              <Icons.IconChevronLeft size={20} />
            </button>
            <button type="button" className={`${s.arrow} ${s.next}`} aria-label="Ảnh sau" onClick={() => go(1)}>
              <Icons.IconChevronRight size={20} />
            </button>
          </>
        )}
      </div>
      {n > 1 && (
        <div className={s.dots} aria-hidden>
          {banners.map((b, i) => (
            <span key={b.id} className={s.dot} data-active={i === index || undefined}>
              {i === index && !paused && !reduce && <span key={index} className={s.dotFill} style={{ animationDuration: `${bannerInterval}ms` }} />}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
