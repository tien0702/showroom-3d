import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ImageFrame, Price } from '@/shared/ui';
import { discountPct, finalPrice, type CollectionItem } from './api';
import c from '@/features/catalog/catalog.module.css';
import s from './collection.module.css';

export function CollectionCard({ item, index = 0 }: { item: CollectionItem; index?: number }) {
  const [front, angle] = item.images;
  const price = finalPrice(item);
  const off = discountPct(item);
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <Link to={`/mau-ngoc-minh/${item.slug}`} className={c.card}>
        <div className={c.cardMedia}>
          <ImageFrame src={front} alt={item.name} ratio="1" rounded="lg" />
          {angle && (
            <div className={c.cardAlt} aria-hidden>
              <ImageFrame src={angle} alt="" ratio="1" rounded="lg" />
            </div>
          )}
          <span className={c.cardTag}>{item.code}</span>
          {off > 0 && <span className={s.sale}>-{off}%</span>}
        </div>
        <div className={c.cardBody}>
          <span className={`${c.cardName} clamp-2`} title={item.name}>
            {item.name}
          </span>
          <span className={`${c.cardMeta} truncate`}>{[item.size, item.material].filter(Boolean).join(' · ')}</span>
          <div className={s.priceRow}>
            {price ? <Price value={price} className={c.cardPrice} /> : <span className={c.cardPrice}>Liên hệ</span>}
            {off > 0 && item.price && <Price value={item.price} className={s.was} />}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
