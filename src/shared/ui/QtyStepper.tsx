import { IconMinus, IconPlus } from './icons';
import { IconButton } from './IconButton';
import s from './ui.module.css';

interface QtyStepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}

export function QtyStepper({ value, onChange, min = 1, max = 99, size = 'md' }: QtyStepperProps) {
  return (
    <div className={s.qty} data-size={size}>
      <IconButton label="Giảm số lượng" size={size === 'sm' ? 'sm' : 'md'} icon={<IconMinus size={16} />} onClick={() => onChange(Math.max(min - 1, value - 1))} disabled={value <= min - 1} />
      <output className="tabular" aria-live="polite">{value}</output>
      <IconButton label="Tăng số lượng" size={size === 'sm' ? 'sm' : 'md'} icon={<IconPlus size={16} />} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} />
    </div>
  );
}
