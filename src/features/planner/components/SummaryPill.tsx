import { Link } from 'react-router-dom';
import { catalog, priceOf } from '@/features/catalog/api';
import { Icons, Price } from '@/shared/ui';
import { usePlanner } from '../store/plannerStore';
import s from './Planner.module.css';

export function SummaryPill({ showroomId }: { showroomId: string }) {
  const items = usePlanner((st) => st.items);
  const total = items.reduce((a, it) => {
    const p = catalog.bySku(it.sku);
    return p ? a + priceOf(p, it.variant) : a;
  }, 0);
  return (
    <Link to={`/design/${showroomId}/look`} className={s.summary}>
      <span className={s.summaryCount}>{items.length} món</span>
      <Price value={total} animated className={s.summaryTotal} />
      <span className={s.summaryCta}>
        <span className={s.summaryLong}>Xem báo giá</span>
        <span className={s.summaryShort}>Báo giá</span>
        <Icons.IconArrowRight size={16} />
      </span>
    </Link>
  );
}
