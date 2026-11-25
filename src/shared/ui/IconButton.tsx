import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Tooltip } from './Tooltip';
import s from './ui.module.css';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Required: becomes the accessible name and the tooltip text. */
  label: string;
  icon: ReactNode;
  shortcut?: string;
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'ghost' | 'secondary' | 'solid' | 'floating';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  badge?: ReactNode;
}

/** Icon-only button. Always paired with a tooltip and an aria-label. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, shortcut, tooltipSide = 'top', variant = 'ghost', size = 'md', active, badge, className, ...rest },
  forwarded,
) {
  return (
    <Tooltip label={label} shortcut={shortcut} side={tooltipSide}>
      {({ ref, ...aria }) => (
        <button
          ref={(el) => {
            ref(el);
            if (typeof forwarded === 'function') forwarded(el);
            else if (forwarded) forwarded.current = el;
          }}
          type="button"
          aria-label={label}
          aria-pressed={active}
          className={cn(s.iconBtn, s[`icon-${variant}`], s[`icon-${size}`], active && s.iconActive, className)}
          {...aria}
          {...rest}
        >
          {icon}
          {badge}
        </button>
      )}
    </Tooltip>
  );
});
