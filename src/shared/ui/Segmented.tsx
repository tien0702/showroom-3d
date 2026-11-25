import { useId } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/shared/lib/cn';
import s from './ui.module.css';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** Segmented control with a sliding indicator. */
export function Segmented<T extends string>({ value, options, onChange, label, size = 'md', className }: SegmentedProps<T>) {
  const layoutId = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cn(s.seg, s[`seg-${size}`], className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            className={cn(s.segItem, active && s.segActive)}
            onClick={() => onChange(o.value)}
          >
            {active && (
              <motion.span layoutId={layoutId} className={s.segThumb} transition={{ type: 'spring', stiffness: 520, damping: 38 }} />
            )}
            <span className={cn(s.segLabel, 'truncate')}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
