import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { catalog, priceOf, variantOf } from '@/features/catalog/api';
import { brand } from '@/app/config';
import { Button, Drawer, IconButton, Icons, ImageFrame, Price, QtyStepper } from '@/shared/ui';
import { cartCount, cartTotal, useCart } from './store';
import { OrderForm } from './OrderForm';
import s from './cart.module.css';

export function CartDrawer() {
  const { lines, open, setOpen, setQty, remove, clear } = useCart();
  const count = cartCount(lines);
  const close = () => setOpen(false);
  const [step, setStep] = useState<'cart' | 'form' | 'sent'>('cart');

  // Start from the cart each time the drawer opens.
  useEffect(() => {
    if (open) setStep('cart');
  }, [open]);

  return (
    <Drawer
      open={open}
      onClose={close}
      title={count ? `Giỏ hàng · ${count} món` : 'Giỏ hàng'}
      footer={
        lines.length > 0 &&
        step !== 'sent' && (
          <div className={s.foot}>
            <div className={s.totalRow}>
              <span>Tạm tính</span>
              <Price value={cartTotal(lines)} animated className={s.total} />
            </div>
            {step === 'form' ? (
              <OrderForm
                lines={lines}
                onCancel={() => setStep('cart')}
                onSent={() => {
                  clear();
                  setStep('sent');
                }}
              />
            ) : (
              <>
                <Button variant="primary" size="lg" block icon={<Icons.IconMail size={18} />} onClick={() => setStep('form')}>
                  Đặt hàng
                </Button>
                <Button variant="secondary" size="lg" block icon={<Icons.IconPhone size={18} />} onClick={() => (window.location.href = `tel:${brand.hotlineTel}`)}>
                  Gọi đặt hàng {brand.hotline}
                </Button>
                <a className={s.fbLink} href={brand.facebook} target="_blank" rel="noreferrer">
                  Hoặc nhắn tin qua Facebook
                </a>
              </>
            )}
          </div>
        )
      }
    >
      {step === 'sent' ? (
        <div className={s.empty}>
          <span className={s.sentIcon}>
            <Icons.IconCheck size={32} />
          </span>
          <p className={s.sentTitle}>Đã gửi đơn hàng!</p>
          <p>Ngọc Minh sẽ gọi lại cho bạn trong giờ làm việc để xác nhận.</p>
          <Link to="/" onClick={close} className={s.emptyLink}>
            Tiếp tục xem showroom
          </Link>
        </div>
      ) : lines.length === 0 ? (
        <div className={s.empty}>
          <Icons.IconBag size={40} />
          <p>Chưa có sản phẩm nào</p>
          <Link to="/" onClick={close} className={s.emptyLink}>
            Khám phá showroom 3D
          </Link>
        </div>
      ) : (
        <ul className={s.list}>
          <AnimatePresence initial={false}>
            {lines.map((l) => {
              const p = catalog.bySku(l.sku);
              if (!p) return null;
              return (
                <motion.li
                  key={`${l.sku}-${l.variant}`}
                  layout
                  className={s.line}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40, height: 0, paddingBlock: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 36 }}
                >
                  <Link to={`/products/${p.slug}`} onClick={close} className={s.lineThumb}>
                    <ImageFrame src={p.assets.thumb} alt={p.name} ratio="1" />
                  </Link>
                  <div className={s.lineBody}>
                    <Link to={`/products/${p.slug}`} onClick={close} className={`${s.lineName} clamp-2`} title={p.name}>
                      {p.name}
                    </Link>
                    <span className={`${s.lineVariant} truncate`}>{variantOf(p, l.variant).label}</span>
                    <div className={s.lineBottom}>
                      <QtyStepper size="sm" value={l.qty} onChange={(q) => setQty(l.sku, l.variant, q)} />
                      <Price value={priceOf(p, l.variant) * l.qty} animated className={s.linePrice} />
                    </div>
                  </div>
                  <IconButton label="Xóa khỏi giỏ" size="sm" icon={<Icons.IconTrash size={16} />} onClick={() => remove(l.sku, l.variant)} tooltipSide="left" />
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </Drawer>
  );
}
