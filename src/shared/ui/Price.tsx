import { AnimatePresence, motion } from 'motion/react';
import { formatPrice } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

interface PriceProps {
  value: number;
  className?: string;
  /** Animate when the value changes. */
  animated?: boolean;
}

export function Price({ value, className, animated }: PriceProps) {
  const text = formatPrice(value);
  if (!animated) return <span className={cn('nowrap tabular', className)}>{text}</span>;
  return (
    <span className={cn('nowrap tabular', className)} style={{ display: 'inline-grid', overflow: 'hidden' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={text}
          initial={{ y: '60%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-60%', opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ gridArea: '1 / 1' }}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
