# Dữ liệu từ website cũ sofamiennam.com.vn

Crawl ngày 2026-11-26.

- `products-raw.json`: dữ liệu thô của 48 sản phẩm (tên, mã, kích thước, chất liệu, giá gốc, giá khuyến mãi, mô tả, link ảnh và link trang cũ).
- Dữ liệu đã làm sạch mà website đang dùng nằm ở `src/data/collection.json`. Ảnh đã chuyển sang WebP và lưu trong `public/images/ngoc-minh/`.
- Logo đã tách nền nằm trong `public/brand/`.

Lưu ý:
- Trang chi tiết của giường ngủ (GN01–GN09, GN11, GN12) và bàn trang điểm (TD01–TD08) trên site cũ trả lỗi 500, nên chỉ lấy được 1 ảnh, giá, kích thước và chất liệu từ trang danh sách. Các sản phẩm này không có mô tả chi tiết.
- Các trang Giới thiệu con và Chính sách (bảo hành, đổi trả, vận chuyển…) trên site cũ trả lỗi 404. Mục "Tin tức" không có bài viết nào.
