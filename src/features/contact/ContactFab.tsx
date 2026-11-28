import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { brand } from '@/app/config';
import { Icons } from '@/shared/ui';
import s from './contact.module.css';

const ZaloIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
    <text x="12" y="15.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="currentColor" fontFamily="Arial, sans-serif">
      Zalo
    </text>
  </svg>
);

const FbIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M14 8.5V6.8c0-.8.5-1 1-1h2.4V2.2L14.2 2C10.9 2 10 4.4 10 6.4v2.1H7.6V12H10v10h4V12h3l.4-3.5z" />
  </svg>
);

const LINKS = [
  { key: 'zalo', label: 'Chat Zalo', href: brand.zalo, icon: <ZaloIcon />, cls: s.zalo, external: true },
  { key: 'phone', label: `Gọi ${brand.hotline}`, href: `tel:${brand.hotlineTel}`, icon: <Icons.IconPhone size={20} />, cls: s.phone, external: false },
  { key: 'fb', label: 'Nhắn Facebook', href: brand.facebook, icon: <FbIcon />, cls: s.fb, external: true },
];

/** Floating contact button (Zalo / phone / Facebook), bottom-right on every page. */
export function ContactFab() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={root} className={s.root}>
      <AnimatePresence>
        {open && (
          <motion.ul className={s.list} initial="hide" animate="show" exit="hide" variants={{ show: { transition: { staggerChildren: 0.05, staggerDirection: -1 } } }}>
            {LINKS.map((l) => (
              <motion.li
                key={l.key}
                variants={{ hide: { opacity: 0, y: 12, scale: 0.9 }, show: { opacity: 1, y: 0, scale: 1 } }}
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              >
                <a href={l.href} className={s.item} {...(l.external ? { target: '_blank', rel: 'noreferrer' } : {})} onClick={() => setOpen(false)}>
                  <span className={s.itemLabel}>{l.label}</span>
                  <span className={`${s.itemIcon} ${l.cls}`}>{l.icon}</span>
                </a>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      <button type="button" className={s.fab} aria-expanded={open} aria-label={open ? 'Đóng liên hệ' : 'Liên hệ Zalo, điện thoại, Facebook'} onClick={() => setOpen((o) => !o)}>
        {!open && <span className={s.ring} aria-hidden />}
        <motion.span key={open ? 'x' : 'chat'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} className={s.fabIcon}>
          {open ? (
            <Icons.IconClose size={22} />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.5-5.2A8.5 8.5 0 1 1 21 12z" />
              <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth="2.6" />
            </svg>
          )}
        </motion.span>
      </button>
    </div>
  );
}
