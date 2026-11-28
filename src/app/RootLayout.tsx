import { Outlet, ScrollRestoration } from 'react-router-dom';
import { CartDrawer } from '@/features/cart/CartDrawer';
import { Splash } from './Splash';

/** Top-level shell shared by every route: global overlays live here. */
export function RootLayout() {
  return (
    <>
      <Outlet />
      <CartDrawer />
      <ScrollRestoration />
      <Splash />
    </>
  );
}
