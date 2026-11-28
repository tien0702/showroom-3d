import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { brand } from './config';
import s from './layout.module.css';

const KEY = 'ngocminh.splash.seen';
const SHOW_MS = 1900;

/** Welcome screen with the logo and name, shown once per browser session. */
export function Splash() {
  const [show, setShow] = useState(() => {
    try {
      return !sessionStorage.getItem(KEY) && !navigator.webdriver;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!show) return;
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {
      /* private mode */
    }
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => setShow(false), SHOW_MS);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = '';
    };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={s.splash}
          role="presentation"
          onClick={() => setShow(false)}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: [0.65, 0, 0.35, 1] } }}
        >
          <motion.img
            src={brand.logo}
            alt={brand.name}
            className={s.splashLogo}
            initial={{ opacity: 0, scale: 0.86, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          />
          <motion.p className={s.splashWelcome} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.5 }}>
            Chào mừng đến với
          </motion.p>
          <motion.h1 className={s.splashName} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}>
            {brand.name}
          </motion.h1>
          <motion.span className={s.splashBar} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3, duration: SHOW_MS / 1000 - 0.4, ease: 'linear' }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
