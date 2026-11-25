import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import s from './ui.module.css';

type Side = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  label: ReactNode;
  side?: Side;
  /** Keyboard shortcut shown next to the label. */
  shortcut?: string;
  children: (props: { 'aria-describedby'?: string; ref: (el: HTMLElement | null) => void }) => ReactNode;
}

const GAP = 8;

/**
 * Accessible tooltip rendered in a portal so it never clips inside scroll areas.
 * Shows on hover after a short delay and immediately on keyboard focus.
 */
export function Tooltip({ label, side = 'top', shortcut, children }: TooltipProps) {
  const id = useId();
  const anchor = useRef<HTMLElement | null>(null);
  const tip = useRef<HTMLDivElement | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number; side: Side }>({ x: 0, y: 0, side });

  const show = useCallback((delay: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), delay);
  }, []);
  const hide = useCallback(() => {
    window.clearTimeout(timer.current);
    setOpen(false);
  }, []);

  const handlers = useRef({
    enter: (e: PointerEvent) => {
      if (e.pointerType === 'mouse') show(350);
    },
    focus: () => {
      if (anchor.current?.matches(':focus-visible')) show(0);
    },
    hide: () => hide(),
  });

  const setRef = useCallback((el: HTMLElement | null) => {
    const h = handlers.current;
    const prev = anchor.current;
    if (prev) {
      prev.removeEventListener('pointerenter', h.enter);
      prev.removeEventListener('pointerleave', h.hide);
      prev.removeEventListener('focus', h.focus);
      prev.removeEventListener('blur', h.hide);
      prev.removeEventListener('pointerdown', h.hide);
    }
    anchor.current = el;
    if (el) {
      el.addEventListener('pointerenter', h.enter);
      el.addEventListener('pointerleave', h.hide);
      el.addEventListener('focus', h.focus);
      el.addEventListener('blur', h.hide);
      el.addEventListener('pointerdown', h.hide);
    }
  }, []);

  useLayoutEffect(() => {
    if (!open || !anchor.current || !tip.current) return;
    const a = anchor.current.getBoundingClientRect();
    const t = tip.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let sd = side;
    if (sd === 'top' && a.top - t.height - GAP < 4) sd = 'bottom';
    else if (sd === 'bottom' && a.bottom + t.height + GAP > vh - 4) sd = 'top';
    else if (sd === 'left' && a.left - t.width - GAP < 4) sd = 'right';
    else if (sd === 'right' && a.right + t.width + GAP > vw - 4) sd = 'left';
    let x = sd === 'left' ? a.left - t.width - GAP : sd === 'right' ? a.right + GAP : a.left + a.width / 2 - t.width / 2;
    let y = sd === 'top' ? a.top - t.height - GAP : sd === 'bottom' ? a.bottom + GAP : a.top + a.height / 2 - t.height / 2;
    x = Math.min(Math.max(4, x), vw - t.width - 4);
    y = Math.min(Math.max(4, y), vh - t.height - 4);
    setPos({ x, y, side: sd });
  }, [open, side, label]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const offset = { top: [0, 4], bottom: [0, -4], left: [4, 0], right: [-4, 0] }[pos.side];

  return (
    <>
      {children({ ref: setRef, 'aria-describedby': open ? id : undefined })}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={tip}
              id={id}
              role="tooltip"
              className={s.tooltip}
              style={{ left: pos.x, top: pos.y }}
              initial={{ opacity: 0, x: offset[0], y: offset[1], scale: 0.96 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.08 } }}
              transition={{ duration: 0.14, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <span>{label}</span>
              {shortcut && <kbd className={s.kbd}>{shortcut}</kbd>}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
