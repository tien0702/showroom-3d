import { withBase } from '@/lib/withBase';

/** Brand settings. Change here to rebrand the whole site. */
export const brand = {
  name: 'Nội Thất Ngọc Minh',
  short: 'NM',
  legalName: 'Công ty TNHH SX XNK Ngọc Minh Xanh',
  tagline: 'Thử nội thất trong phòng trước khi mua',
  hotline: '09 2929 2828',
  hotlineTel: '0929292828',
  phone2: '0917 809 859',
  phone2Tel: '0917809859',
  facebook: 'https://www.facebook.com/N%E1%BB%98I-TH%E1%BA%A4T-NG%E1%BB%8CC-MINH-1658978000873017/',
  email: 'ngocminhsofa@gmail.com',
  address: 'G12 đường 52, KDC Vĩnh Phú 1, P. Vĩnh Phú, TP. Thuận An, Bình Dương',
  logo: withBase('/brand/logo.png'),
  mark: withBase('/brand/mark.png'),
} as const;
