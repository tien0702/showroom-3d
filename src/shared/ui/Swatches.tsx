import type { Variant } from '@/types';
import { cn } from '@/shared/lib/cn';
import { Tooltip } from './Tooltip';
import s from './ui.module.css';

interface SwatchesProps {
  variants: Variant[];
  value: string;
  onChange: (id: string) => void;
  size?: 'sm' | 'md';
  label?: string;
}

export function Swatches({ variants, value, onChange, size = 'md', label = 'Chọn màu' }: SwatchesProps) {
  return (
    <div role="radiogroup" aria-label={label} className={s.swatches}>
      {variants.map((v) => (
        <Tooltip key={v.id} label={v.label}>
          {({ ref, ...aria }) => (
            <button
              ref={ref}
              type="button"
              role="radio"
              aria-checked={v.id === value}
              aria-label={v.label}
              className={cn(s.swatch, s[`swatch-${size}`], v.id === value && s.swatchActive)}
              style={{ ['--sw' as string]: v.swatch }}
              onClick={() => onChange(v.id)}
              {...aria}
            />
          )}
        </Tooltip>
      ))}
    </div>
  );
}
