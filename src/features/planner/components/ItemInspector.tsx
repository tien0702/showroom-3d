import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { catalog, priceOf, variantOf } from '@/features/catalog/api';
import { useCart } from '@/features/cart/store';
import { Button, IconButton, Icons, ImageFrame, Price, Swatches } from '@/shared/ui';
import { formatDims } from '@/shared/lib/format';
import { usePlanner, useSelectedItem } from '../store/plannerStore';
import s from './Planner.module.css';

const ISSUE_TEXT = {
  collision: 'Đang chạm món khác',
  door: 'Chắn lối mở cửa',
  outside: 'Nằm ngoài phòng',
} as const;

export function ItemInspector() {
  const item = useSelectedItem();
  const issue = usePlanner((st) => (item ? st.issues[item.uid] ?? null : null));
  const product = item ? catalog.bySku(item.sku) : undefined;
  const addToCart = useCart((c) => c.add);
  const { rotate, duplicate, remove, setVariant, select, showToast } = usePlanner.getState();

  return (
    <AnimatePresence>
      {item && product && (
        <motion.aside
          key="inspector"
          className={s.inspector}
          aria-label="Món đang chọn"
          initial={{ opacity: 0, x: 24, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 24, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
        >
          <div className={s.inspectorHead}>
            <ImageFrame src={product.assets.thumb} alt={product.name} ratio="1" className={s.inspectorThumb} />
            <div className={s.inspectorTitle}>
              <h3 className="clamp-2" title={product.name}>{product.name}</h3>
              <Price value={priceOf(product, item.variant)} animated className={s.inspectorPrice} />
              <span className={s.muted}>{formatDims(product.dimensions)}</span>
            </div>
            <IconButton label="Bỏ chọn" shortcut="Esc" size="sm" icon={<Icons.IconClose size={18} />} onClick={() => select(null)} tooltipSide="left" />
          </div>

          <AnimatePresence initial={false}>
            {issue && (
              <motion.div className={s.issue} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <Icons.IconInfo size={16} /> <span className="truncate">{ISSUE_TEXT[issue]}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {product.variants.length > 1 && (
            <div className={s.field}>
              <span className={s.fieldLabel}>
                Màu · <strong className="truncate">{variantOf(product, item.variant).label}</strong>
              </span>
              <Swatches variants={product.variants} value={item.variant} onChange={(v) => setVariant(item.uid, v)} size="sm" />
            </div>
          )}

          <div className={s.inspectorActions}>
            <Button
              variant="accent"
              onClick={() => {
                addToCart(product.sku, item.variant);
                showToast(`Đã thêm ${product.name} vào giỏ`);
              }}
            >
              Thêm vào giỏ
            </Button>
            <IconButton label="Xoay" shortcut="R" variant="secondary" icon={<Icons.IconRotate size={18} />} onClick={() => rotate(item.uid)} disabled={product.rules.placement === 'wall'} />
            <IconButton label="Nhân bản" shortcut="D" variant="secondary" icon={<Icons.IconCopy size={18} />} onClick={() => duplicate(item.uid)} />
            <IconButton label="Xóa khỏi phòng" shortcut="Del" variant="secondary" icon={<Icons.IconTrash size={18} />} onClick={() => remove(item.uid)} />
          </div>
          <Link to={`/products/${product.slug}`} className={s.inspectorLink}>
            Xem chi tiết sản phẩm <Icons.IconArrowRight size={16} />
          </Link>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
