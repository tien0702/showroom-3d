import { Suspense, lazy, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { catalog, priceOf, variantOf } from '@/features/catalog/api';
import { ProductCard } from '@/features/catalog/ProductCard';
import { showroomApi, showroomFor } from '@/features/showroom/api';
import { useCart } from '@/features/cart/store';
import { Button, Icons, ImageFrame, Price, QtyStepper, Segmented, Swatches } from '@/shared/ui';
import { formatDims } from '@/shared/lib/format';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { brand } from '@/app/config';
import s from './pages.module.css';

const Viewer = lazy(() => import('@/features/catalog/ProductViewer3D').then((m) => ({ default: m.ProductViewer3D })));

type Tab = 'photo' | '3d' | 'room';
const TABS: { value: Tab; label: string }[] = [
  { value: 'photo', label: 'Ảnh' },
  { value: '3d', label: '3D 360°' },
  { value: 'room', label: 'Trong phòng' },
];

export default function ProductPage() {
  const { slug = '' } = useParams();
  const product = catalog.bySlug(slug);
  const navigate = useNavigate();
  const add = useCart((c) => c.add);
  const setCartOpen = useCart((c) => c.setOpen);
  const [tab, setTab] = useState<Tab>('photo');
  const [variant, setVariant] = useState(product?.variants[0].id ?? '');
  const [image, setImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  useDocumentTitle(product?.name);

  useEffect(() => {
    setVariant(product?.variants[0].id ?? '');
    setImage(0);
    setQty(1);
    setTab('photo');
  }, [product]);

  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(false), 2200);
    return () => window.clearTimeout(t);
  }, [added]);

  if (!product) return <Navigate to="/products" replace />;

  const v = variantOf(product, variant);
  const room = showroomFor(product.category);
  const roomLink = (id: string) => `/design/${id}?add=${encodeURIComponent(product.sku)}&variant=${v.id}`;
  const related = catalog.related(product);
  const category = catalog.category(product.category);

  return (
    <div className="container">
      <nav className={s.crumbs} aria-label="Đường dẫn">
        <Link to="/products">Sản phẩm</Link>
        <span aria-hidden>/</span>
        {category && <Link to={`/products?c=${category.id}`}>{category.label}</Link>}
        <span aria-hidden>/</span>
        <span className="truncate" aria-current="page">{product.name}</span>
      </nav>

      <div className={s.pdp}>
        <div className={s.gallery}>
          <div className={s.stageBox}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab === 'photo' ? `photo-${image}` : tab}
                className={s.stageInner}
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              >
                {tab === 'photo' && <ImageFrame src={product.assets.gallery[image]} alt={product.name} ratio="auto" className={s.fill} rounded="none" loading="eager" />}
                {tab === '3d' && (
                  <Suspense fallback={<div className={s.stageLoading}>Đang tải mô hình 3D…</div>}>
                    <Viewer product={product} variant={v.id} />
                  </Suspense>
                )}
                {tab === 'room' && (
                  <div className={s.roomPick}>
                    {showroomApi.list().map((r) => (
                      <Link key={r.id} to={roomLink(r.id)} className={s.roomPickCard}>
                        <ImageFrame src={r.cover} alt="" ratio="4 / 3" fit="cover" rounded="md" />
                        <span className="truncate">{r.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            <Segmented label="Chế độ xem" value={tab} options={TABS} onChange={setTab} className={s.stageTabs} size="sm" />
          </div>
          <div className={s.thumbs} role="listbox" aria-label="Ảnh sản phẩm">
            {product.assets.gallery.map((src, i) => (
              <button
                key={src}
                role="option"
                aria-selected={tab === 'photo' && image === i}
                aria-label={`Ảnh ${i + 1}`}
                className={s.thumb}
                onClick={() => {
                  setTab('photo');
                  setImage(i);
                }}
              >
                <ImageFrame src={src} alt="" ratio="1" rounded="md" />
              </button>
            ))}
          </div>
        </div>

        <motion.div className={s.buy} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}>
          <span className={s.eyebrow}>{product.collection}</span>
          <h1 className={s.pdpTitle}>{product.name}</h1>
          <Price value={priceOf(product, v.id) * qty} animated className={s.pdpPrice} />

          {product.variants.length > 1 && (
            <div className={s.field}>
              <span className={s.fieldLabel}>
                Màu <strong className="truncate">{v.label}</strong>
              </span>
              <Swatches variants={product.variants} value={v.id} onChange={setVariant} />
            </div>
          )}

          <div className={s.field}>
            <span className={s.fieldLabel}>Kích thước (R × S × C)</span>
            <span className={s.dims}>{formatDims(product.dimensions)}</span>
          </div>

          <div className={s.ctaGrid}>
            <Button variant="accent" size="lg" icon={<Icons.IconCube />} onClick={() => navigate(roomLink(room.id))}>
              Xem trong phòng 3D
            </Button>
            <a className={s.callBtn} href={`tel:${brand.hotlineTel}`}>
              <Icons.IconPhone size={18} /> Gọi {brand.hotline}
            </a>
          </div>

          <div className={s.buyRow}>
            <QtyStepper value={qty} onChange={setQty} />
            <Button
              variant="primary"
              size="lg"
              className={s.addBtn}
              onClick={() => {
                add(product.sku, v.id, qty);
                setAdded(true);
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={added ? 'ok' : 'add'}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -12, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={s.addLabel}
                >
                  {added ? (
                    <>
                      <Icons.IconCheck size={18} /> Đã thêm vào giỏ
                    </>
                  ) : (
                    'Thêm vào giỏ'
                  )}
                </motion.span>
              </AnimatePresence>
            </Button>
          </div>
          <AnimatePresence>
            {added && (
              <motion.button className={s.viewCart} onClick={() => setCartOpen(true)} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                Xem giỏ hàng <Icons.IconArrowRight size={16} />
              </motion.button>
            )}
          </AnimatePresence>

          <ul className={s.highlights}>
            {product.highlights.map((h) => (
              <li key={h}>
                <Icons.IconCheck size={16} /> <span>{h}</span>
              </li>
            ))}
          </ul>

          <div className={s.trust}>
            <span><Icons.IconCheck size={18} /> Sản xuất tại xưởng</span>
            <span><Icons.IconShield size={18} /> Bảo hành 1–3 năm</span>
            <span><Icons.IconReset size={18} /> Bảo trì vĩnh viễn</span>
          </div>
        </motion.div>
      </div>

      {related.length > 0 && (
        <section className={s.section}>
          <div className={s.sectionHead}>
            <h2>Kết hợp cùng</h2>
          </div>
          <div className={s.productGrid}>
            {related.map((p, i) => (
              <ProductCard key={p.sku} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
