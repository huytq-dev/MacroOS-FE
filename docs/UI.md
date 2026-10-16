# Quy tắc thành phần giao diện (UI)

Bổ sung cho `TIEU-CHUAN-UI.md` (cỡ chữ, khoảng cách, màu) và `.rules`. File này nói về **dùng thành phần nào cho việc gì**.
Mọi trang mới và mọi lần sửa form phải theo các quy tắc dưới đây.

## 1. Dropdown (ô chọn)

| Tình huống | Dùng | Ghi chú |
|---|---|---|
| Chọn **một** giá trị từ danh mục (đơn vị, vị trí, cấp bậc, ngành nghề, loại hình, ứng viên, mẫu, tin tuyển dụng...) | `SearchableSelect` | **Bắt buộc gõ tìm được.** Gõ ngay trong chính ô chọn (bấm vào ô thì ô thành ô nhập, danh sách bên dưới lọc theo chữ gõ); **không** làm hộp tìm kiếm riêng bên trong danh sách. Tìm không phân biệt dấu (`ha noi` ra `Hà Nội`). |
| Chọn **nhiều** giá trị (địa điểm làm việc, người tham gia, thẻ...) | `SearchableMultiSelect` | Giá trị đã chọn hiện thành thẻ nhỏ trong ô; gõ tìm ngay trong ô, bấm x hoặc Backspace (khi ô tìm trống) để bỏ. |
| Tập giá trị cố định, **tối đa 7 mục** và không thay đổi (Bắt buộc/Không bắt buộc, VND/USD, số dòng mỗi trang, trạng thái) | `Select` (`ui/select`) | Không cần tìm kiếm. |
| Danh mục có thể nhiều hơn 7 mục hoặc do người dùng thêm | `SearchableSelect` | Dù hôm nay mới có 3 mục. |
| Chọn một **hành động** từ danh sách (áp dụng mẫu, sao chép từ tin khác) | `SearchableSelect` với `value=""` | Giá trị luôn rỗng để ô luôn hiện gợi ý sau mỗi lần chọn. |

Quy tắc dùng:
- Import từ `@/components/shared/SearchableSelect` và `@/components/shared/SearchableMultiSelect`; **không tự viết** ô chọn có tìm kiếm riêng. Kiểu `SearchableOption` (`{ value, label, description? }`) và hàm lọc `filterOptions` nằm ở `searchable-options.ts`.
- Trường **không bắt buộc**: truyền `clearLabel="Không chọn"` để có dòng bỏ chọn ở đầu danh sách; hàm `onValueChange` nhận chuỗi rỗng khi bỏ chọn.
- Trong `FormField`, truyền `{...control}` vào ô chọn để nhận `id`, `aria-invalid`, `aria-describedby`.
- Chiều cao `h-8`, chữ `text-xs` (xem `TIEU-CHUAN-UI.md` mục 2). Ô chọn không tự đặt chiều rộng cố định; để form quyết định bằng lưới.
- Ô chọn theo hồ sơ nhân viên (`ProfileEnumSelect`) là biến thể riêng cho dữ liệu nhân sự có nút thiết lập giá trị; trang khác không dùng lại.

## 2. Trường trong form (`FormField`)

Mỗi trường theo đúng thứ tự: **nhãn, dòng gợi ý (nếu có), ô nhập, thông báo lỗi**.
- Nhãn `text-xs font-medium`, dấu `*` đỏ cho trường bắt buộc.
- Dòng gợi ý `text-[11px] text-muted-foreground` nằm **ngay dưới nhãn**, không đặt dưới ô nhập (giống MISA). Gợi ý nói rõ trường này hiển thị ở đâu hoặc dùng làm gì, ví dụ "Tiêu đề hiển thị trên các chức năng và báo cáo của phần mềm".
- Thông báo lỗi nằm dưới ô nhập, `text-[11px] text-destructive`.
- Trường có số ký tự tối đa: hiện bộ đếm `n/max` trong dòng gợi ý và đặt `maxLength`.
- Nhóm trường thành thẻ (`bg-card rounded-xl border p-5`), mỗi thẻ có tiêu đề `text-sm font-semibold`. Trường dài (tiêu đề, địa điểm, mô tả) chiếm cả hàng; trường ngắn đi theo cặp trong lưới 2 cột.

## 3. Tệp và ảnh đính kèm

- Mỗi ô tải tệp ghi rõ định dạng, dung lượng tối đa và số tệp tối đa ngay dưới nhãn.
- Danh sách tệp đã chọn hiện tên (cắt bớt, có `title`), dung lượng và nút xóa có `aria-label`.
- Form **thêm mới** vẫn cho chọn tệp: giữ tạm trong bộ nhớ rồi tải lên ngay sau khi lưu thành công; không khóa nút bắt người dùng lưu trước.
- Vượt dung lượng thì báo ngay bằng toast, không chờ BE từ chối.

## 4. Nút và menu thao tác

- Menu "⋯" trên thẻ/hàng: tối đa 5–6 mục, chữ `text-xs`, icon `size-3.5`, mục nguy hiểm (Xóa) ở cuối và màu `destructive`.
- Mục chưa dùng được thì **khóa** (`disabled`) kèm lý do, không ẩn, để người dùng biết tính năng tồn tại.
- Hành động chính của vùng chỉ có một nút nổi bật; còn lại `outline`/`ghost`.

## 5. Trang công khai (ứng viên nhìn thấy)

- Luôn **theme sáng** (bọc bằng class `light`), không theo chế độ tối của ứng dụng.
- Màu chỉ lấy từ token; ảnh banner nằm ở `public/banner`, hiển thị bằng `next/image` (`fill`, `sizes`, `priority` cho ảnh đầu trang).
- Không ghi tên phần mềm nội bộ ("Horeca Quản lý nhân sự"); dùng nhận diện công ty ở `config/public-brand.ts`.
- Ngoại lệ về cỡ chữ: trang công khai được dùng thang chữ lớn hơn trang quản trị một bậc.
- Tin tuyển dụng công khai: tiêu đề kèm chip địa điểm/hình thức trong banner, thanh thông tin (lương, số lượng, hạn nộp kèm nhãn "Còn N ngày", đổi màu cảnh báo khi còn ≤ 7 ngày) nằm gọn dưới banner; thẻ "Ứng tuyển ngay" dính bên phải ở màn rộng; ở điện thoại dùng thanh "Ứng tuyển ngay" cố định dưới đáy (ẩn khi form đã hiện), ô nhập cao 44px; thẻ tin không có ảnh bìa hoặc ảnh lỗi hiện ô nền thương hiệu cùng cỡ.

## 6. Kiểm tra trước khi giao

- Mọi dropdown danh mục có ô tìm kiếm; bàn phím: bấm vào ô hoặc Tab tới ô là gõ được, mũi tên xuống vào danh sách, Enter chọn dòng đầu khi đang gõ, Escape đóng.
- Mỗi trường có nhãn gắn với ô nhập (`htmlFor`/`id`), lỗi đọc được bằng `aria-describedby`.
- `tsc`, `eslint`, `prettier` sạch; xem trình duyệt ở 1280px và 375px, không tràn ngang.
- Nút kích hoạt tác vụ bất đồng bộ có spinner, nhãn "Đang ...", `disabled` + `aria-busy`, và chặn gửi lặp (mục 12); có phản hồi sau khi xong (mục 13).
- Nút hoặc mục menu bị khóa đều có lý do nhìn thấy được (mục 19); hành động không hoàn tác dùng hộp thoại xác nhận đúng mục 14, nêu đúng hậu quả.
- Danh sách có đủ bốn trạng thái: tải, lỗi, rỗng thật, rỗng do lọc (mục 16); lỗi biểu mẫu hiện tại chỗ và focus ô lỗi đầu tiên (mục 17).

## 7. Dùng component shadcn, không dùng thẻ thô

Mọi giao diện dựng từ component trong `components/ui` (shadcn) hoặc thành phần dùng chung đã bọc chúng. Không tự dựng bằng thẻ HTML thô khi đã có component.

| Cần | Dùng | Không dùng |
|---|---|---|
| Khung nhóm trong form | `FormCard` (bọc `Card`, có tiêu đề, mô tả, hiệu ứng hiện nhẹ) | `<section className="bg-card rounded-xl border p-5">` |
| Bảng dữ liệu | `Table`, `TableHeader`, `TableRow`, `TableHead`, `TableCell` | `<table>`, `<th>`, `<td>` |
| Nút chỉ có biểu tượng (sửa, xóa) | `IconButton` (có chú thích, luôn có `aria-label`) | `Button` icon không nhãn |
| Nút thêm dòng/mục cuối danh sách | `DashedAddButton` | `<button>` nét đứt tự viết |
| Trạng thái, số đếm, nhãn nhỏ | `Badge` | `<span className="rounded bg-muted ...">` |
| Danh sách rỗng | `Empty` (`EmptyMedia`, `EmptyTitle`, `EmptyDescription`) | một dòng chữ xám |
| Mở/đóng nội dung | `Collapsible` kèm `animate-collapsible-down/up` | ẩn/hiện không chuyển động |
| Ô tìm kiếm có biểu tượng | `InputGroup` + `InputGroupAddon` + `InputGroupInput` | `<input type="search">` |
| Vùng cuộn có thanh cuộn | `ScrollArea` | `overflow-y-auto` rời |
| Đường phân cách | `Separator` | `<div className="border-t">` |
| Khung chờ | `Skeleton` | `div` có `animate-pulse` |
| Ô nhập, chọn, tích, công tắc, nhãn | `Input`, `Select`, `SearchableSelect`, `Checkbox`, `Switch`, `Label` | thẻ gốc |
| Chuyển tab trong trang | `Tabs`, `TabsList variant="line"`, `TabsTrigger`, `TabsContent` | `<button role="tab">` tự viết |
| Chọn một trong vài lựa chọn dạng ô vuông (chọn màu) | `ToggleGroup type="single"` + `ToggleGroupItem` | `<button role="radio">` tự viết |
| Khung thông tin chỉ đọc (trạng thái, liên kết) | `Card` + `CardContent` | `<section className="border ...">` |

`FormField` (nhãn, gợi ý, ô nhập, lỗi) nằm ở `components/shared/FormField` và dùng chung toàn app, không đặt trong thư mục của một trang.

## 8. Chuyển động

- Dùng `tw-animate-css` theo `.rules`: thời lượng bằng `animation-duration-*` (không dùng `duration-*`); micro 150ms, danh sách/menu 200ms, hộp thoại 250ms, ngăn kéo 300ms.
- Mục hoặc dòng mới hiện: `motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:animation-duration-200`. Luôn có tiền tố `motion-safe:` để tôn trọng người tắt chuyển động.
- Mở rộng nội dung dùng `Collapsible` với `data-[state=open]:animate-collapsible-down` và `data-[state=closed]:animate-collapsible-up`; mũi tên xoay bằng `transition-transform duration-200`.
- Đổi trạng thái hover/focus dùng `transition-colors`, không đổi màu đột ngột.

## 9. Tổ chức thư mục component của một trang

- `components/<PageName>/` chia thư mục con theo từng khối giao diện (tab, màn con), mỗi thư mục con có `index.ts` xuất các thành phần dùng bên ngoài. Thành phần điều phối ở thư mục gốc chỉ nhập qua `index.ts` của thư mục con.
- Một file không quá khoảng 200 dòng; vượt thì tách (mỗi dòng của danh sách, phần nhập lựa chọn... thành file riêng).
- Component không gọi hook React Query hay API: trang (`pages/`) nạp dữ liệu rồi truyền xuống bằng props. Hook của React Hook Form (`useFieldArray`, `useWatch`) trong component thì được.
- Hằng số dùng chung giữa nhiều màn nằm trong `types/*.types.ts` của feature, không để trong file component.
- Trong cùng một feature dùng đường dẫn tương đối; chỉ dùng `@/` cho `components/`, `lib/`, `config/`, `features/` khác.

## 10. Kiểu hiển thị (style) chuẩn của các khối thường gặp

Phong cách chung: **gọn, tối giản, bám MISA**. Viền mảnh, nền token, chữ `text-xs`, ít màu; màu nhấn chỉ dùng cho hành động chính và trạng thái. Không đổ bóng nặng; thẻ dùng `shadow-none` hoặc mặc định của `Card`.

### 10.1 Khung thông tin chỉ đọc (trạng thái, liên kết, mốc thời gian)

Mẫu: `JobStatusPanel`. Dùng khi cần hiện nhiều thông tin ngắn ở đầu form.
- `Card` nền `bg-muted/30`, `shadow-none`, bên trong `CardContent` dạng lưới `grid gap-x-6 gap-y-4 p-4 sm:grid-cols-2 lg:grid-cols-3`.
- Mỗi ô (`InfoItem`): **biểu tượng `size-3.5` + nhãn** `text-[11px] text-muted-foreground` ở trên, **giá trị** `text-xs` (đậm `font-medium` với dữ liệu chính) ở dưới, mô tả phụ `text-[11px] text-muted-foreground`. Ô cần rộng (đường dẫn) thì `sm:col-span-2 lg:col-span-1`.
- Ô có hành động (đường dẫn kèm Mở/Sao chép): chữ ở trái, **nút biểu tượng ở bên phải cùng một hàng**: `flex items-center justify-between gap-2`; chữ `min-w-0 truncate` kèm `title`, cụm nút `shrink-0`. **Không để nút xuống dòng** (dùng `IconButton` thay nút có chữ).
- Giá trị trạng thái dùng `Badge`; ngày giờ hiển thị `dd/MM/yyyy - HH:mm` bằng `formatDateTime`, ngày bằng `formatDate`.
- Hiện thêm khi thiếu chỗ: hiển thị trên website, lần đăng gần nhất, hạn nộp, email nhận hồ sơ. Giá trị chưa có hiện `—`.

### 10.2 Danh sách dòng có thao tác (quy trình, loại vòng, khoản chi...)

Mẫu: `RoundListEditor`, `RoundTypesPanel`.
- Mỗi dòng: `rounded-lg border px-3 py-2 gap-3 text-xs`, từ trái sang phải: **tay cầm kéo** (`SortableItem`), **ô màu** `size-3 rounded-sm`, **tên** `flex-1 truncate font-medium`, nhãn loại (`Badge outline`), **nút sửa** (bút chì), **nút xóa** (thùng rác, hover chuyển `text-destructive`). Hover dòng: `hover:border-primary/30 transition-colors`.
- Dòng **khóa** (không sửa/kéo/xóa): nền `bg-muted/40`, không tay cầm (giữ chỗ trống `size-6` để chữ thẳng hàng), hiện `Badge secondary` kèm biểu tượng khóa chữ "Cố định". Chỉ khóa thứ thật sự không đổi được; thứ đổi được thì phải mở cho sửa, không gắn nhãn "Mặc định" gây hiểu nhầm là khóa.
- Nút thêm: `DashedAddButton` nằm **ngay trước dòng cố định cuối** (ví dụ trước Offer/Đã tuyển), không nằm cuối danh sách.
- Dòng mới hiện có chuyển động (mục 8); kéo thả chỉ đổi thứ tự trong vùng cho phép, thả vào vị trí của dòng khóa thì bỏ qua.
- Đổi thứ tự lưu ngay (cập nhật giao diện trước, lỗi thì hoàn lại và báo toast).

### 10.3 Hộp thoại thêm/sửa nhỏ

- `Dialog` rộng `sm:max-w-sm`; tiêu đề `font-sans text-sm font-semibold`, đổi chữ theo ngữ cảnh ("Thêm …"/"Sửa …"); chân hộp: `Hủy` (`outline`) rồi `Lưu` (nút chính), khi đang lưu hiện "Đang lưu...".
- Chọn màu: `ToggleGroup type="single"` các ô vuông `size-8`, ô đang chọn có `ring-2 ring-primary` và dấu tích; bấm lại ô đang chọn không bỏ chọn.
- Hộp thoại nằm trong form khác: chặn sự kiện submit nổi lên (`event.stopPropagation()`) để không lưu nhầm form ngoài.

### 10.3b Popover cài đặt nhỏ (bánh răng trên thẻ)

Mẫu: `FunnelSettings`.
- `PopoverContent align="end" sideOffset={4}`, rộng `w-72`, `space-y-3 p-3`; nút kích hoạt là `IconButton` có chú thích.
- Mọi chữ trong popover là `text-xs` (nhãn tùy chọn `font-normal`); **nút `Hủy` (`outline`) và `Đồng ý` dùng `size="sm" className="text-xs"`**, không để chữ nút mặc định `text-sm`.
- Lựa chọn dùng `RadioGroup`/`Checkbox` bọc trong `Label` (`items-start` khi nhãn dài xuống dòng, `mt-0.5` cho ô chọn); ô chưa chọn có viền `border-muted-foreground/60` để thấy rõ ở chế độ tối.
- Chọn dở không áp dụng ngay: giữ bản nháp trong popover, chỉ gọi `onApply` khi bấm `Đồng ý`; mở lại luôn bắt đầu từ giá trị đang áp dụng.

### 10.4 Trang thiết lập có nhiều tab

- Đầu trang `SettingsPage` (tiêu đề + mô tả + nút chính bên phải, nút chính chỉ hiện ở tab cần lưu); dưới là `Tabs` kiểu `line` (`TabsList variant="line" className="w-full justify-start border-b"`, `TabsTrigger className="flex-none text-xs"`).
- Nội dung tab vào bằng `motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-200`.
- Câu mô tả đầu tab `text-xs text-muted-foreground`, một đến hai câu, nói rõ ràng buộc ("Chỉ Ứng tuyển và Đã tuyển là mốc cố định").

### 10.5 Form tin nhiều mục (thanh mục bên trái)

- Thanh mục `JobFormNav` bằng `Button ghost`, mục đang mở nền `bg-primary/10 text-primary font-semibold`, chấm đỏ cho mục có lỗi.
- Trong form tin, chữ lớn hơn một bậc bằng class `text-plus-1` (13px thay 12px) để dễ đọc; không tự đổi cỡ chữ từng trường.
- Thanh hành động cố định đáy: `Hủy`, `Lưu nháp`, nút chính. **Sửa tin lưu xong ở lại trang sửa** (nạp lại form theo bản đã lưu, hiện toast), không tự chuyển sang trang khác; chỉ thêm mới mới chuyển trang sau khi lưu.

### 10.6 Chữ, màu và chế độ sáng/tối

- Màu chỉ lấy từ token trong `app/index.css`/`theme.css` (`bg-card`, `text-muted-foreground`, `border`, `primary`, `destructive`); ô màu loại vòng dùng bảng `roundTypeColorClasses` (9 màu), không viết màu Tailwind rời.
- **Vòng focus thống nhất toàn app: `focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50`.** Ô lỗi thêm `aria-invalid:ring-1 aria-invalid:ring-destructive/20`; vùng bọc (nhóm ô nhập) dùng `focus-within:ring-1 focus-within:ring-ring/50`. Không dùng `ring-2`, `ring-3` hay giá trị khác cho focus (cả component trong `components/ui`, trang quản trị và trang công khai). `ring-2 ring-primary` chỉ dùng để báo **ô đang được chọn** (ví dụ chọn màu, mục 10.3), không phải focus.
- Mọi khối phải đọc được ở cả sáng và tối (kiểm tra cả hai); trang công khai ép sáng (mục 5).
- Biểu tượng `lucide-react` `size-3.5`/`size-4`, luôn `aria-hidden="true"`; nút chỉ có biểu tượng phải có nhãn (mục 7).

## 11. Lọc theo khoảng ngày (chọn nhanh)

Mọi bộ lọc có khoảng ngày (hạn nộp, ngày tạo, ngày ứng tuyển...) dùng `DateRangeFilter`, **không** tự đặt hai ô `DatePicker` "từ ngày", "đến ngày" rời nhau.

- Component: `@/components/shared/DateRangeFilter`. Ô chọn nhanh có dấu X để bỏ chọn; chọn "Tùy chọn thời gian" thì hiện hai ô ngày để nhập tay; chọn mốc nhanh thì hiện khoảng ngày tương ứng ngay dưới ô.
- Mốc nhanh nằm ở **một chỗ**: `@/config/date-range-presets` (như `config/pagination.ts`). Không khai báo danh sách mốc trong component hay trang. Thêm hoặc đổi mốc chỉ sửa file này.
  - `UPCOMING_DATE_RANGE_PRESETS` (nhìn về phía trước: Hôm nay, Ngày mai, 3/7/30 ngày tới, Đã hết hạn): dùng cho hạn nộp, hạn xử lý, ngày hết hạn.
  - `PAST_DATE_RANGE_PRESETS` (nhìn về phía sau: Hôm nay, Hôm qua, 7/30 ngày qua, Tháng này, Tháng trước): dùng cho ngày tạo, ngày nộp, ngày cập nhật.
  - Cần bộ mốc mới thì thêm một hằng `*_DATE_RANGE_PRESETS` cùng file, mỗi mốc gồm `value`, `label`, `resolve(today)`.
- Bộ mốc tối đa 6 mục cộng "Tùy chọn thời gian" (đúng giới hạn 7 mục của `Select` ở mục 1).
- Giá trị của form vẫn là cặp `from`/`to` dạng `yyyy-MM-dd` (ví dụ `deadlineFrom`, `deadlineTo`); form, schema và BE **không** biết mốc nhanh nào được chọn. Truyền hai giá trị này bằng `useWatch` và ghi lại bằng `form.setValue` cho cả hai trường.
- `resolve` chỉ được gọi trong sự kiện bấm, không gọi lúc render (tránh lệch hydration theo `.rules`).
- Bọc trong `FormField` như mọi trường khác: truyền `{...control}` để nhận `id`, `aria-invalid`, `aria-describedby`; lỗi "ngày kết thúc phải sau ngày bắt đầu" đặt ở `error` của `FormField`.
- Giới hạn đã biết: mở lại bộ lọc đã áp dụng thì hiện ở dạng "Tùy chọn thời gian" kèm hai ngày đã lưu, vì không suy ngược được mốc nhanh từ ngày đã lưu.
- Mẫu tham khảo: `JobFilterDrawer` (`features/recruitment/components/RecruitmentJobList`).

## 12. Nút và trạng thái đang xử lý (spinner)

Mọi nút kích hoạt tác vụ bất đồng bộ (lưu, xóa, gửi email, tải lên, chuyển vòng, gộp, tạo, xuất...) phải cho người dùng thấy **ngay lập tức** là hệ thống đang làm việc. Khi tác vụ đang chạy, nút có đủ bốn thứ:

1. **Spinner** `Loader2` (lucide) với `aria-hidden="true"` và `animate-spin`, đặt ở đầu nút, **thay chỗ biểu tượng dẫn đầu** (không có cả hai).
2. **Nhãn đổi sang dạng đang làm**: "Đang lưu...", "Đang xóa...", "Đang gửi...", "Đang tải lên...". Dùng đúng dấu ba chấm `...`.
3. **Khóa nút**: `disabled` kèm `aria-busy="true"`. Nút phụ cùng hàng (Hủy) cũng khóa nếu hủy giữa chừng không an toàn.
4. **Chặn gửi lặp ở cả hàm xử lý** (`if (isPending) return`), vì phím Enter trong form vẫn gọi được hàm dù nút đã khóa.

```tsx
<Button type="submit" size="sm" className="text-xs" disabled={isPending} aria-busy={isPending}>
  {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
  {isPending ? 'Đang lưu...' : 'Lưu'}
</Button>
```

Quy tắc kèm theo:
- Cỡ spinner bằng cỡ biểu tượng của nút: `size-4` với nút `default`/`sm`/`lg`; `size-3` với nút `xs`/`icon-xs`. Nút chỉ có biểu tượng (`IconButton`): spinner **thay** biểu tượng, giữ nguyên kích thước nút để không lắc bố cục; vẫn giữ `aria-label`.
- Mục trong menu "⋯" đang chạy: khóa mục, hiện spinner `size-3.5` và nhãn "Đang ...", đóng menu khi xong.
- Hộp thoại đang xử lý: khóa cả hai nút ở chân hộp, **không đóng được bằng Esc hoặc bấm ra ngoài**, giữ nguyên nội dung đã nhập.
- Nút Lưu **không khóa chỉ vì form chưa hợp lệ**: để người dùng bấm và thấy lỗi tại từng ô (xem mục 17). Chỉ khóa khi đang xử lý.
- Tác vụ biết được tiến độ (tải tệp lên, nhập/xuất số lượng lớn): dùng `Progress` kèm tên tệp và phần trăm, cho hủy nếu làm được; không dùng spinner trơn thay cho thanh tiến độ.
- Điều hướng thuần (`Link`, `Button asChild` + `Link`) **không** có spinner: thanh tiến trình đầu trang đã báo. Vùng nội dung đang tải dữ liệu dùng `Skeleton` (xem `.rules`, mục Loading UX), không dùng spinner.
- Không có tác vụ nào bấm xong mà giao diện không đổi gì: nếu kết quả chưa có thì phải thấy spinner, khi có kết quả phải có phản hồi (mục 13).
- Chỉ khóa nút **trong lúc chờ**; khi lỗi, mở khóa ngay và giữ dữ liệu người dùng đã nhập để thử lại.

## 13. Phản hồi sau hành động (toast và thông báo)

- Mọi hành động do người dùng bấm đều có phản hồi. Thành công: toast ngắn (Sonner), nêu đối tượng và kết quả, không quá khoảng 60 ký tự ("Đã xóa tin tuyển dụng", "Đã thêm đơn ứng tuyển vào hồ sơ có sẵn"). Thất bại: toast lỗi **và** `logger.error` (xem `.rules`, mục Error Handling).
- Lỗi mà người dùng phải sửa ngay tại chỗ (form, hộp thoại) hiện **tại chỗ** (cạnh ô lỗi hoặc khung `Alert` có `role="alert"`), không chỉ toast, vì toast biến mất.
- Lỗi **tải** dữ liệu dùng `ErrorState`, không dùng toast (tránh báo trùng).
- Thông báo lỗi từ BE đã là tiếng Việt thì hiện nguyên văn; không tự bịa câu chung chung nếu BE có câu cụ thể ("Tin 'X' đã có 3 ứng viên nên không thể xóa...").
- Thao tác hàng loạt chỉ hiện **một** toast tổng ("Đã xóa 2 tin tuyển dụng"), kèm khung nêu số mục bị bỏ qua và lý do khi có.
- Cảnh báo cần đọc lâu hoặc cần hành động tiếp **không** dùng toast; dùng khung thông báo nội tuyến (mục 15).
- Sau thành công giữ đúng ngữ cảnh: sửa ở lại trang sửa (mục 10.5), xóa thì cập nhật danh sách và lùi trang nếu trang hiện tại không còn dữ liệu, tạo mới thì chuyển trang.

## 14. Hộp thoại xác nhận hành động không hoàn tác

Dùng `AlertDialog` cho xóa, gộp, gỡ liên kết và mọi hành động khó hoàn tác.
- **Tiêu đề là câu hỏi cụ thể** ("Xóa tin tuyển dụng?"). Thân hộp nêu tên đối tượng và **hậu quả chính xác**: xóa gì, giữ lại gì, có thể phục hồi không. Không viết điều hệ thống không làm, và nói rõ phần được giữ lại: xóa tin tuyển dụng thì dữ liệu gắn với tin (đơn ứng tuyển, lịch phỏng vấn, đánh giá, thư mời) mất, còn "Hồ sơ ứng viên vẫn được giữ lại trong hệ thống".
- **Chặn trước khi FE đã biết chắc từ dữ liệu có sẵn; còn lại để BE quyết định và hiện lỗi tại chỗ.** Nếu từ dữ liệu đang có đã biết chắc hành động bị từ chối thì khóa mục/nút kèm lý do nêu **số lượng cụ thể** và đặt cạnh đó hành động nên làm thay thế (xem mục 4 và mục 19). Nếu quy tắc chỉ BE kiểm tra được (ví dụ xóa tin có ứng viên đã tạo hồ sơ nhân viên), **cho mở hộp thoại** và hiện thông báo của BE trong hộp thoại khi bị từ chối (xem ý "Lỗi do dữ liệu đổi giữa chừng (409)" bên dưới), không tự suy ra quy tắc ở FE rồi khóa nhầm.
- Khi sản phẩm có lựa chọn an toàn hơn và người dùng cần biết (không bắt buộc), nêu ngay trong thân hộp và cho thực hiện luôn; hộp thoại hiện tại đóng trước khi mở hộp thoại thay thế. Nếu đã quyết định bỏ lựa chọn đó khỏi giao diện (ví dụ mục "Đóng tin" đã bỏ khỏi menu ⋯ của thẻ tin) thì không gợi ý nó nữa.
- Chân hộp: `Hủy` (`outline`) rồi nút phá hủy (`destructive`). **Focus mặc định vào `Hủy`**. Đang xử lý thì khóa cả hai và hiện "Đang xóa..." (mục 12).
- Mức "ma sát" theo rủi ro: bản nháp hoặc dữ liệu trống thì xác nhận một bước, không thêm cảnh báo thừa; dữ liệu có liên quan thì nêu số lượng bị ảnh hưởng. Chỉ yêu cầu gõ lại tên khi vừa **không hoàn tác được** vừa ảnh hưởng nhiều dữ liệu, và đó là ngoại lệ.
- Lỗi do dữ liệu đổi giữa chừng (409): **giữ hộp thoại mở**, hiện thông báo của BE ngay trong hộp (`role="alert"`), khóa nút phá hủy và vẫn cho chọn hành động thay thế; làm mới dữ liệu phía sau.
- Hàng loạt: nêu số mục sẽ xử lý, số mục bị bỏ qua và lý do; chỉ xử lý phần hợp lệ sau khi xác nhận; nếu không mục nào hợp lệ thì khóa nút ở thanh hàng loạt kèm lý do.

## 15. Khung thông báo nội tuyến (`Alert`)

Dùng `Alert` (`components/ui/alert`) cho thông tin, cảnh báo và lỗi nằm trong trang, hộp thoại hoặc form. Không tự dựng `div` có viền và nền màu.
- Thông tin trung tính dùng mặc định; lỗi và cảnh báo nghiêm trọng dùng biến thể `destructive`. Màu chỉ lấy từ token (mục 10.6).
- Cấu trúc: biểu tượng `size-4` (`aria-hidden`), **một dòng tiêu đề** `text-xs font-medium`, mô tả `text-xs`/`text-[11px]` nếu cần, hành động (nút hoặc liên kết) ở cuối. Lỗi có `role="alert"`; thông tin có `role="status"`.
- Đặt **ngay trên nội dung liên quan** (đầu hộp thoại, đầu form, trên ô nhập), không chặn thao tác trừ khi nội dung nói rõ là phải làm gì.
- Không xếp nhiều khung cùng loại; gộp lại hoặc cho thu gọn (Thu gọn/Mở rộng).
- Cảnh báo "có thể trùng", "tin đã đăng nên khóa quy trình" là khung `Alert` chứ không phải toast. Cảnh báo không chặn thì **không** khóa nút Lưu.

## 16. Trạng thái trang: đang tải, rỗng, lỗi, lọc không có kết quả

Mỗi danh sách, bảng, khối dữ liệu có đủ bốn trạng thái, mỗi trạng thái một cách hiển thị riêng:

| Trạng thái | Hiển thị |
|---|---|
| Đang tải lần đầu | `Skeleton` cùng kích thước nội dung thật |
| Lỗi tải | `ErrorState` đúng `variant` (xem `.rules`) |
| Rỗng thật (chưa có dữ liệu) | `Empty` có tiêu đề, một câu mô tả và nút "Thêm ..." nếu người dùng có quyền |
| Rỗng do bộ lọc | "Không có kết quả phù hợp" và nút **"Xóa bộ lọc"**; không hiện nút tạo mới như rỗng thật |

- Đổi bộ lọc, trang, sắp xếp: giữ dữ liệu cũ (hơi mờ) kèm chỉ báo nhỏ khi đang tải lại (`isFetching`), **không** nháy lại skeleton cả bảng.
- Từ khóa, bộ lọc, sắp xếp, số dòng mỗi trang, trang hiện tại lưu **trên URL** để chia sẻ và quay lại đúng chỗ; đổi bộ lọc thì về trang 1; luôn hiện tổng số kết quả.
- Số dùng `tabular-nums`; ngày `dd/MM/yyyy` (`formatDate`), giờ `HH:mm`; giá trị chưa có hiện `—`.

## 17. Form: kiểm tra, lỗi và thoát trang

- Kiểm tra bằng Zod, đối chiếu validator BE. Hiện lỗi **sau khi rời ô** hoặc khi bấm Lưu; sau lần gửi đầu, kiểm tra lại khi gõ để lỗi biến mất ngay khi đã sửa.
- Bấm Lưu khi chưa hợp lệ: **cuộn và focus vào ô lỗi đầu tiên**; không khóa nút trước đó (mục 12).
- Dữ liệu đã nhập **không bao giờ mất** khi lỗi mạng hoặc BE từ chối.
- Có thay đổi chưa lưu mà người dùng rời trang hoặc đóng hộp thoại: hỏi xác nhận bỏ thay đổi; nếu app đã có thành phần dùng chung thì dùng lại, không tự viết mới.
- Giá trị mặc định hợp lý (ngày hôm nay, người đang đăng nhập); ô phụ thuộc chưa đủ điều kiện thì khóa kèm placeholder rõ ("Chọn quốc gia trước").
- Khi dữ liệu nhập có thể trùng với dữ liệu có sẵn, báo ngay tại form bằng khung `Alert` (mục 15), nêu hồ sơ trùng và cho chọn hướng xử lý; không chặn người dùng.

## 18. Bảng và danh sách

- Hàng bấm được mở chi tiết; ô thao tác (checkbox, menu "⋯", liên kết) **không** kích hoạt hàng. Hỗ trợ bàn phím (`Enter` mở hàng). Hover `bg-muted/40`.
- Hàng cần chú ý (trùng, quá hạn) có **nhãn chữ** (`Badge`) cộng nền nhẹ; không chỉ dùng màu.
- Thao tác hàng loạt: thanh hiện khi có hàng được chọn, nêu **số đã chọn** và phạm vi (trang hiện tại); nút không áp dụng được thì khóa kèm lý do (mục 19).
- Phân trang `10/25/50` dòng, mặc định 10: giá trị chỉ lấy từ `config/pagination.ts` (`PAGE_SIZE_OPTIONS`, `DEFAULT_PAGE_SIZE`), không viết số rời ở từng trang. Mặc định 10 vì DB ở xa và thẻ/hàng nặng; muốn đổi cho toàn app thì chỉ sửa file cấu hình đó. Tiêu đề bảng cố định khi cuộn; cột nhiều thì cho tùy chỉnh cột.
- Một trang chỉ có **một** hành động chính nổi bật (mục 4); các thao tác khác `outline`/`ghost`.

## 19. Hộp thoại, ngăn kéo, menu và nút bị khóa

- Chiều rộng hộp thoại: `sm:max-w-sm` cho xác nhận và form 1-2 trường; `sm:max-w-md` form vừa; `sm:max-w-lg` danh sách hoặc nội dung dài. Nội dung dài cuộn **bên trong** (`max-h-[80dvh] overflow-y-auto`), tiêu đề và chân hộp luôn thấy.
- Không mở hộp thoại trong hộp thoại quá một tầng (trừ xác nhận ngắn); khi chuyển sang hành động khác thì đóng hộp thoại cha trước.
- Đóng bằng `Esc`, nút ✕ hoặc `Hủy`; **không đóng khi đang xử lý** (mục 12); trả focus về phần tử đã mở hộp thoại.
- **Nút hoặc mục menu bị khóa luôn có lý do nhìn thấy được.** Mục menu `disabled` không nhận chuột nên tooltip không hiện: viết lý do thành dòng chữ phụ `text-[11px] text-muted-foreground` ngay dưới mục. Nút `disabled` ngoài menu: bọc nút trong `span` có `Tooltip` hoặc để dòng chữ cạnh nút. Không để nút xám mà không giải thích.
- Menu "⋯" xem mục 4: tối đa 5-6 mục, mục nguy hiểm ở cuối.

## 20. Chữ trên giao diện (microcopy)

- Tiếng Việt có dấu, câu ngắn, chủ động. Nhãn nút = **động từ + đối tượng** ("Thêm vào tin", "Tạo hồ sơ nhân viên"). Cặp chuẩn: `Lưu`/`Hủy`, `Xóa`, `Đóng` (đóng cửa sổ) khác với `Đóng tin` (đổi trạng thái); không trộn tiếng Anh ("Delete", "Submit").
- Trạng thái đang làm dùng "Đang ...": "Đang lưu...", "Đang xóa...".
- Thông báo lỗi nói **chuyện gì đã xảy ra và làm gì tiếp**, không lộ mã kỹ thuật hay dấu vết lỗi: "Không lưu được. Kiểm tra kết nối rồi thử lại."
- Nêu số cụ thể thay cho "một số": "2 ứng viên đã được tạo hồ sơ nhân viên".
- Nhãn trạng thái dùng **cùng một từ ở mọi nơi**, lấy từ một chỗ trong `src/config` hoặc `types/`, không viết lại ở từng màn.
- Ngày `dd/MM/yyyy`, ngày giờ `dd/MM/yyyy - HH:mm`; số và tiền theo `vi-VN` (ví dụ `1.000.000`).

## 21. Truy cập (a11y) tóm tắt

- Mọi thao tác làm được bằng bàn phím; focus nhìn thấy theo `.rules`. Không để thông tin quan trọng chỉ nằm trong tooltip (cần rê chuột).
- Nút chỉ biểu tượng luôn có `aria-label` (dùng `IconButton`); biểu tượng trang trí `aria-hidden`.
- Trạng thái động: `aria-busy` cho nút hoặc vùng đang xử lý; kết quả bất đồng bộ báo qua toast hoặc `role="status"`/`role="alert"`.
- Vùng bấm tối thiểu 32px (`h-8`) cho nút thường; `icon-xs` (24px) chỉ dùng trong hàng bảng.
- Không chỉ dùng màu để phân biệt trạng thái; kiểm tra tương phản ở cả sáng và tối.
- Hộp thoại giữ focus bên trong và trả focus khi đóng (đã có sẵn ở `Dialog`/`AlertDialog` của shadcn, không phá).

## 22. Chống gửi lặp và dữ liệu đổi giữa chừng

- Mọi mutation: nút khóa khi `isPending` **và** có guard trong hàm xử lý (mục 12).
- Cập nhật lạc quan (kéo thả đổi thứ tự): cập nhật giao diện trước, lỗi thì hoàn lại và báo toast.
- Dữ liệu có thể đã đổi bởi người khác (409): báo lỗi **tại ngữ cảnh** (mục 14) và làm mới dữ liệu; không tự động thử lại.
- Phản hồi cũ không được ghi đè phản hồi mới: khóa truy vấn chứa đủ tham số (`['resource', params]`).
- Khi thao tác gửi nhiều yêu cầu (xóa hàng loạt), chạy từng mục độc lập, gom kết quả thành một thông báo, không để một mục lỗi làm hỏng cả lô.

## 23. Chỉ tải dữ liệu khi cần dùng (lazy loading)

Nguyên tắc: **mở cái gì thì gọi cái đó**. Vào trang chỉ tải phần hiển thị ngay; phần nằm trong tab, hộp thoại, ngăn kéo, mục thu gọn chỉ tải khi người dùng mở.

- Tab: nội dung tab chỉ gọi API khi tab đang mở (`enabled` theo tab hiện tại). Đã mở rồi thì giữ cache, mở lại không gọi lại.
- Hộp thoại/ngăn kéo cần danh sách (mẫu email, mẫu đánh giá, trường tùy chỉnh, danh sách tin...): chỉ tải khi mở, trong lúc chờ hiện Skeleton hoặc "Đang tải ..." (mục 16, 12), nút xác nhận khóa tới khi dữ liệu về.
- Số trên nhãn tab (số lịch, số email...): lấy từ trường đếm có sẵn trong đối tượng cha. Chưa có thì ẩn số cho tới khi tab mở, không tải cả danh sách chỉ để đếm.
- Danh mục dùng chung chia hai nhóm: **lõi** (tải ở hầu hết trang) và **nặng** (mẫu, trường tùy chỉnh — chỉ nơi dùng mới gọi).
- Lọc theo đối tượng cha gửi tham số lên máy chủ; không kéo toàn bộ rồi lọc ở FE. Danh sách phân trang theo cấu hình chuẩn (10/25/50), không đặt cỡ trang lớn để lấy hết.
- Kiểm tra trước khi giao: reload trang, mở tab Network, đếm request lúc mở; trang chi tiết thường chỉ còn 2–3 request (chi tiết, danh sách chính, danh mục lõi).
