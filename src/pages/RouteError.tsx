import { Link, useRouteError } from 'react-router-dom';
import s from './pages.module.css';

export function RouteError() {
  const error = useRouteError() as Error | undefined;
  if (import.meta.env.DEV) console.error(error);
  return (
    <div className={`container ${s.center}`}>
      <h1>Có lỗi xảy ra</h1>
      <p className={s.muted}>Vui lòng tải lại trang.</p>
      <Link to="/" className={s.more}>Về trang chủ</Link>
    </div>
  );
}
