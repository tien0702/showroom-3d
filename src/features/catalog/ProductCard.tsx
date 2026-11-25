import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import type { Product } from '@/types';
import { ImageFrame, Price } from '@/shared/ui';
import s from './catalog.module.css';

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const [front, angle] = product.assets.gallery;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <Link to={`/products/${product.slug}`} className={s.card}>
        <div className={s.cardMedia}>
          <ImageFrame src={front ?? product.assets.thumb} alt={product.name} ratio="1" rounded="lg" />
          {angle && (
            <div className={s.cardAlt} aria-hidden>
              <ImageFrame src={angle} alt="" ratio="1" rounded="lg" />
            </div>
          )}
          <span className={s.cardTag}>3D</span>
        </div>
        <div className={s.cardBody}>
          <span className={`${s.cardName} clamp-2`} title={product.name}>
            {product.name}
          </span>
          <span className={`${s.cardMeta} truncate`}>{product.collection}</span>
          <div className={s.cardFoot}>
            <Price value={product.price} className={s.cardPrice} />
            {product.variants.length > 1 && (
              <span className={s.dots} aria-label={`${product.variants.length} màu`}>
                {product.variants.slice(0, 4).map((v) => (
                  <span key={v.id} style={{ background: v.swatch }} />
                ))}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
