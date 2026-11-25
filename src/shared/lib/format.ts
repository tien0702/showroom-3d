const vnd = new Intl.NumberFormat('vi-VN');

export const formatPrice = (n: number) => `${vnd.format(n)} ₫`;

/** Metres → "200 cm". */
export const formatCm = (m: number) => `${Math.round(m * 100)} cm`;

export const formatDims = (d: { w: number; d: number; h: number }) =>
  `${Math.round(d.w * 100)} × ${Math.round(d.d * 100)} × ${Math.round(d.h * 100)} cm`;

export const formatArea = (m2: number) => `${m2.toFixed(m2 < 10 ? 1 : 0)} m²`;
