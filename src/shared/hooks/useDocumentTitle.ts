import { useEffect } from 'react';
import { brand } from '@/app/config';

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} – ${brand.name}` : `${brand.name} – ${brand.tagline}`;
  }, [title]);
}
