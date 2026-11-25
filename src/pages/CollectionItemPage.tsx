import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { brand } from '@/app/config';
import { CARE_NOTES, WARRANTY_NOTE, collection, discountPct, finalPrice } from '@/features/collection/api';
import { CollectionCard } from '@/features/collection/CollectionCard';
import { catalog } from '@/features/catalog/api';
import { NM_SKU_PREFIX } from '@/features/collection/toProducts';
import { Icons, ImageFrame, Price } from '@/shared/ui';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import s from './pages.module.css';
import c from '@/features/collection/collection.module.css';

export default function CollectionItemPage() {
  const { slug = '' } = useParams();
  const item = collection.bySlug(slug);
  const [image, setImage] = useState(0);
  useDocumentTitle(item ? `${item.name} (${item.code})` : undefined);
  useEffect(() => setImage(0), [item]);

  if (!item) return <Navigate to="/mau-ngoc-minh" replace />;

  const category = collection.category(item.category);
  const price = finalPrice(item);
  const off = discountPct(item);
  const related = collection.related(item);
  const product3d = catalog.bySku(`${NM_SKU_PREFIX}${item.code}`);

  return (
    <div className="container">
      <nav className={s.crumbs} aria-label="Đường dẫn">
        <Link to="/mau-ngoc-minh">Mẫu Ngọc Minh</Link>
        <span aria-hidden>/</span>
        {category && <Link to={`/mau-ngoc-minh?c=${category.id}`}>{category.label}</Link>}
        <span aria-hidden>/</span>
        <span className="truncate" aria-current="page">
          {item.code}
        </span>
      </nav>

      <div className={s.pdp}>
        <div className={s.gallery}>
          <div className={s.stageBox}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={image}
                className={s.stageInner}
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <ImageFrame src={item.images[image]} alt={item.name} ratio="auto" className={s.fill} rounded="none" loading="eager" />
              </motion.div>
            </AnimatePresence>
          </div>
          {item.images.length > 1 && (
            <div className={s.thumbs} role="listbox" aria-label="Ảnh sản phẩm">
              {item.images.map((src, i) => (
                <button key={src} role="option" aria-selected={image === i} aria-label={`Ảnh ${i + 1}`} className={s.thumb} onClick={() => setImage(i)}>
                  <ImageFrame src={src} alt="" ratio="1" rounded="md" />
                </button>
              ))}
            </div>
          )}
        </div>

        <motion.div className={s.buy} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}>
          <span className={s.eyebrow}>
            {category?.label} · Mã {item.code}
          </span>
          <h1 className={s.pdpTitle}>{item.name}</h1>
          <div className={c.priceBlock}>
            {price ? <Price value={price} className={s.pdpPrice} /> : <span className={s.pdpPrice}>Giá liên hệ</span>}
            {off > 0 && item.price && (
              <>
                <Price value={item.price} className={c.was} />
                <span className={c.sale} style={{ position: 'static' }}>
                  -{off}%
                </span>
              </>
            )}
          </div>

          <dl className={c.specs}>
            {item.size && (
              <>
                <dt>Kích thước</dt>
                <dd>{item.size}</dd>
              </>
            )}
            {item.material && (
              <>
                <dt>Chất liệu</dt>
                <dd>{item.material}</dd>
              </>
            )}
            <dt>Màu sắc</dt>
            <dd>Tuỳ chọn theo yêu cầu</dd>
          </dl>

          {product3d && (
            <Link className={`${c.ctaLink} ${c.ctaAccent}`} to={`/products/${product3d.slug}`}>
              <Icons.IconCube size={18} /> Xem 3D & thử trong phòng
            </Link>
          )}
          <div className={c.ctaRow}>
            <a className={`${c.ctaLink} ${c.ctaPrimary}`} href={`tel:${brand.hotlineTel}`}>
              <Icons.IconPhone size={18} /> Gọi {brand.hotline}
            </a>
            <a className={`${c.ctaLink} ${c.ctaSecondary}`} href={brand.facebook} target="_blank" rel="noreferrer">
              Nhắn tin Facebook
            </a>
          </div>

          {item.details.length > 0 && (
            <ul className={s.highlights}>
              {item.details.map((h) => (
                <li key={h}>
                  <Icons.IconCheck size={16} /> <span>{h}</span>
                </li>
              ))}
            </ul>
          )}

          <div className={c.notes}>
            <h2>Hướng dẫn sử dụng và bảo quản</h2>
            <ul>
              {CARE_NOTES.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <h2>Bảo hành</h2>
            <p>{WARRANTY_NOTE}</p>
          </div>
        </motion.div>
      </div>

      {related.length > 0 && (
        <section className={s.section}>
          <div className={s.sectionHead}>
            <h2>Mẫu cùng loại</h2>
            <Link to={`/mau-ngoc-minh?c=${item.category}`} className={s.more}>
              Xem tất cả <Icons.IconArrowRight size={16} />
            </Link>
          </div>
          <div className={s.productGrid}>
            {related.map((p, i) => (
              <CollectionCard key={p.slug} item={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
