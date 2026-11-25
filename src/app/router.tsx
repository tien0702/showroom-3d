import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { SiteLayout } from './SiteLayout';
import { RootLayout } from './RootLayout';
import { RouteError } from '@/pages/RouteError';

const ShowroomsPage = lazy(() => import('@/pages/ShowroomsPage'));
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const ProductPage = lazy(() => import('@/pages/ProductPage'));
const DesignerPage = lazy(() => import('@/pages/DesignerPage'));
const LookPage = lazy(() => import('@/pages/LookPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const CapturePage = lazy(() => import('@/dev/CapturePage'));

const page = (node: ReactNode) => <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>{node}</Suspense>;

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
  {
    element: <SiteLayout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: page(<ShowroomsPage />) },
      { path: '/products', element: page(<ProductsPage />) },
      { path: '/products/:slug', element: page(<ProductPage />) },
      { path: '/design/:showroomId/look', element: page(<LookPage />) },
      { path: '*', element: page(<NotFoundPage />) },
    ],
  },
  { path: '/design/:showroomId', element: page(<DesignerPage />), errorElement: <RouteError /> },
  ...(import.meta.env.DEV ? [{ path: '/__capture', element: page(<CapturePage />) }] : []),
    ],
  },
], { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' });
