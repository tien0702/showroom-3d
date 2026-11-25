import { AnimatePresence, motion } from 'motion/react';
import { IconButton, Icons } from '@/shared/ui';
import { cartCount, useCart } from './store';
import s from './cart.module.css';

export function CartButton() {
  const lines = useCart((c) => c.lines);
  const pulse = useCart((c) => c.pulse);
  const setOpen = useCart((c) => c.setOpen);
  const count = cartCount(lines);
  return (
    <IconButton
      label={count ? `Giỏ hàng (${count})` : 'Giỏ hàng'}
      icon={<Icons.IconBag />}
      onClick={() => setOpen(true)}
      tooltipSide="bottom"
      badge={
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              key={pulse}
              className={s.badge}
              initial={{ scale: 0.4 }}
              animate={{ scale: [1.35, 1] }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.4, ease: [0.2, 1.4, 0.4, 1] }}
            >
              {count > 99 ? '99+' : count}
            </motion.span>
          )}
        </AnimatePresence>
      }
    />
  );
}
