# Tiêu chuẩn UI/UX (đọc trước khi viết hoặc chỉnh giao diện)

Nguồn: đo thực tế trên các trang chuẩn của app (Nhân sự, Hệ thống) và trang Tuyển dụng sau khi đã chỉnh.
App là công cụ nghiệp vụ nhiều dữ liệu, nên **chữ nhỏ, gọn, mật độ cao**. Không dùng cỡ chữ của trang marketing.
Quy tắc chọn thành phần (dropdown có tìm kiếm, trường form, tệp đính kèm, trang công khai) nằm ở `UI.md`.
> **Ưu tiên mobile**: app dùng chủ yếu trên iPhone 17 Pro Max (440×956). Số đo `h-8`, `text-xs` dưới đây là của **desktop (≥ md)**; trên mobile control cao `h-11`, chữ input `text-base` (16px, tránh iOS zoom), chạm ≥ 44px, dialog dạng bottom sheet — xem mục "Mobile-first" trong `.rules`.
Bổ sung cho `.rules` (mục Styling, Focus Ring, Animation, Fixed Viewport Layout), không thay thế.

## 1. Thang cỡ chữ

Gốc `html` là 16px. Chỉ dùng các cỡ dưới đây; không tự đặt `text-[Npx]` ngoài danh sách.

| Vai trò | Class | Px | Weight | Dùng cho |
|---|---|---|---|---|
| Tiêu đề trang | `text-base font-semibold` | 16 | 600 | `h1` duy nhất của trang, tiêu đề dialog/sheet |
| Tiêu đề mục | `text-sm font-semibold` | 14 | 600 | `h2` trong form, tiêu đề card/panel |
| Nội dung chính | `text-xs` | 12 | 400/500 | Label, input, ô bảng, tab, menu, nút phụ, mô tả |
| Chữ phụ | `text-[11px]` | 11 | 400 | Gợi ý dưới ô nhập, chú thích, thời gian, badge nhỏ |
| Nhấn nút chính | `text-sm font-medium` | 14 | 500 | Nút hành động chính (Thêm, Lưu), tiêu đề empty state |
| Số liệu tổng quan (KPI) | `text-lg font-semibold tabular-nums` | 18 | 600 | Số trên thẻ thống kê; **tối đa 18px**, riêng số lớn duy nhất của trang tổng quan được `text-2xl` |

Quy tắc:
- Không dùng `text-xl` trở lên cho nội dung thường. Trang không có "hero".
- Một trang chỉ có một `h1`. Không dùng `text-2xl` làm tiêu đề trang.
- Số trong bảng, thống kê, phân trang dùng `tabular-nums`.
- Nhấn mạnh bằng `font-medium`/`font-semibold`, không bằng cách tăng cỡ chữ.
- `text-[10px]` chỉ dành cho chữ cái đầu trong avatar và chấm đếm số tròn `size-4`.
- Không dùng `font-bold` (700) cho chữ thường; dùng tối đa `font-semibold`.
- `font-sans` cho dialog/card title (tránh kế thừa font heading); `font-heading` chỉ dùng khi chủ đích.

## 2. Kích thước control

| Thành phần | Chiều cao | Ghi chú |
|---|---|---|
| Input, select, combobox | `h-8` (32px) | Chữ `text-xs`; ô nhập nhiều dòng `min-h-20` |
| Nút thường / nút chính | `h-8` (32px) | Icon `size-4`, khoảng cách `gap-1.5` |
| Tab / chip lọc | `h-7` (28px) | Chữ `text-xs font-medium`, đếm số đi kèm cùng dòng |
| Thanh tiêu đề trang | `h-6` dòng chữ, `py` nhỏ | Không padding lớn quanh `h1` |
| Hàng bảng | 24 – 32px | Header `text-xs` màu `text-muted-foreground` |

Focus, `aria-invalid`, animation theo `.rules`. Không tự đặt `ring-2`.

## 3. Khoảng cách và bố cục

- Lề trang do layout `main` cấp sẵn (`p-5`, 20px): trang không tự thêm padding ngoài. Khoảng cách giữa các khối `gap-3`; trong khối `gap-2`. Không dùng `p-8`, `gap-8` cho giao diện nghiệp vụ.
- Card/panel: `rounded-lg border` (10px), padding trong tùy khối nhưng không quá `p-4`. Không đổ bóng nặng (`shadow-xs` tối đa).
- Form: nhóm field theo lưới 2 cột (`grid-cols-2 gap-x-4 gap-y-3`); label đặt phía trên, cách ô nhập `gap-1.5`; thông báo lỗi `text-[11px] text-destructive` ngay dưới ô.
- Trang có bảng dùng Fixed Viewport Layout (Pattern C trong `.rules`): chỉ vùng bảng cuộn, thanh lọc và phân trang cố định.
- Dialog rộng `max-w-lg` (form ngắn) hoặc `max-w-2xl` (form dài); không full màn hình trừ trình soạn thảo.

## 4. Màu và trạng thái

- Dùng token (`text-foreground`, `text-muted-foreground`, `bg-muted`, `border`, `text-primary`); không hard-code hex.
- Chữ phụ/mô tả: `text-muted-foreground`. Không giảm độ tương phản dưới mức đọc được ở dark mode.
- Trạng thái dùng badge nhỏ `text-[11px]` có nền nhạt, không dùng khối màu đặc lớn.
- Lỗi tải dữ liệu dùng `ErrorState`; đang tải dùng skeleton cùng kích thước nội dung thật; rỗng dùng icon + 1 dòng tiêu đề `text-sm font-medium` + 1 dòng mô tả `text-xs`.

## 5. Quy tắc cảm giác "mềm" thay vì "cứng"

- Bo góc đồng nhất `rounded-md` (control) và `rounded-lg` (card, dialog); không trộn `rounded-none`/`rounded-3xl`.
- Chuyển trạng thái hover/focus có `transition-colors` (duration theo `.rules`), không đổi màu đột ngột.
- Nút chính chỉ 1 cái nổi bật mỗi vùng; nút còn lại dạng `outline`/`ghost`.
- Văn bản ngắn, rõ động từ ("Thêm tin", "Lưu nháp"); không viết hoa toàn bộ.
- Khi dữ liệu dài, cắt bằng `truncate` kèm `title`, không để vỡ layout.

## 6. Checklist trước khi giao một màn hình

1. `h1` là `text-base font-semibold`, chỉ có một.
2. Không còn `text-xl`/`text-2xl`/`text-lg` ngoài KPI; không có `text-[Npx]` ngoài 11px.
3. Control cao 32px, tab cao 28px.
4. Khoảng cách theo mục 3, không padding lớn.
5. So với một trang chuẩn (Nhân sự `/employees-information`) ở cùng viewport: chữ không lớn hơn, mật độ không thưa hơn.
6. Mở thử dark và light; kiểm tra màn hình hẹp không tràn ngang.
