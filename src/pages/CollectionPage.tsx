import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGroup } from 'motion/react';
import { collection } from '@/features/collection/api';
import { CollectionCard } from '@/features/collection/CollectionCard';
import { Chip } from '@/shared/ui';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import s from './pages.module.css';
import c from '@/features/collection/collection.module.css';

export default function CollectionPage() {
  useDocumentTitle('Mẫu Ngọc Minh');
  const [params, setParams] = useSearchParams();
  const cat = params.get('c') ?? 'all';
  const list = useMemo(() => collection.items().filter((p) => cat === 'all' || p.category === cat), [cat]);
  const set = (id: string) => setParams(id === 'all' ? {} : { c: id }, { replace: true });

  return (
    <div className="container">
      <section className={s.hero}>
        <h1>Mẫu Ngọc Minh</h1>
        <span className={s.count}>{list.length} mẫu</span>
      </section>
      <p className={c.intro}>
        Sofa, giường ngủ, bàn ăn và bàn trang điểm được thiết kế và sản xuất trực tiếp tại xưởng Ngọc Minh. Màu sắc và kích thước có thể
        đặt theo yêu cầu.
      </p>
      <div className={s.filters} role="toolbar" aria-label="Danh mục">
        <Chip active={cat === 'all'} onClick={() => set('all')}>
          Tất cả
        </Chip>
        {collection.categories().map((x) => (
          <Chip key={x.id} active={cat === x.id} onClick={() => set(x.id)}>
            {x.label}
          </Chip>
        ))}
      </div>
      <LayoutGroup>
        <div className={s.productGrid} key={cat}>
          {list.map((p, i) => (
            <CollectionCard key={p.slug} item={p} index={i} />
          ))}
        </div>
      </LayoutGroup>
    </div>
  );
}
