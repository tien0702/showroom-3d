import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui';
import s from './pages.module.css';

export default function NotFoundPage() {
  return (
    <div className={`container ${s.center}`}>
      <h1>Không tìm thấy trang</h1>
      <Link to="/">
        <Button variant="primary" tabIndex={-1}>Về trang chủ</Button>
      </Link>
    </div>
  );
}
