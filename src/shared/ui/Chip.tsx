import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';
import s from './ui.module.css';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Chip({ active, className, children, ...rest }: ChipProps) {
  return (
    <button type="button" aria-pressed={active} className={cn(s.chip, active && s.chipActive, className)} {...rest}>
      <span className="truncate">{children}</span>
    </button>
  );
}
