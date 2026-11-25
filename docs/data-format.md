# Format dữ liệu

Nguồn chuẩn là các kiểu TypeScript trong `src/types/`. Tài liệu này giải thích ý nghĩa từng trường.

## Quy ước chung

| Quy ước | Giá trị |
|---|---|
| Đơn vị độ dài | mét |
| Tiền | VND, số nguyên |
| Mặt bằng | `[x, z]`, X sang phải, Z hướng xuống trong 2D (về phía người xem trong 3D) |
| Trục đứng | Y hướng lên |
| Mặt trước đồ vật | +Z khi `rotationY = 0` |
| Góc | độ, quay quanh trục Y (giống `object.rotation.y` của three.js) |
| ID | `sku` viết HOA-gạch-ngang; `slug`, `id` viết thường-gạch-ngang |

## `catalog.json`

```jsonc
{
  "categories": [{ "id": "sofa", "label": "Sofa" }],
  "products": [
    {
      "sku": "SOFA-OSLO-200",
      "slug": "sofa-oslo",
      "name": "Sofa Oslo 2m",
      "collection": "Bắc Âu",
      "category": "sofa",
      "price": 15900000,
      "materials": { "fabric": "#e7e0d3", "wood": "#b08a5a" },     // màu mặc định theo slot
      "variants": [
        { "id": "cream", "label": "Kem", "swatch": "#e7e0d3",
          "materials": { "fabric": "#e7e0d3" }, "priceDelta": 0 }
      ],
      "dimensions": { "w": 2.0, "d": 0.9, "h": 0.82 },
      "rules": {
        "placement": "floor",        // floor | wall | onTop
        "snapToWall": true,          // áp lưng vào tường khi kéo lại gần (< 25 cm)
        "wallGap": 0.03,             // khe hở giữa lưng và tường
        "collides": true,            // false cho thảm, đồ treo tường, đồ đặt lên mặt bàn
        "surfaceHeight": null,       // bàn/kệ: độ cao mặt trên để đồ onTop đặt lên
        "mountHeight": null,         // đồ treo tường: độ cao mép dưới
        "clearanceFront": 0.5,       // khoảng trống nên chừa phía trước
        "rotationStep": 15           // bước xoay (độ)
      },
      "model": "sofa",               // khoá model dựng bằng code, dùng khi chưa có GLB
      "assets": {
        "glb": null,                 // "/models/sofa-oslo.glb"
        "usdz": null,                // cho AR trên iPhone
        "thumb": "/images/products/sofa-oslo.webp",
        "gallery": ["/images/products/sofa-oslo.webp", "/images/products/sofa-oslo-angle.webp"]
      },
      "highlights": ["Khung gỗ sồi sấy"]
    }
  ]
}
```

Các slot vật liệu: `fabric`, `wood`, `metal`, `accent`. Variant chỉ ghi đè những slot nó khai báo.

## `showrooms.json`

```jsonc
{
  "showrooms": [
    {
      "id": "nordic-living",
      "name": "Phòng khách Bắc Âu",
      "style": "Bắc Âu",
      "kind": "living",                         // living | bedroom | dining | studio
      "cover": "/images/showrooms/nordic-living.webp",
      "room": {
        "id": "room-nordic",
        "name": "Phòng khách",
        "height": 2.8,
        "corners": { "c1": [0, 0], "c2": [6.4, 0], "c3": [6.4, 4.4], "c4": [0, 4.4] },
        "outline": ["c1", "c2", "c3", "c4"],    // thứ tự góc tạo thành sàn
        "walls": [
          { "id": "w1", "from": "c1", "to": "c2", "thickness": 0.2,
            "openings": [
              { "id": "o1", "type": "window", "offset": 2.2, "width": 1.8, "height": 1.4, "sill": 0.85 }
            ] }
        ],
        "floor": { "material": "oak-light", "color": "#d8c4a6" },
        "wallColor": "#f2efe9"
      },
      "items": [
        { "uid": "i001", "sku": "SOFA-OSLO-200", "variant": "cream",
          "position": [4.45, 2.2], "elevation": 0, "rotationY": 270 }
      ]
    }
  ]
}
```

- Tường tham chiếu tới góc, nên kéo một góc thì cả hai bức tường nối vào nó đi theo.
- `offset` của cửa tính từ góc `from` của bức tường. Cửa đi có `sill = 0`.
- `position` là vị trí pivot của đồ (tâm đáy). `elevation` > 0 cho đồ treo tường và đồ đặt trên mặt bàn.

## Chuẩn file GLB

1. **Pivot ở tâm đáy**: gốc (0,0,0) nằm giữa hình chiếu của đồ trên sàn, ngay mặt sàn.
2. **Đúng tỉ lệ thật**, đơn vị mét, đã apply scale.
3. **Mặt trước hướng +Z**, trục Y hướng lên.
4. Không chứa đèn, camera hay animation thừa.
5. Vật liệu PBR metallic-roughness. Texture ≤ 2048 px (1024 px cho bản mobile), WebP hoặc KTX2.
6. Biến thể màu dùng extension `KHR_materials_variants`, tên biến thể trùng `variants[].id`.
7. Nén Draco hoặc Meshopt. Đồ lớn 20–50 nghìn tam giác, đồ nhỏ dưới 10 nghìn, mỗi file dưới 2–5 MB.
8. Kèm USDZ cùng tên nếu cần AR trên iPhone.
