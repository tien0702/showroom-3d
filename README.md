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
├─ data/                 Dữ liệu mẫu JSON (catalog.json, showrooms.json)
├─ types/                Kiểu dữ liệu domain – nguồn chuẩn cho format dữ liệu
├─ styles/               tokens.css, global.css
└─ dev/                  Trang chỉ chạy ở môi trường dev (render ảnh sản phẩm)
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

Ảnh trong `public/images` được render trực tiếp từ model 3D:

```bash
npm run dev                                   # cửa sổ 1
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run thumbnails   # cửa sổ 2
npm run thumbnails -- SOFA                    # chỉ render SKU chứa "SOFA"
```

Khi có ảnh chụp thật, thay file cùng tên hoặc sửa `assets.thumb` / `assets.gallery` trong `catalog.json`.

## Thêm model GLB thật

1. Xuất GLB theo chuẩn ở `docs/data-format.md` (pivot tâm đáy, mét, mặt trước +Z).
2. Đặt file vào `public/models/` và điền `assets.glb` của sản phẩm.
3. `FurnitureModel` tự dùng GLB thay cho model dựng bằng code và tự chỉnh tỉ lệ về đúng `dimensions`.
