import { Link } from 'react-router-dom';
import { brand } from '@/app/config';
import { collection } from '@/features/collection/api';
import { Icons } from '@/shared/ui';
import { withBase } from '@/lib/withBase';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import s from './pages.module.css';
import c from '@/features/collection/collection.module.css';

const BANNER = withBase('/images/ngoc-minh/banner-2.webp');

export default function AboutPage() {
  useDocumentTitle('Giới thiệu');
  return (
    <div className="container">
      <div className={c.banner}>
        <img src={BANNER} alt="Không gian nội thất Ngọc Minh" width={1600} height={700} />
      </div>

      <div className={c.aboutGrid}>
        <article className={c.prose}>
          <span className={s.eyebrow}>Về chúng tôi</span>
          <h1>{brand.name}</h1>
          <p>
            {brand.legalName} thiết kế và sản xuất trực tiếp sofa, giường ngủ, bàn ăn và bàn trang điểm tại xưởng ở Thuận An, Bình Dương, phân
            phối đồ nội thất phong phú về mẫu mã và chủng loại.
          </p>
          <div className={c.stats}>
            <div>
              <b>{collection.items().length}+</b>
              <span>mẫu sản phẩm</span>
            </div>
            <div>
              <b>1–3 năm</b>
              <span>bảo hành, bảo trì vĩnh viễn</span>
            </div>
            <div>
              <b>Tại xưởng</b>
              <span>sản xuất trực tiếp</span>
            </div>
          </div>
          <p>
            Thiết kế nội thất là nơi dành cho các Kiến trúc sư, Nhà thiết kế và Kỹ sư thể hiện chuyên môn và tài năng trong tất cả các khâu: từ
            sáng tạo, thiết kế concept, thiết kế chi tiết đến triển khai thi công và hoàn thiện các công trình Kiến trúc và Nội thất.
          </p>
          <p>
            Nếu bạn đã hình dung ra không gian mình sẽ sống và làm việc, hãy chia sẻ với chúng tôi. Chúng tôi biến những suy nghĩ, ý tưởng của
            bạn thành hiện thực, với giải pháp từng phần hay tổng thể cho không gian sống và làm việc của bạn cùng gia đình.
          </p>
          <h2>Vì sao chọn Ngọc Minh</h2>
          <ul>
            <li>Tư vấn nhiệt tình và hoàn toàn miễn phí.</li>
            <li>Không gian được kiến tạo bởi đội ngũ Kiến trúc sư nhiệt huyết, sáng tạo và giàu kinh nghiệm.</li>
            <li>Thi công hoàn thiện bởi tổ đội thợ chuyên nghiệp, được Kỹ sư và Kiến trúc sư quản lý giám sát.</li>
            <li>Chất lượng tốt nhất, tiến độ nhanh nhất với chi phí hợp lý nhất.</li>
          </ul>
          <h2>Thử trước khi mua</h2>
          <p>
            Với showroom 3D, bạn có thể bày thử nội thất vào căn phòng mẫu, đổi màu, xoay góc nhìn và ước tính chi phí trước khi liên hệ đặt
            hàng.
          </p>
          <p>
            <Link to="/" className={s.more}>
              Mở showroom 3D <Icons.IconArrowRight size={16} />
            </Link>
          </p>
        </article>

        <aside className={c.contactCard} aria-label="Liên hệ">
          <img src={brand.logo} alt={brand.name} />
          <strong>{brand.legalName}</strong>
          <dl>
            <div>
              <dt>Địa chỉ</dt>
              <dd>{brand.address}</dd>
            </div>
            <div>
              <dt>Hotline</dt>
              <dd>
                <a href={`tel:${brand.hotlineTel}`}>{brand.hotline}</a> · <a href={`tel:${brand.phone2Tel}`}>{brand.phone2}</a>
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${brand.email}`}>{brand.email}</a>
              </dd>
            </div>
            <div>
              <dt>Facebook</dt>
              <dd>
                <a href={brand.facebook} target="_blank" rel="noreferrer">
                  Nội Thất Ngọc Minh
                </a>
              </dd>
            </div>
          </dl>
          <a className={c.ctaLink} href={`tel:${brand.hotlineTel}`}>
            <Icons.IconPhone size={18} /> Gọi tư vấn miễn phí
          </a>
        </aside>
      </div>
    </div>
  );
}
