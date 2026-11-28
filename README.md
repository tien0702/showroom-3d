# Showroom 3D – Frontend

Website bán nội thất cho phép khách đặt sản phẩm 3D vào phòng mẫu, kéo thả, đổi màu và mua cả bộ.

## Chạy dự án

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # kiểm tra kiểu + build production vào dist/
npm run lint
```

Yêu cầu Node 20+.

## Trang quản trị (chỉ chạy trên máy)

Trang `/_admin` dùng để sửa nội dung web mà không cần đụng code. Nó **chỉ chạy khi bật dự án trên máy** và không có trong bản đăng lên GitHub Pages.

### Chạy lần đầu

1. Cài [Node.js 20+](https://nodejs.org) và [Git](https://git-scm.com), đăng nhập GitHub trên máy để `git push` được (ví dụ chạy `gh auth login`, hoặc dùng GitHub Desktop).
2. Mở Terminal trong thư mục dự án rồi chạy:
   ```bash
   npm install      # chỉ cần lần đầu
   npm run admin    # bật web + tự mở http://localhost:5173/_admin/
   ```
3. Để cửa sổ Terminal mở trong lúc làm. Muốn tắt thì bấm `Ctrl + C`.

### Các mục

| Mục | Làm được gì |
|---|---|
| Sản phẩm & model 3D | Thêm, sửa, xoá sản phẩm; tải ảnh (tự đổi sang WebP); nhập file `.glb`; nhập kích thước thật |
| Ảnh quảng cáo | Thêm, thay, xoá, sắp xếp ảnh banner trang chủ; tiêu đề, link, thời gian đổi ảnh |
| Sản phẩm đề xuất | Chọn và sắp xếp sản phẩm hiện ở trang chủ |
| Phòng mẫu 3D | Sửa tên, loại phòng; lưu bản thiết kế tự làm thành phòng mẫu; chụp lại ảnh bìa |

### Lưu phòng tự thiết kế thành phòng mẫu

1. Ở mục **Phòng mẫu 3D**, bấm **Mở trình thiết kế** trên một phòng. Một tab mới mở ra.
2. Trong tab đó, bấm nút 🏠 để chỉnh kích thước phòng, cửa sổ, cửa chính; thêm, kéo, đổi màu đồ.
3. Quay lại tab admin. Phòng đó sẽ hiện **“Có bản thiết kế mới trên máy”**:
   - **Ghi đè phòng mẫu này**: thay phòng mẫu bằng bản vừa làm.
   - **Lưu thành phòng mới…**: tạo thêm một phòng mẫu.

   Ảnh bìa được chụp tự động từ mô hình 3D (cần có Google Chrome trên máy).

### Đăng lên web

Mỗi lần **Lưu**, dữ liệu được ghi vào file trong dự án (`src/data/*.json`, `public/images`, `public/models`). Thanh vàng phía trên cho biết còn bao nhiêu thay đổi chưa đăng. Bấm **Đăng lên web**: admin tự `git commit` và `git push` các file đó, rồi GitHub Pages tự build lại trong khoảng 1–2 phút.

> Nút này chỉ đăng **dữ liệu**. Nếu có sửa code, hãy commit code theo cách thông thường trước.

## Đơn đặt hàng

Khách bấm **Đặt hàng** trong giỏ, nhập tên và số điện thoại. Đơn (kèm danh sách món và tổng tiền) được gửi qua [FormSubmit](https://formsubmit.co) về email trong `src/app/config.ts` (`orderEndpoint`).
**Lần đầu tiên** có đơn, FormSubmit gửi một email xác nhận tới hộp thư đó; bấm **Activate** là từ đó đơn sẽ về Gmail.

## Công nghệ

| Lớp | Thư viện |
|---|---|
| Khung | React 19, TypeScript, Vite |
| Điều hướng | React Router 7 (lazy-load theo trang) |
| 3D | three.js, @react-three/fiber, @react-three/drei |
| Trạng thái | Zustand (giỏ hàng + thiết kế lưu ở localStorage) |
| Animation | Motion (`motion/react`) + CSS transitions |
| Style | CSS Modules + design tokens (`src/styles/tokens.css`) |

## Cấu trúc thư mục

```
src/
├─ app/                  Khởi tạo app: router, layout, cấu hình thương hiệu
├─ pages/                Mỗi route một file (lazy-load)
├─ features/             Code theo nghiệp vụ, mỗi thư mục tự chứa
│  ├─ catalog/           Truy cập dữ liệu sản phẩm, ProductCard, viewer 3D 360°
│  ├─ showroom/          Truy cập dữ liệu phòng mẫu
│  ├─ cart/              Store giỏ hàng, nút giỏ, drawer
│  ├─ furniture/         Model 3D: GLB hoặc model dựng bằng code (procedural)
│  └─ planner/           Trình thiết kế
│     ├─ lib/            Hình học + luật đặt đồ (không phụ thuộc React)
│     ├─ store/          Zustand store: items, chọn, kéo, undo/redo
│     ├─ hooks/          Phím tắt
│     └─ components/     Plan2D (SVG), scene/ (3D), toolbar, inspector…
├─ shared/               UI dùng chung (Button, IconButton+Tooltip, ImageFrame…), hooks, lib
├─ data/                 Dữ liệu JSON: collection (sản phẩm), showrooms (phòng mẫu), banners (ảnh quảng cáo), featured (đề xuất)
├─ types/                Kiểu dữ liệu domain – nguồn chuẩn cho format dữ liệu
├─ styles/               tokens.css, global.css
└─ dev/                  Trang chỉ chạy ở môi trường dev (render ảnh phòng mẫu)
```

Quy tắc: `pages` ghép các `features`; `features` không import lẫn trang; `shared` không biết gì về nghiệp vụ.
Khi có backend, chỉ cần thay phần thân của `features/catalog/api.ts` và `features/showroom/api.ts`.

## Dữ liệu

Định nghĩa đầy đủ ở `src/types/`. Chi tiết format và quy ước model 3D: [`docs/data-format.md`](docs/data-format.md).

- Đơn vị: **mét** cho kích thước, **VND** cho giá.
- Toạ độ mặt bằng `[x, z]`, trục Y hướng lên, mặt trước đồ vật hướng **+Z**, `rotationY` tính bằng độ.

## Trình thiết kế

- Kéo đồ trong 2D hoặc 3D. Đồ tự bám lưới 5 cm, tự áp vào tường (`snapToWall`), luôn nằm trong phòng.
- Va chạm và vùng mở cửa được kiểm tra liên tục. Thả ở chỗ không hợp lệ thì đồ trả về vị trí cũ.
- Phím tắt: `R` xoay · `Shift+R` xoay ngược · `D` nhân bản · `Delete` xoá · mũi tên dịch 5 cm (`Shift` 25 cm) · `⌘/Ctrl+Z` hoàn tác · `Esc` bỏ chọn. Giữ `Alt` khi kéo để tắt bám lưới.
- Thiết kế của từng showroom được lưu tự động vào trình duyệt.

## Ảnh sản phẩm

Ảnh bìa phòng mẫu trong `public/images/showrooms` được render trực tiếp từ model 3D:

```bash
npm run dev                                   # cửa sổ 1
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run thumbnails   # cửa sổ 2
npm run thumbnails -- studio                  # chỉ render phòng có id chứa "studio"
```

Ảnh sản phẩm là ảnh chụp thật trong `public/images/ngoc-minh/`, khai báo ở `images` trong `src/data/collection.json`.

## Thêm model GLB thật

1. Xuất GLB theo chuẩn ở `docs/data-format.md` (pivot tâm đáy, mét, mặt trước +Z).
2. Đặt file vào `public/models/` và điền `assets.glb` của sản phẩm.
3. `FurnitureModel` tự dùng GLB thay cho model dựng bằng code và tự chỉnh tỉ lệ về đúng `dimensions`.
