import { useState, type ImgHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';
import s from './ui.module.css';

interface ImageFrameProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'className'> {
  /** CSS aspect-ratio, e.g. "1", "4 / 3". */
  ratio?: string;
  fit?: 'contain' | 'cover';
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'none';
  tone?: 'warm' | 'plain';
}

/**
 * Fixed-ratio frame for every product/room image: reserves space (no layout shift),
 * keeps the image inside its box and fades it in once loaded.
 */
export function ImageFrame({ ratio = '1', fit = 'contain', className, rounded = 'md', tone = 'warm', alt = '', ...img }: ImageFrameProps) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  return (
    <div className={cn(s.frame, s[`r-${rounded}`], s[`tone-${tone}`], className)} style={{ aspectRatio: ratio }} data-state={state}>
      {state !== 'error' ? (
        <img
          {...img}
          alt={alt}
          loading={img.loading ?? 'lazy'}
          decoding="async"
          className={s.frameImg}
          style={{ objectFit: fit }}
          onLoad={() => setState('ready')}
          onError={() => setState('error')}
        />
      ) : (
        <svg className={s.frameFallback} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 16 5-5 4 4 3-3 6 6" />
        </svg>
      )}
    </div>
  );
}
