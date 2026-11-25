/**
 * DEV-ONLY page used by `npm run thumbnails` to render product and showroom
 * images straight from the 3D models. Not included in production builds.
 *   /__capture?sku=SOFA-OSLO-200&az=35
 *   /__capture?room=nordic-living
 */
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { catalog } from '@/features/catalog/api';
import { showroomApi } from '@/features/showroom/api';
import { ProductViewer3D } from '@/features/catalog/ProductViewer3D';
import { LookScene } from '@/features/planner/components/scene/LookScene';

declare global {
  interface Window {
    __captureReady?: boolean;
  }
}

export default function CapturePage() {
  const [params] = useSearchParams();
  const product = catalog.bySku(params.get('sku') ?? '');
  const room = showroomApi.get(params.get('room') ?? '');
  const az = Number(params.get('az') ?? 35);

  useEffect(() => {
    document.body.style.background = 'transparent';
    const t = window.setTimeout(() => (window.__captureReady = true), 1500);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      {product && <ProductViewer3D product={product} variant={product.variants[0].id} autoRotate={false} preserveDrawingBuffer azimuth={az} />}
      {room && <LookScene room={room.room} items={room.items} markers={new Map()} active={null} onHover={() => {}} />}
    </div>
  );
}
