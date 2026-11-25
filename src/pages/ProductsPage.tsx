import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGroup } from 'motion/react';
import type { CategoryId } from '@/types';
import { catalog } from '@/features/catalog/api';
import { ProductCard } from '@/features/catalog/ProductCard';
import { Chip } from '@/shared/ui';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import s from './pages.module.css';

export default function ProductsPage() {
  useDocumentTitle('Sản phẩm');
  const [params, setParams] = useSearchParams();
  const cat = (params.get('c') as CategoryId | null) ?? 'all';
  const list = useMemo(() => catalog.products().filter((p) => cat === 'all' || p.category === cat), [cat]);
  const set = (c: string) => setParams(c === 'all' ? {} : { c }, { replace: true });

  return (
    <div className="container">
      <section className={s.hero}>
        <h1>Sản phẩm</h1>
        <span className={s.count}>{list.length} sản phẩm</span>
      </section>
      <div className={s.filters} role="toolbar" aria-label="Danh mục">
        <Chip active={cat === 'all'} onClick={() => set('all')}>Tất cả</Chip>
        {catalog.categories().map((c) => (
          <Chip key={c.id} active={cat === c.id} onClick={() => set(c.id)}>
            {c.label}
          </Chip>
        ))}
      </div>
      <LayoutGroup>
        <div className={s.productGrid} key={cat}>
          {list.map((p, i) => (
            <ProductCard key={p.sku} product={p} index={i} />
          ))}
        </div>
      </LayoutGroup>
    </div>
  );
}
