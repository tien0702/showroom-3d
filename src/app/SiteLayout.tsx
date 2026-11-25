import { useState, type ReactNode } from 'react';
import { NavLink, Link, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { brand } from './config';
import { CartButton } from '@/features/cart/CartButton';
import s from './layout.module.css';

const NAV = [
  { to: '/', label: 'Showroom 3D', end: true },
  { to: '/products', label: 'Sản phẩm 3D', end: false },
  { to: '/mau-ngoc-minh', label: 'Mẫu Ngọc Minh', end: false },
  { to: '/gioi-thieu', label: 'Giới thiệu', end: false },
];

/** Keeps the outgoing page's content during the exit animation. */
function Frozen({ children }: { children: ReactNode }) {
  const [node] = useState(children);
  return <>{node}</>;
}

export function SiteLayout() {
  const location = useLocation();
  const outlet = useOutlet();
  return (
    <div className={s.site}>
      <header className={s.header}>
        <div className={`container ${s.headerInner}`}>
          <Link to="/" className={s.logo} aria-label={`${brand.name} – Trang chủ`}>
            <span className={s.logoMark}>
              <img src={brand.mark} alt="" />
            </span>
            <span className={`${s.logoText} truncate`}>{brand.name}</span>
          </Link>
          <nav className={s.nav} aria-label="Chính">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `${s.navLink} ${isActive ? s.navActive : ''}`}>
                {({ isActive }) => (
                  <>
                    <span className="nowrap">{n.label}</span>
                    {isActive && <motion.span layoutId="nav-underline" className={s.navUnderline} transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className={s.headerEnd}>
            <CartButton />
          </div>
        </div>
      </header>
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          className={s.main}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <Frozen>{outlet}</Frozen>
        </motion.main>
      </AnimatePresence>
      <footer className={s.footer}>
        <div className={`container ${s.footerGrid}`}>
          <div className={s.footerBrand}>
            <img src={brand.logo} alt={brand.name} className={s.footerLogo} />
          </div>
          <div className={s.footerCol}>
            <strong>{brand.legalName}</strong>
            <span>{brand.address}</span>
            <a href={`tel:${brand.hotlineTel}`}>Hotline: {brand.hotline}</a>
            <a href={`mailto:${brand.email}`}>Email: {brand.email}</a>
          </div>
          <nav className={s.footerCol} aria-label="Liên kết">
            <strong>Khám phá</strong>
            {NAV.map((n) => (
              <Link key={n.to} to={n.to}>
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className={`container ${s.footerInner}`}>
          <span className="truncate">
            © {new Date().getFullYear()} {brand.legalName}
          </span>
        </div>
      </footer>
    </div>
  );
}
