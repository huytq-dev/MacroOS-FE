# Quy tắc thành phần giao diện (UI)

Bổ sung cho `TIEU-CHUAN-UI.md` (cỡ chữ, khoảng cách, màu) và `.rules`. File này nói về **dùng thành phần nào cho việc gì**.
Mọi trang mới và mọi lần sửa form phải theo các quy tắc dưới đây.

## 1. Dropdown (ô chọn)

| Tình huống                                                                                                                | Dùng                              | Ghi chú                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Chọn **một** giá trị từ danh mục (đơn vị, vị trí, cấp bậc, ngành nghề, loại hình, ứng viên, mẫu, tin tuyển dụng...)       | `SearchableSelect`                | **Bắt buộc gõ tìm được.** Gõ ngay trong chính ô chọn (bấm vào ô thì ô thành ô nhập, danh sách bên dưới lọc theo chữ gõ); **không** làm hộp tìm kiếm riêng bên trong danh sách. Tìm không phân biệt dấu (`ha noi` ra `Hà Nội`). |
| Chọn **nhiều** giá trị (địa điểm làm việc, người tham gia, thẻ...)                                                        | `SearchableMultiSelect`           | Giá trị đã chọn hiện thành thẻ nhỏ trong ô; gõ tìm ngay trong ô, bấm x hoặc Backspace (khi ô tìm trống) để bỏ.                                                                                                                 |
| Tập giá trị cố định, **tối đa 7 mục** và không thay đổi (Bắt buộc/Không bắt buộc, VND/USD, số dòng mỗi trang, trạng thái) | `PickerSelect`                    | Không cần tìm kiếm. Chạm mở bảng trượt `ChoiceSheet` (✕, tiêu đề, danh sách radio, chọn là đóng) — **không** dùng `ui/select` hay `<select>` gốc.                                                                              |
| Danh mục có thể nhiều hơn 7 mục hoặc do người dùng thêm                                                                   | `SearchableSelect`                | Dù hôm nay mới có 3 mục.                                                                                                                                                                                                       |
| Chọn một **hành động** từ danh sách (áp dụng mẫu, sao chép từ tin khác)                                                   | `SearchableSelect` với `value=""` | Giá trị luôn rỗng để ô luôn hiện gợi ý sau mỗi lần chọn.                                                                                                                                                                       |

**Không có dropdown xổ xuống trong app** (như MacroFactor): mọi ô chọn giá trị mở bảng trượt từ đáy. Danh sách → `PickerSelect` / `ChoiceSheet` (`components/shared`); chọn tháng / năm → `MonthYearPickerSheet` ("Select Month": nhãn năm + lưới 3×4 Jan…Dec; "Select Year": "2020 - 2029" + ‹ › lật thập kỷ, lưới trượt 300ms, 12 năm 3 cột, năm ngoài thập kỷ mờ; ô chọn là viên trắng `bg-foreground`, tháng/năm tương lai mờ và tắt, nút xám rộng "Go to Today"). `DropdownMenu` chỉ dùng cho menu **hành động** (AvatarMenu), không để chọn giá trị. `SearchableSelect` trên điện thoại đã là bảng trượt có ô tìm.

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

| Cần                                                 | Dùng                                                                       | Không dùng                                            |
| --------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------- |
| Khung nhóm trong form                               | `FormCard` (bọc `Card`, có tiêu đề, mô tả, hiệu ứng hiện nhẹ)              | `<section className="bg-card rounded-xl border p-5">` |
| Bảng dữ liệu                                        | `Table`, `TableHeader`, `TableRow`, `TableHead`, `TableCell`               | `<table>`, `<th>`, `<td>`                             |
| Nút chỉ có biểu tượng (sửa, xóa)                    | `IconButton` (có chú thích, luôn có `aria-label`)                          | `Button` icon không nhãn                              |
| Nút thêm dòng/mục cuối danh sách                    | `DashedAddButton`                                                          | `<button>` nét đứt tự viết                            |
| Trạng thái, số đếm, nhãn nhỏ                        | `Badge`                                                                    | `<span className="rounded bg-muted ...">`             |
| Danh sách rỗng                                      | `Empty` (`EmptyMedia`, `EmptyTitle`, `EmptyDescription`)                   | một dòng chữ xám                                      |
| Mở/đóng nội dung                                    | `Collapsible` kèm `animate-collapsible-down/up`                            | ẩn/hiện không chuyển động                             |
| Ô tìm kiếm có biểu tượng                            | `InputGroup` + `InputGroupAddon` + `InputGroupInput`                       | `<input type="search">`                               |
| Vùng cuộn có thanh cuộn                             | `ScrollArea`                                                               | `overflow-y-auto` rời                                 |
| Đường phân cách                                     | `Separator`                                                                | `<div className="border-t">`                          |
| Khung chờ                                           | `Skeleton`                                                                 | `div` có `animate-pulse`                              |
| Ô nhập, chọn, tích, công tắc, nhãn                  | `Input`, `PickerSelect`, `SearchableSelect`, `Checkbox`, `Switch`, `Label` | thẻ gốc                                               |
| Chuyển tab trong trang                              | `Tabs`, `TabsList variant="line"`, `TabsTrigger`, `TabsContent`            | `<button role="tab">` tự viết                         |
| Chọn một trong vài lựa chọn dạng ô vuông (chọn màu) | `ToggleGroup type="single"` + `ToggleGroupItem`                            | `<button role="radio">` tự viết                       |
| Khung thông tin chỉ đọc (trạng thái, liên kết)      | `Card` + `CardContent`                                                     | `<section className="border ...">`                    |

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

| Trạng thái                  | Hiển thị                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| Đang tải lần đầu            | `Skeleton` cùng kích thước nội dung thật                                                 |
| Lỗi tải                     | `ErrorState` đúng `variant` (xem `.rules`)                                               |
| Rỗng thật (chưa có dữ liệu) | `Empty` có tiêu đề, một câu mô tả và nút "Thêm ..." nếu người dùng có quyền              |
| Rỗng do bộ lọc              | "Không có kết quả phù hợp" và nút **"Xóa bộ lọc"**; không hiện nút tạo mới như rỗng thật |

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

## 24. Trạng thái chờ của form và lỗi từ BE (bắt buộc)

Bấm gửi form mà **cả trang chuyển thành skeleton**, form mất dữ liệu đã nhập, hoặc lỗi BE không thấy đâu là lỗi nặng. Đã từng xảy ra ở trang đăng nhập; mọi form phải theo các điều sau.

**Chờ chỉ ở nút, không ở trang**

- Trạng thái chờ khi gửi form do **chính form giữ** (`isSubmitting` của React Hook Form, `isPending` của mutation) và chỉ hiện ở nút gửi (mục 12). Không bật cờ loading dùng chung (Zustand, context) khi gửi form.
- Cờ `isLoading` của `auth.store` chỉ có nghĩa **"đang khôi phục phiên lần đầu"**. Không gọi `setLoading(true)` trong `login`, `logout` hay bất kỳ mutation nào.
- `Skeleton` cả trang chỉ dành cho tải dữ liệu lần đầu (mục 16). Không dựng điều kiện kiểu `if (isLoading) return <Skeleton />` bao quanh form vì cờ đó có thể bật lúc đang gửi.
- **Không gỡ form khỏi cây giao diện** khi đang gửi hay sau khi lỗi: gỡ form là mất giá trị đã nhập, lỗi từng ô và khung lỗi (mục 17).
- Gửi thành công rồi chuyển trang: giữ nút ở trạng thái chờ ("Đang đăng nhập...") cho tới khi trang đổi, không để nút mở khóa lại trong lúc chuyển.

**Lỗi BE phải thấy được ngay tại form**

- Có `message` từ BE (đã là tiếng Việt) thì hiện **nguyên văn** trong `Alert` đầu form (mục 15): "Email hoặc mật khẩu không đúng." Không thay bằng câu chung chung. Dùng `getFormErrorMessage`.
- BE trả lỗi theo ô (`errors` của 400): gắn vào **đúng ô** bằng `applyServerFieldErrors` (`features/auth/auth.utils.ts`, dùng `getFieldErrors`) rồi focus ô đầu tiên. Khi đã gắn được vào ô thì không cần `Alert` chung.
- Lỗi mạng hoặc 5xx: `Alert` nói chuyện gì xảy ra và làm gì tiếp ("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại."); không lộ mã lỗi.
- Endpoint `/auth/*` trả 401 là lỗi nghiệp vụ (sai mật khẩu), **không** được chuyển trang hay làm mới token; interceptor đã bỏ qua nhóm này, đừng sửa lại.
- Có lỗi thì mở khóa nút ngay, giữ nguyên dữ liệu để người dùng sửa và thử lại (mục 12, 17).

**Kiểm tra trước khi giao form** (làm bằng tay ở 440×956)

1. Bấm gửi khi để trống: mỗi ô có lỗi riêng, focus vào ô lỗi đầu tiên.
2. Gửi dữ liệu BE từ chối: thấy đúng thông báo của BE, form không nháy, giá trị còn nguyên.
3. Tắt BE rồi gửi: có thông báo lỗi kết nối ngay trong form.
4. Nhấn Enter hai lần liên tiếp: chỉ gửi một yêu cầu.
5. Trong lúc chờ chỉ nút gửi đổi trạng thái; phần còn lại của trang giữ nguyên.

Mockup ASCII đủ các trạng thái của màn đăng nhập: `docs/MOCKUP-AUTH.md`.

## 25. Bố cục app trên điện thoại (kiểu MacroFactor)

App dùng chủ yếu trên iPhone nên giao diện phải giống app, không giống trang web thu nhỏ.

- **Tiêu đề trang lớn:** mọi trang dùng `PageHeader` (chữ hoa rộng đậm `font-brand` Unbounded 24px như tiêu đề các tab chính của MacroFactor, bên trái, ảnh đại diện bên phải, dòng nhỏ phía trên nếu cần). Không tự viết `h1` riêng. Header web (`AppHeader`) và sidebar chỉ hiện từ `md` trở lên.
- **Thanh tab dưới:** 4 tab + nút tròn "+" ở giữa (thêm món ở mọi trang): Dashboard, Food Log, +, Strategy, More (đúng nhãn MacroFactor). Icon 22px, nhãn 11px, nút "+" 44px. Hồ sơ, thực phẩm của tôi, giao diện và đăng xuất nằm trong trang **More** (`/more`); header trang trên điện thoại không còn ảnh đại diện (desktop vẫn có `AvatarMenu`). Trạng thái mở bảng Thêm món nằm ở `stores/ui.store.ts`.
- **Danh sách thay cho form và bảng:** nhóm dòng dùng `ListSection` + `ListRow` (nhãn trái, giá trị muted phải, mũi tên, vùng chạm ≥ 48px, vạch mảnh giữa dòng, không viền ngoài, nền thẻ bo `2xl` trên nền xám nhạt). Không dựng bảng `Table` cho dữ liệu trên điện thoại; mỗi bản ghi là một dòng có dòng phụ.
- **Sửa một giá trị = bảng trượt lên:** chạm dòng thì mở `PickerSheet` (đáy màn hình; desktop là hộp thoại giữa) chứa ô nhập hoặc `OptionList` (chọn một, dòng chọn có dấu ✓). Nút **Xong** đóng bảng. Không dùng ô xổ xuống `Select` trong form hồ sơ.
- **Nút lưu dính đáy, chỉ hiện khi có thay đổi** (`formState.isDirty`), nằm ngay trên thanh tab. Giá trị còn thiếu hiện chữ cam đậm ("Chưa đặt") để mắt tìm ra; lỗi từ BE theo mục 24.
- **Số liệu chính là tâm điểm:** số lớn (40px đậm, `tabular-nums`) kèm thanh tiến độ và ba macro đúng màu `--mf-*`; vượt target không đổi sang đỏ (BR-18).
- **Không nút nổi riêng từng trang** trên điện thoại: hành động thêm chính đã có ở nút + giữa thanh tab. Desktop hiện nút "Thêm món" ở tiêu đề trang.

## 26. Quy chuẩn hình ảnh theo app MacroFactor (đối chiếu ảnh trong `Docs/MacroFactor_UI/UI`)

Màn nào làm theo ảnh MacroFactor thì dùng đúng các giá trị dưới đây, không tự đoán lại từng lần.

**Bo góc (đã chỉnh toàn cục, `--radius: 0.5rem` ở `theme.css`)**

- Ô, thẻ, hàng danh sách: `rounded-xl` (≈11px) hoặc `rounded-2xl` (≈14px) là mức lớn nhất. Ô lưới nhỏ (cột macro, ô thói quen): 3–5px. Nút chữ nhật, nút "Xong", ô nhập: `rounded-lg` (8px). Khung chọn cột/ngày: `rounded-md`.
- Chỉ bo tròn hết (`rounded-full`) cho: công tắc, nút chọn dạng viên thuốc (Đã ăn/Còn lại), nút icon tròn, nút "+" giữa thanh tab, bong bóng chat. Không bo `3xl` cho thẻ.

**Màu**

- Ba bậc nền đo từ MacroFactor: nền trang/dải lõm `--background` `#141414` (không đen tuyền), thẻ/sheet/dải nhấn `bg-card` `#1f1f1f`, ô nhập/chip/nút xám/viền `bg-secondary` `#383838`; thẻ nằm trong dải xám thì dùng lại `bg-background`. Màu thanh trạng thái iOS và `manifest` cùng `#141414`. Xanh lá nhấn `--mf-green` `#62ba88`, xanh dương `--mf-blue` `#4e8dff`. Chữ phụ `text-muted-foreground`; không dùng viền sáng để tách khối, dùng chênh bậc nền.
- Dữ liệu dinh dưỡng chỉ dùng bộ `--mf-tile-*`: kcal xanh dương `#5c8def`, protein cam san hô `#ff8261`, fat vàng `#ffd35a`, carb xanh lá `#5dba85`; vi chất tím (`#a78bfa`), khoáng chất hồng (`#fb7185`). Chữ trong ô màu là chữ đen.
- Công tắc: nền trắng khi bật (`#fff`), xám `zinc-600` khi tắt, núm luôn đen; kích thước bảng chọn 56×32 (núm 28), thẻ nhỏ 40×24 (núm 20).

**Chữ**

- Tiêu đề trang Dashboard: chữ hoa đậm giãn (`PageHeader display`). Tiêu đề nhóm (Phân tích, Thói quen…): 20px đậm. Tiêu đề thanh trên của trang con và bảng trượt: 18–20px `font-medium` (không đậm hơn). Số liệu chính trên ô: 20–24px thường; nhãn phụ 16px xám. Số lớn ở vòng kcal 36px.
- Tên thẻ nhỏ (thẻ "Tiêu điểm chính"): 14px `font-semibold`, tối đa hai dòng.

**Thành phần**

- **Ô số liệu (`MetricTile`):** tên + kỳ ở trên, hình nhỏ ở giữa (đẩy xuống đáy ô), đường kẻ mảnh, giá trị + đơn vị, chevron xám. Chưa có trang chi tiết thì chevron mờ và không bấm được.
- **Hình nhỏ trên ô (`TileVisuals`):** mọi biểu đồ tự co giãn theo min–max của chính dữ liệu (không bắt đầu từ 0), chuỗi phẳng nằm giữa. `Sparkline` = đường mảnh mượt, hai đầu vòng tròn rỗng, `raw` là chấm mờ (cân thô quanh đường trend); `MiniFlux` (Expenditure) = dải mờ + hai ô vuông rỗng; `MiniBalance` (Energy Balance) = cột kcal đã ăn trên cùng thang với đường mốc chấm, chưa log ngày nào thì chỉ có đường mốc ở giữa; `HabitGrid` ô trống `bg-foreground/[0.08]`, gap-1; `GoalBar` mảnh `h-3` bo tròn, kỳ "Last N Days" tính từ lần cân đầu. Biểu đồ tự vẽ khi xuất hiện bằng `animate-chart-draw` / `animate-chart-rise` / `animate-chart-grow` (`index.css`, `motion-safe:`).
- **Ngày và số tiếng Anh:** ngày hiển thị dùng `formatDate` ("Oct 20, 2026", `lib/date.ts`) hoặc `toLocaleDateString('en-US', …)`; không gọi `toLocale*`/`Intl` không truyền locale (máy tiếng Việt sẽ ra "Tháng 10"). Lịch (`ui/calendar.tsx`) mặc định `en-US`.
- **Luồng thêm món (Add Flow, như MacroFactor):** bấm dòng kết quả hoặc nút "+" (Multi-Add) đều mở **Food Detail** dạng slide, không thêm thẳng; "Add" trong detail → về danh sách tìm (giữ từ khoá) và món vào plate, viên thuốc plate ở header (icon món + "+N", bấm được, nảy 300ms khi thêm) cùng tổng macro cộng theo plate. Bấm viên thuốc/mũi tên (hoặc kéo tay nắm) mở **Your Plate**: mỗi dòng có ô lượng — bấm thì thành ô nhập viền trắng, bàn phím số riêng trượt lên với chip đơn vị (g, oz, các khẩu phần của món) + Log Foods + Done (Done cập nhật dòng và tổng; món không biết khối lượng như Quick Add thì không sửa lượng); vuốt dòng sang trái để xoá (kéo ngắn lộ nút Delete, kéo dài xoá luôn). Plate giữ nguyên khi đổi tab hoặc đóng bảng. Log Foods ghi cả plate rồi về trang Food Log của đúng ngày, tự cuộn tới giờ vừa ghi (món chèn vào có hoạt ảnh).
- **Full Body (`/full-body`, `/full-body/all`, `/full-body/compare`, `features/full-body`):** dữ liệu từ `GET /body-metrics/full-body/history` (`useFullBodyHistory`, mới nhất trước); tên/thứ tự số đo ở `features/shortcuts/full-body.config.ts` (`TAPE_GROUPS`), dùng chung cho bảng nhập, All Metrics, Compare. Ba trang có dải đầu `FullBodyHeader` (nền `bg-card` kín bề ngang, dính trên, chứa tiêu đề + nút / tab; nội dung bên dưới trên nền tối), biểu tượng đặc như MF (`EventIcon` lịch 28px, `ArticleIcon` / `CompareIcon` trên nút viên, thùng rác đặc trong bảng nhập); hàng trong thẻ cao 48px, đường kẻ thụt từ trái 16px chạy tới mép phải; Compare không hiện thay đổi khi hai ngày bằng nhau. Mọi `SheetFrame` có tay nắm trên đầu (điện thoại) và ngày ▾ dùng tam giác đặc. Trang danh sách: ‹ "Full Body" +, hai nút viên View All Metrics / Compare All Metrics (cỡ chữ `min(15px,3.6vw)` để không xuống dòng ở 375px; mờ khi chưa đủ 1 / 2 ngày), nhóm theo tháng ("October 2026"), hàng "N metrics" + "Fri, Oct 16" — hàng mới hiện dần so le 40ms, hàng bị xoá co chiều cao 300ms rồi mới gỡ. Bảng nhập = `FullBodySheet` (cũng là shortcut Metrics): ✕, ngày ▾ (`SheetFrame onTitleClick` → `SelectDateSheet` của trang Weight), "Full Body", thùng rác chỉ khi ngày đã có số đo (hỏi lại `ConfirmDialog`); nhãn đậm trên ô cao 56px, đơn vị bên phải, ô đang nhập viền trắng 2px; Body Fat có nút Reference (`BodyFatReferenceSheet`); các nhóm hiện dần so le 60ms; Save + bàn phím số dính đáy, vùng đáy `onMouseDown preventDefault` để bấm Save không làm ô mất focus (bàn phím thu lại làm nút trượt khỏi ngón tay). All Metrics: tab ngày cũ → mới (`MetricDateTabs`, vạch trắng trượt 300ms, tab chọn cuộn vào giữa), vuốt ngang (`SwipeArea`, ≥ 50px) đổi ngày, nội dung hiện dần + trượt theo hướng; chỉ hiện hàng có giá trị. Compare: "Comparing [A] to [B]" (pill trắng = ngày mà tab / vuốt / lịch đang đổi), mỗi nhóm có hai cột ngày; hàng = tên, thay đổi ↗/↘ đếm lên 500ms (xanh `mf-tile-carbs` khi đúng hướng mục tiêu: % mỡ giảm luôn tốt, số đo/cân giảm tốt khi `WeightLoss`, tăng tốt khi `WeightGain`, `Maintenance` trung tính; đỏ `destructive` khi ngược), giá trị A, B; chỉ có ở một ngày thì "—" và không có thay đổi. Lịch của hai trang này chỉ bật ngày có số đo (`isDateEnabled`).
- **Trang Habits (`/habits/weigh-in`, `/habits/food-logging`, `features/habits`):** một `HabitsPage` dùng chung cho hai thói quen, tile Habits ở Dashboard trỏ vào đây. Đầu trang "Today -- kg/kcal" + "Streak N day(s)" (số ít/số nhiều; hôm nay chưa có thì streak tính tới hôm qua); lịch tháng 6×7 (Mon → Sun, nhãn thứ nằm dưới lưới) mỗi ngày một vòng tròn mảnh, ngày đã thực hiện vòng xanh `--mf-tile-carbs` dày 2px (fade + phóng nhẹ, so le 12ms), hôm nay có chấm dưới số, ngày tương lai và ngoài tháng mờ, không bấm được; hàng ‹ › (trượt trái/phải 300ms) + ô chọn tháng/năm tiếng Anh; chú giải Tracked / Untracked không đóng khung; heatmap năm theo cột tuần (ô 10px, nhãn tháng ở cột chứa mùng 1, cuộn ngang tới tháng hiện tại, bọc `w-0 min-w-full` để khối rộng không đẩy vỡ bố cục trang). Bấm ngày: Weigh-In mở bảng "Scale Weight" (tiêu đề là ngày, Weight + Body Fat, Save, thùng rác khi có bản ghi, keypad riêng); Food Logging mở Food Log đúng ngày đó (`ui.store.foodLogDate`).
- **Thanh nhập lượng trên cảm ứng (Food Detail, Your Plate):** chạm chip (⇅, g, oz, khẩu phần, P/F/C), nút Log Foods/Add/Done hoặc phím KHÔNG được làm đóng thanh: iOS Safari không giữ focus bằng `preventDefault` ở pointerdown nên chặn thêm ở `mousedown` (cả lưới `NumericKeypad` và cả thanh `QuantityBar` trừ ô input), kèm cờ `pressing` giữ chip/keypad mở khi blur do chạm trong thanh. Chỉ đóng khi chạm ra ngoài thanh (listener pointerdown ở document), vuốt cuộn nội dung hoặc Done. `useCoarsePointer` quyết định đồng bộ (media query + `ontouchstart`/`maxTouchPoints`) và lần chạm đầu tiên bật cờ trước khi ô nhận focus nên `inputMode="none"` áp từ đầu, không bật bàn phím hệ thống. Ô số tự kiểm soát chấp nhận "," như "." (`normalizeDecimal`, bàn phím iOS tiếng Việt). Phản hồi chạm ≤100ms (`active:scale-95`), vùng chạm ≥44px, nút Log Foods/Add thu lại bằng max-width + mờ 200ms khi keypad mở và chiều cao thanh không nhảy khi đổi ⇅.
- **Ghi chú của ngày (Notes, `NoteSheet` + `NotesSection`):** sheet "New Note" / "Edit Note" cao gần hết màn hình: X trái, tiêu đề giữa, bên phải nút 🎨 và nút ✓ lưu. Bảng bảy chấm (đỏ, xanh dương, xanh lá, vàng, tím, cam, xám = không màu; token màu shortcut) là `Popover` neo ngay dưới nút 🎨 (căn phải, `collisionPadding` 16, trượt + mờ 200ms), chấm đang chọn có viền + dấu ✓, chọn xong tự đóng; chấm nhỏ trên nút 🎨 báo màu hiện tại. ✓ xám mờ khi chưa có nội dung (nội dung bắt buộc ≤ 1000, tên tuỳ chọn ≤ 60) hoặc ghi chú đang sửa chưa đổi gì, nền trắng khi lưu được. X/vuốt/Back khi đã gõ dở hỏi "Discard changes?". Ngày "Tue, Oct 20" (en-US) + giờ `HH:mm` bấm để đổi; tên autofocus, Enter nhảy xuống nội dung, nội dung tự giãn; sheet nằm trên bàn phím nhờ `DialogContent` theo visualViewport. Thẻ ghi chú tối giản như MF: nền card bo 12px, không viền màu; dòng đậm là tên (không có tên thì chính nội dung), dòng xám là nội dung tối đa 2 dòng, góc phải dưới giờ nhỏ xám + chấm màu 8px (Gray = chấm xám); chạm để sửa, vuốt trái để xoá (`SwipeToDelete`, dùng chung với Your Plate); đếm "n / 5" cạnh nút +, đủ năm thì + mờ/khoá kèm dòng báo lý do. Thẻ mới chèn vào và thẻ xoá thu gọn 300ms. BE: POST/PUT gửi `{text, name, color, notedAt}` (`color` PascalCase, Gray = không màu), đọc `notes[]` + `notesMaxPerDay`; thứ 6 trong ngày → 409 "Up to 5 notes per day." hiện thẳng ở sheet.
- **Nhập số trên cảm ứng:** ô cân/body fat/số đo (`LogWeightDialog`, `FullBodySheet`) dùng `NumericKeypad` dùng chung (`components/shared`), `inputMode="none"` trên màn cảm ứng (`useCoarsePointer`), dấu thập phân luôn ".", tối đa 1 số lẻ; máy tính dùng bàn phím thường. Nút Delete chỉ hiện khi ngày đang chọn đã có bản ghi.
- **Carousel (`DashboardCarousel`):** một tấm nền bo chung cho cả ba trang, nội dung trượt bên trong; ba trang **cao bằng nhau**, tiêu đề ở trên và công tắc ở dưới, khoảng dư chia vào giữa. Các chấm báo vị trí nằm ngoài tấm nền.
- **Bảng trượt từ đáy (`SheetFrame`):** nút X trái, tiêu đề (+ phụ đề xám) giữa, đường kẻ dưới đầu, nội dung cuộn, nút "Xong" nền trắng chữ đen `rounded-lg` cao 48px dính đáy. Bảng chỉ chọn một thì chọn xong **chờ ~180ms** (thấy vòng radio đổi) rồi **trượt xuống** (không tắt ngay), không có "Xong". Mở và đóng đều có hoạt ảnh trượt 300ms: bảng phải **còn mount sau khi đóng** — dùng `useSheet` (`hooks/use-sheet.ts`: `value` giữ nguyên, chỉ `open` về false, `key={sheet.id}` để mở lần sau mount mới), cấm `{open && <Sheet open />}` hoặc cho nội dung về `null` khi đóng vì hiệu ứng trượt xuống sẽ không chạy và nội dung biến mất giữa chừng.
- **Màn tuỳ chỉnh:** phần đầu (tiêu đề + Tiêu điểm chính) nằm trong dải xám; thẻ nhỏ 192px cuộn ngang, mũi tên đổi chỗ nằm dưới thẻ và **ẩn** (không làm mờ) ở đầu/cuối; đổi chỗ có hoạt ảnh trượt ~320ms, tắt khi `prefers-reduced-motion`. Mỗi nhóm có mũi tên lên/xuống ở góc, tay cầm "=" để kéo đổi chỗ (có phím mũi tên), nút "Thêm hoặc bớt…" xám bo `lg`; cuối trang có "Đặt lại mặc định" chữ đỏ.
- **Thanh tab dưới:** nền đặc (không mờ), cao 60px (+ vùng an toàn), icon và nhãn cách viền trên 12px (không dính viền), icon 24px, nhãn 12px, tab đang chọn tô đặc và chữ trắng đậm; nút "+" trắng 64px, không bóng.
- **Màn nhập liệu nhiều bước (onboarding):** thẻ chọn viền 2px, biểu tượng đặc kiểu MacroFactor (nền khoét), nút dưới đáy bo tròn; hoạt ảnh chat có nhịp nghỉ → "đang gõ" → hiện chữ theo độ dài câu.

**Hoạt ảnh**: luôn `motion-safe:`; chuyển trang/đổi chỗ 300–400ms; không bật chuyển động ở nơi người dùng đang kéo/vuốt.

## 27. Trang chi tiết Dashboard, Food Log và trang cài đặt (quy tắc rút ra khi làm theo MacroFactor)

**Cỡ chữ (không to quá)**

- Trang cài đặt và trang chọn: tiêu đề nhóm **20px đậm** (`text-xl font-bold`), tên dòng/lựa chọn **16px** (`text-base`), mô tả và giá trị phụ **14px** muted (`text-sm`), nút "Edit" 14px. Không dùng `text-lg`/`text-2xl` cho dòng cài đặt.
- Ô món trên timeline: tên 14–16px theo mật độ, dòng kcal/macro/khẩu phần 13px. Số lớn đầu trang chi tiết 36px, nhãn phụ 16px.

**Tràn ngang (lỗi hay gặp)**

- `main` của layout là flex item nên tự nở theo nội dung `nowrap`/`truncate`/cuộn ngang bên trong (trang rộng hơn màn hình, thẻ bị cắt bên phải). Khối có chữ không xuống dòng hoặc trượt ngang (carousel, preview, header dính) phải có `[contain:inline-size]`; luôn kiểm `document.documentElement.scrollWidth === clientWidth` ở 440px.

**Header dính toàn chiều ngang (Food Log, Timeline Food Tiles)**

- `sticky top-0 z-30 bg-card` và trên điện thoại kéo lên sát đỉnh bằng `max-md:-mx-4 max-md:-mt-[calc(env(safe-area-inset-top)+1.25rem)] max-md:pt-[calc(env(safe-area-inset-top)+0.75rem)]` (huỷ padding của `main`, vùng tai thỏ cùng màu header).
- Header **không bao giờ co lại khi cuộn**. Chỉ khi một lớp phủ khác (lịch cuộn) mở thì thanh tuần và macro mới thu bằng `grid-rows-[1fr] ↔ [0fr]` + opacity 300ms.

**Trang chi tiết (Expenditure, Weight Trend, Energy Balance, Goal Progress)**

- Dùng chung `components/DetailPage`: `RangeBar` (ô trắng trượt 300ms), `StatBlock`, `TutorialCard` (nhiều thẻ, **chỉ nội dung trượt, hàng nút đứng yên**), `UnderlineTabs` (vạch trắng trượt), `MetricRow`, `SourceRow`, icon `ExpandChartIcon`/`CollapseChartIcon`/`WaitingIcon`. Không viết lại từng trang.
- Màu theo tab (Scale xanh lá ↔ Trend tím): đặt biến CSS ở thẻ gốc của trang và mọi thành phần dùng `var(--…)` kèm `transition-colors`/`transition-[fill] duration-500` để đổi màu dần.
- Dữ liệu tính ở FE khi BE đã trả sẵn nguyên liệu (trung bình, chênh lệch N ngày, dự báo); BE chỉ thêm API khi thiếu nguyên liệu.

**Cài đặt Food Log**

- Lưu trên server (`GET/PUT /food-logs/settings`, gửi cả object); FE trộn với mặc định để trường mới chưa có vẫn chạy, cập nhật ngay trên màn hình rồi gửi, lỗi thì hoàn lại. Tên trường và giá trị enum dùng đúng chuỗi của BE, cờ bool trong bảng chọn dùng giá trị `'true'`/`'false'`.
- Một dòng cài đặt = `SettingRow` (tên + giá trị hiện tại, nút "Edit" mở `ChoiceSheet` chọn một và đóng ngay, hoặc `href` mở trang con có mũi tên). Trang con chọn thẳng trên trang dùng `OptionList` (radio) và `CheckList` (ô tick).
- Mỗi cài đặt phải **có tác dụng thật** trên màn hình dùng nó, hoặc ghi rõ là chỉ lưu (Premove, Optimization). Cái nào ảnh hưởng hiển thị phải xem được trong preview ngay trên trang cài đặt.
- Calendar Week Banner: `Show` và `ShowAndPin` cùng nghĩa là luôn hiện thanh tuần (giữ cả hai giá trị enum vì BE đã lưu), `Hide` ẩn thanh tuần.
- Hour Range: thanh trượt hai tay cầm, nhãn "7 AM" trong bóng trắng trên tay cầm, nút Save trắng; Calendar Week Banner có dải tuần minh hoạ; Timeline Food Tiles có preview ghim trên cùng.

**Lịch và timeline Food Log**

- Lịch cuộn tuần: mỗi tháng một mảng nền (tháng chẵn `bg-card`, lẻ `bg-background`), góc bo ở chỗ đổi tháng, nhãn tháng trên ngày mùng 1; tuần bắt đầu Thứ Hai (Energy Balance bắt đầu Chủ nhật như ảnh).
- Vòng kcal trên viên ngày (`DayPill`, dùng chung cho thanh tuần và lịch): SVG `rect` phủ đúng viền 2px, `rx` = nửa bề rộng + `pathLength=100` nên nét bắt đầu ở giữa cạnh trên và chạy theo chiều kim đồng hồ dọc viền; dài = kcal đã ăn / mục tiêu kcal của ngày (chặn 100%), màu `stroke-mf-tile-calories`. Không vẽ cho ngày tương lai, ngày chưa log hoặc chưa có mục tiêu. Mount thì chạy từ 0 (`animate-ring-fill` với `--ring-start: 100`), đổi số (log món → invalidate `foodLogKeys.all`) thì `transition-[stroke-dashoffset] 700ms`; cả hai tắt khi `prefers-reduced-motion`. Số liệu từ `GET /food-logs/week` (`useWeekDays`: `useQueries` theo Thứ Hai, gộp thành map ngày → `WeekDay`); chỉ tải tuần đang thấy (thanh tuần / lịch báo `onWeeksView`), trang giữ danh sách tuần đã thấy để vòng không mất khi cuộn lại.
- Thanh tuần (`WeekStrip`) là khung cuộn ngang gốc (quán tính trên iOS) chứa ±26 tuần, `snap-x snap-mandatory`: Weekly = `snap-start snap-always` mỗi tuần, Daily = `snap-start` mỗi ô ngày (lưới 7 cột nên khoảng cách đều qua ranh giới tuần). Vuốt chỉ **xem** tuần khác, không đổi ngày đang chọn (như MF, tiêu đề vẫn "Today"); chuột kéo ≥ 40px thì cuộn mượt một bước. Ngày chọn đổi mà viên của nó khuất thì cuộn mượt tới tuần đó (lần đầu nhảy thẳng). Khi viên hôm nay ra khỏi khung: nút trắng (`bg-foreground text-background`, cỡ viên ngày) có ‹ / › đè lên cột đầu / cuối phía hôm nay (hiện fade + zoom 200ms), bấm thì cuộn mượt về tuần hôm nay. Đổi ngày thì chữ của tóm tắt macro hiện dần 300ms (thanh chạy bằng transition riêng), và trong lúc tải ngày mới lấy tổng từ dữ liệu tuần để số không nháy về 0.
- Hàng macro dưới thanh tuần: 4 cột bằng nhau `gap-2`, mỗi cột là `@container`, chữ `text-[min(1rem,15cqi)]` + icon `size-[1em]`, số dạng "2861/2880" (không dấu cách quanh "/") nên giá trị 4 chữ số luôn vừa cột ở 320px. Dưới 360px tiêu đề ngày xuống `text-2xl` để hàng tiêu đề + 3 nút tròn không đẩy trang rộng hơn màn hình.
- Tab AI của bảng Thêm món (`AiPanel`): Snap = camera sau toàn khung (chụp hoặc tải ảnh, tự sang Describe), Describe = tối đa 3 ảnh (dòng thẻ viền có nút xoá) + mô tả 500 ký tự + nút Analyze; camera chỉ bật khi tab AI mở và đang ở Snap. Analyze chạy hai pha (`useAiPlate`): pha 1 `POST /food-logs/ai/analyze` (form mờ, nút thành spinner; lỗi hiện trên form, nút "Try again", không giả kết quả), pha 2 `POST /food-logs/ai/resolve-ingredient` song song từng nguyên liệu trong `AiPlateView`: dòng skeleton "Searching for…" (animate-pulse), khớp xong thì điền dần; món tự gom tổng khi mọi nguyên liệu xong, rồi hiện Nutrition (Plate | Day) và Log Foods đưa vào plate (món không có `foodItemId` log bằng Quick Add). BE chưa có nên dev có nút "Preview sample" (`ai-sample.ts`, xoá khi BE có API).
- Tab Library của bảng Thêm món (`LibraryPanel`): công tắc ba ngăn Recipes | Foods | ♥ (`SlidingSwitch`, ô trắng trượt 300ms) + nút tròn bên phải (+ ở Recipes/Foods, sắp xếp ở ♥); Foods = `GET /foods?scope=Mine`, ♥ = `useFavorites`, cả hai vẽ bằng `FoodTile` theo Logger Food Tiles; Recipes = `GET /library?scope=Recipes` (số trên 1 khẩu phần, lọc tên ở server có debounce; log recipe gửi `recipeId` + số khẩu phần, không gửi `foodItemId`/`foodServingId`), "+" ở Recipes mở trang tạo công thức `/recipes/new` (`RecipeCreatePage`, `POST /recipes`); ô lọc theo tên nằm ở thanh đáy `AddFoodDialog` thay ô tìm, chữ gợi ý "Filter recipes/foods/favorites".
- Màn Food Detail (`components/FoodLogPage/FoodDetail`, mở từ tab Search / Library, chiếm hết khung bảng Thêm món, ẩn hàng tab và thanh đáy của `AddFoodDialog`, giữ thanh calo trên cùng): đầu trang (back, tên cắt "…", brand), hàng calo 40px + Protein/Fat/Carbs 24px kèm pill % calo, hai nút vuông To Custom (ẩn nếu món `isMine`) / Favorite (tim đỏ khi đã lưu), Impact on Targets (4 vòng % so mục tiêu ngày), sáu nhóm chất vẽ từ `NUTRIENT_GROUPS` bằng `NutrientCard` (thiếu mục tiêu thì "No Target", không thanh), thanh đáy dính: ô số lượng + khẩu phần (bấm mở `ChoiceSheet`), chip đổi đơn vị khi focus (swap, g, oz, khẩu phần; oz = 28.3495 g), nút Log Foods (thêm vào plate rồi ghi cả plate) và Add.
- Dữ liệu Food Detail: lượng mỗi chất tính tại chỗ = `FoodDetail.nutrientsPer100g[key]` × gram đang chọn / 100 (bốn macro lấy từ `nutrition`), nên đổi số lượng/đơn vị cập nhật ngay; mục tiêu (target, thiếu thì ceiling/floor) lấy một lần cho mỗi món từ `GET /foods/{id}/nutrients` (`useFoodNutrients`), chờ thì skeleton, lỗi thì "No Target". Chất `null` hiện 0 với thanh rỗng.
- Thanh tìm món nổi dưới (`DashboardSearchBar`): trang Food Log **luôn hiện**; chỉ Dashboard truyền `autoHide` để ẩn khi cuộn xuống, hiện khi cuộn lên (mặc định `false`, không nhân đôi component).
- Tiêu đề ngày: Today / Yesterday / Tomorrow, ngày khác "Thu, Oct 15" (hiện in hoa bằng CSS). Timeline: viên thuốc giờ nằm trên đường dọc, nút + cạnh giờ (hoặc nhấn giữ giờ), món hiện bằng `FoodTile`; ba mật độ Comfort / Standard / Compact và điểm nhấn Edit / Energy / None theo cài đặt.
- Thanh thông tin bảng Thêm món (`AddFoodDialog`): X, ô giờ chỉ một dòng ("12:00", bấm mở `DateTimeSheet`), banner tiến độ (chất bật trong Logger Banner xếp 2 hàng theo cột: kcal, P / F, C; mỗi chất có số + thanh mảnh, một chất thì số căn giữa + thanh, không viền), viên thuốc plate (icon dĩa mờ khi trống, "+N" khi có món) kèm nút tròn mũi tên: ↓ mở bảng **Your Plate**, ↑ đóng (mũi tên xoay 300ms). Khi Your Plate mở, hàng tab và nội dung tab bị ẩn bằng `hidden` (không gỡ, giữ trạng thái camera/ô tìm/món đang xem).
- Your Plate (`FoodLogPage/PlatePanel`): tiêu đề, danh sách món chờ ghi (nút X xoá từng món) hoặc thẻ xanh "Your plate is empty" + nút Add (quay về tab); mục Nutrition với công tắc Plate | Day, 4 thẻ Calories/Protein/Fat/Carbs (số, thanh `NutrientBar` có vạch mục tiêu), "Show all nutrients" (chỉ chế độ Plate) mở đủ nhóm chất từ `PlateItem.nutrients`; nút Log Foods trắng nổi góc phải dưới. Mục tiêu vi chất là mặc định RDA của `buildOverviewValues`.
- `DateTimeSheet` ("Select Date and Time"): hai bánh xe ngày (Yesterday/Today/Tomorrow, ngày khác "Fri, Oct 16", ±45 ngày) + giờ (00:00–23:00) dùng `components/shared/WheelPicker`; nút Select (chỉ đổi ngày giờ ghi), Log to Date and Time (đổi rồi ghi plate, cần có món), Cancel. Giữ phút gốc nếu giờ không đổi.
- Timeline có món (`DayTimeline`): giờ chỉ có một món thì món đứng riêng, giờ ghi "7:00"/"12:47" nằm trên đường dọc; giờ trống, giờ hiện tại hoặc giờ ≥ 2 món có hàng "+ [giờ]" (kèm tổng 🔥 P F C cạnh đó khi bật Hourly Totals). Căn trái/phải theo cài đặt Alignment (mặc định Left; ảnh MacroFactor là Right).
- Your Plate mở/đóng bằng hoạt ảnh trượt 300ms: plate và tấm sheet tab chia chiều cao bằng `flex-grow` (0 ↔ 1), mở thì sheet thu thành thanh nhỏ ở đáy (tay nắm + hàng tab, bấm tab thì đóng plate), nội dung plate trượt xuống + hiện dần; cả hai luôn mount. Viên thuốc plate: emoji món đầu + "+(n−1)" (một món chỉ emoji), nút tròn ↓ / ↑. Dòng món (`PlateItemRow`): emoji, tên, "kcal P F C • gram", ô số lượng + khẩu phần bên phải, bấm ô mở hàng "Remove from plate". Nutrition: Plate "N unit in plate" / Day "N / mục tiêu unit" (kcal nguyên, gram 1 số lẻ); "Show all nutrients" lấy số đủ chất từ `POST /food-logs/plate/nutrients` (plate hoặc ngày + plate), lỗi/đang tải thì dùng số cộng tại chỗ.
- Icon món ăn: bộ 529 icon (300 gốc CC BY 4.0 foodiconpack.com tô màu lại + 229 icon bổ sung, một phần dựng từ Noto Emoji Apache 2.0; ghi công đầy đủ ở `public/food-icons/v1/ATTRIBUTION_AND_LICENSE.txt`) là file WebP tĩnh ở `public/food-icons/v1/{128,256}/<key>.webp` + `icons.json` (key, name, category). BE chỉ lưu/trả `iconKey`; FE ghép URL bằng `src/lib/food-icons.ts` và vẽ bằng `components/shared/FoodIcon` (ảnh lazy, kích thước cố định; thiếu khoá hoặc ảnh lỗi thì rơi về emoji). Cache `immutable` một năm cho ảnh (next.config.ts) nên chỉ được thêm khoá mới, muốn đổi hình của khoá đã có thì tăng `FOOD_ICON_VERSION` và thư mục; riêng `icons.json` luôn `no-cache` (hỏi lại) để thêm khoá không bị kẹt bản cũ. Bảng Choose Icon có 15 tab (`FOOD_ICON_TABS`: chín tab MacroFactor + Meals, Snacks, Grains and Legumes, Pantry, Supplements, Other) suy từ `category` của `icons.json`; nhóm "Extra Foods" chia tab theo khoá (`EXTRA_TAB` trong `food-icons.ts`). Danh mục chỉ tải khi mở bảng chọn (`useFoodIconCatalog`).
- `ChooseIconSheet` ("Choose Icon"): tab nhóm cuộn ngang + lưới 7 cột, ô đầu là icon mặc định, icon chọn có khung trắng, nút trắng "Select Icon" (bật khi đã đổi) và "Cancel" dính đáy; dùng ở form tạo/sửa món tự tạo (hàng "Icon"). Ghi công CC BY 4.0 ở cuối trang Food Log Settings.
- Sửa món đã log (`EntryEditDialog`, toàn màn hình): thanh tiến độ ngày một hàng (`AddFoodProgress layout="row"`, luôn tính cả ngày), hàng icon tròn + ô giờ (mở `DateTimeSheet timeOnly`, không đổi được ngày) + Done trắng, rồi tấm sheet là `FoodDetailView` ở chế độ `edit`: X thay mũi tên, ba nút nhỏ Remove · Favorite · To Custom (luôn hiện), thanh đáy chỉ còn lượng + Done. Thanh tiến độ hàng ngang đặt ký hiệu trước số (🔥 calo, P / F / C chữ đậm), macro luôn một số lẻ ("10.0"). Dòng log không có món trong thư viện (Quick Add, ước lượng AI, recipe) dùng món ảo (khẩu phần "serving" = một đơn vị `quantity` của dòng) nên vẫn hiện đủ màn sửa; To Custom của dòng đó mở Create Food điền sẵn tên + macro (`?name&calories&protein&carbs&fat`). Hai nút Done lưu cùng một thay đổi (khẩu phần + số lượng lấy qua `edit.onChange`, giờ từ ô giờ; đổi giờ thì bữa suy lại).
- To Custom mở trang Create Food (`/foods/new?from=<foodId>`, `pages/CreateFoodPage` + `components/CreateFoodPage`): tiêu đề dính có đường trắng 2px; General Information (thẻ Food Icon + Edit Icon → `ChooseIconSheet`, Food Name, Brand Name, Barcode Scan/bàn phím), Serving Information (thanh phân đoạn Serving | 100 g | 100 ml; cơ sở Serving có Serving Weight g/oz và Serving Size số lượng + tên), Nutrition Information (US Label | Non-US | Food Detail; thanh trắng "Nutrition … per 1.0 <khẩu phần> (<gam>)", hàng chất với ô số căn phải, "optional", ô chọn đơn vị cho Energy kcal/kJ, Sodium mg/g, Vitamin A/D/E mcg·mg/IU, đường trắng đậm giữa các nhóm) và hai nút dính đáy Create / Create & Add. Số gõ giữ theo cơ sở và đơn vị đang chọn, chỉ quy về "trên 100 g" khi gửi (`create-food.utils.ts`, kiểm tra theo luật BE: kcal ≤ 900, macro ≤ 100, P+C+F ≤ 105); `POST /foods` nhận `nutrients` (mã chất BE) cho mọi chất ngoài 4 macro. Create & Add ghi ngay một khẩu phần theo gam vào nhật ký hôm nay. Chưa làm: thẻ "ineligible for submission" (đóng góp dữ liệu công khai) và quét mã vạch bằng camera.
- Thanh lượng ở đáy Food Detail / sửa món (`QuantityBar`): ô nhập là một nhãn (số bên trái, tên khẩu phần bên phải, đang focus thêm "• N g"), viền trắng 2px khi focus (không cam), không mở bảng chọn khẩu phần; hàng chip phía trên (⇅ · g · oz · các khẩu phần) chỉ hiện khi ô focus. Dòng log không thuộc thư viện (Quick Add / AI) chỉ có chip "serving". Ô món timeline dùng chữ mảnh: tên `font-normal`, dòng macro `font-light`.
- Tab Strategy (`/program`, `pages/ProgramPage` + `components/ProgramPage`) làm lại theo MacroFactor: tiêu đề STRATEGY + nút ba chấm (menu: Change program style, Set TDEE manually, End program); vòng đếm ngược `CheckInDial` (vòng trong trắng = tiến trình tới check-in theo `checkInDueInDays`, vòng ngoài xanh = tiến độ goal, giữa "N DAYS until check-in" hoặc "TODAY"; ẩn khi program Manual) với chú thích Goal / Check-In; mục In Progress gồm thẻ Program (tên + "Oct 17 - Now", biểu đồ 7 cột: viên calo xanh dương + khối P/F/C cao theo phần calo, nhãn M T W T F S S, nút New Program / Edit Program) và thẻ Goal (Goal Weight, Goal Rate kg, Goal Rate %, nút New Goal / Edit Goal); Goal History là các thẻ (khoảng ngày, cân bắt đầu, Gain/Loss/Maintain, đồng hồ cát khi đang chạy, tick khi đạt). Edit Goal (cân mục tiêu qua `PUT /goals/target` + tốc độ) và Edit Program (diet style, protein, calorie floor) là bảng trượt từ đáy với Save trắng + Cancel dính đáy. BE chưa tách mục tiêu theo ngày nên 7 cột bằng nhau. New Program / New Goal cùng mở wizard `/program/new`.
- AI Plate (tab AI của bảng Thêm món): kết quả là thẻ món (icon, tên, "kcal P F C • gram", ô "1 plate" sửa được, Expand/Collapse Ingredients 300ms). Mỗi nguyên liệu có icon, macro, nhãn "Estimated" khi AI ước lượng, ô lượng bấm mở `AmountSheet` (số + chip đơn vị: khẩu phần AI chọn / g) và nút xoá (co lại 300ms); không có dữ liệu thì "No data yet" + nút Search mở `IngredientSearchSheet` để chọn món thay (đúng số gram AI ước lượng). Dầu, nước chấm, gia vị là nguyên liệu bình thường, không có nhóm riêng. Mọi chỉnh sửa (gram, xoá, thay món, số plate) nằm trong `useAiPlate().edits`, tính lại tức thì tổng món, thẻ Nutrition (dùng lại `PlateNutrition`: Plate | Day, Show all nutrients) và tổng ở thanh trên cùng (`previewItems`). Log Foods ghi cả plate đang có + nguyên liệu AI, thành công mới gọi `POST /food-logs/ai/confirm` (lỗi confirm chỉ ghi cảnh báo). Dòng chú thích: "MacroOS AI can make mistakes, so always verify its results." Nguyên liệu khớp món thật (matched, không phải Estimated) có ✦ trước tên; món chỉ có một nguyên liệu hiện thẳng một hàng (tên = món DB đã khớp, macro, ô khẩu phần), không có thẻ món và Expand Ingredients. Ô khẩu phần hiện "{quantity} {unitLabel}" ("3 large"); AmountSheet có chip theo `servings` BE trả kèm kết quả resolve (small/medium/large…; bỏ "g" và "100 g" vì đã có chip g; ước lượng hoặc món tự chọn thì chỉ [đơn vị hiện tại, g]). Đổi giữa hai cỡ thì giữ số lượng, gram và macro đổi theo cỡ (3 large → 3 medium); đổi từ/sang gram thì giữ lượng thật và quy đổi con số. Cỡ đã chọn được dùng để hiển thị và ghi nhật ký. FE gửi nguyên quantity/unit/state của analyze cho `resolve-ingredient` và state cho `confirm`.
- Tab Search khi có từ khoá: kết quả chia nhóm Common / Branded / Open Food Facts (theo `source` và `brand`), giữ nguyên thứ tự BE xếp hạng, mỗi nhóm hiện 5 dòng đầu, phần còn lại sau "See N More / See Less" (mở bằng grid-rows 300ms). Từ khoá khớp (không phân biệt hoa thường và dấu) in đậm trong tên (`HighlightedText`).
- Luồng nhiều bước toàn màn hình (New Program, Check-in, Edit Goal) DÙNG LẠI các màn của wizard thiết lập (onboarding), không làm màn mới: khung `WizardShell`, chọn một `ChoiceStep` / `OptionList` (+ `DIET_OPTIONS`, `TRAINING_OPTIONS`, `PROTEIN_OPTIONS`, `FLOOR_ICON`), phân bổ calo `DistributionStep`, cân nặng đích + tốc độ `GoalTargetStep`, tóm tắt goal `GoalSummaryStep`, Review `ProgramReadyStep`, giới thiệu `FeatureCarouselStep` (nhận `slides`). Layout `(protected)` ẩn header, sidebar, thanh tab khi đường dẫn bắt đầu bằng `/program/new`, `/program/check-in`, `/program/goal/edit`. Hướng trượt giữa các route nằm trong `useFlowStore`. Trước khi thêm màn / component mới phải tìm trong source xem đã có chưa.
- New Program wizard (`/program/new` → `/program/new/[step]`): các bước theo kiểu program (Coached: style, diet, floor, training, distribute, protein, review; Collaborative thêm editor theo ngày; Manual: style, same-different, manual-targets, review), lựa chọn giữ trong `useProgramWizardStore` (không lưu). Số nền từ `GET /programs/setup`, Editor và Review lấy số từ `POST /programs/preview` (Review đổi sang dạng `ProgramReadyStep`). Chỉ Editor theo ngày và Manual là màn riêng: `WeekMacroChart` (dùng chung với thẻ Program ở Strategy; chiều cao là `flex-grow` có transition nên kéo slider đổi mượt), pill chọn ngày, Reset All Days, khoá ngày, slider (`Slider` của ui) protein g/kg và carb:fat; Editor tính gram tại chỗ (`macrosOf`: P = g/kg × cân, C = %carb × calo còn lại / 4, F = phần còn lại / 9) nên không gọi BE khi kéo. Coached không gửi `dayTargets`; Manual bắt buộc bảy ngày; calo Manual chặn trong [sàn thấp, trần BE].
- Edit Goal (`/program/goal/edit` → `/params` → `/review`): thẻ Goal ở Strategy mở route này (không còn bảng trượt). `GoalTargetStep` + `GoalSummaryStep` hiển thị số của `POST /goals/edit-preview` (debounce 300ms, FE không tự tính công thức); Done sửa tại chỗ bằng `PUT /goals/edit`, đổi hướng goal (`requiresNewProgram`) thì sang wizard New Program với goal đã chốt (`useGoalEditStore.pendingGoal`).
- Check-in (`/program/check-in` hub → `/program/check-in/[intro|partial-logging|program-update]`): Strategy hiện nút trắng "CHECK IN" thay vòng đếm ngược khi `checkInDue` (BE tính). Một query `['check-in','session']` (`GET /check-ins/session`) dùng chung hub và module; module đã xong lưu sessionStorage (`useCheckInProgressStore`). Introduction dùng `FeatureCarouselStep`. Partial Logging: `IncompleteDaysChart` (cột cao theo calo, vạch đứt = mục tiêu, chọn = viền trắng + gạch chéo, ngày chưa log là cột rỗng), lưu bằng `PUT /check-ins/incomplete-days` (trả luôn session mới), từ 4 ngày chưa đủ trở lên báo targets giữ nguyên. Program Update: `OrbitAnimation` (SVG + CSS, ≥ 1.6 giây) rồi đề xuất cũ → mới và câu lý do ghép từ `reasonCodes`; không có đề xuất thì chỉ nút Done; Accept / Decline gọi `POST /check-ins/accept|reject`.
- Shortcuts (nút "+" ở thanh tab): mở `ShortcutsSheet` (`SheetFrame` + `headerAction` là biểu tượng thanh trượt mở Customize), bốn shortcut bật đầu là vòng tròn có nhãn, còn lại là `ListRow`; cấu hình theo user từ `GET/PUT /shortcuts` (`useShortcuts`, mặc định cục bộ trùng BE nên không nháy). Chọn shortcut chạy qua `useShortcutRunner`: món ăn → `useUiStore.requestAddFood({tab, libraryView})` rồi sang `/food-log`; New Recipe / New Food → trang tạo; Weight dùng lại `LogWeightDialog` của trang Weight, Metrics (`FullBodySheet` + `BodyFatReferenceSheet` dùng `BODY_FAT_BANDS` của onboarding, lưới 3×3 thân người xám tự vẽ, bộ nam/nữ qua prop `body`), Photos (`ProgressPhotosSheet`, URL ảnh có chữ ký hết hạn 15 phút nên không cache). Toolbar trên thanh tab (`DashboardSearchBar`) theo Toolbar Style: Search and Barcode, thêm nút thứ 3, bốn nút tuỳ chọn, hoặc ẩn. Trang `/shortcuts` (Customize, toàn màn hình) dựng từ `SubPageHeader`, `SettingsSection` / `SettingRow`, `ChoiceSheet`, `ToggleList`, `ConfirmDialog` ("Exit Without Saving?") và `SlidingSwitch` (Order | Color); đổi thứ tự bằng kéo-thả `@dnd-kit` (`SortableShortcutRow`): chỉ kéo từ tay cầm "=" bên phải (`PointerSensor` giữ 150ms / lệch tối đa 5px nên cuộn trang trên mobile không kéo nhầm, `KeyboardSensor`: Space rồi mũi tên), khoá trục dọc và trong danh sách, hàng đang kéo nổi lên (`shadow-lg`), các hàng khác dịch chỗ bằng transition của `useSortable` (tắt khi `prefers-reduced-motion`), nhãn "Top Shortcut" cập nhật theo vị trí đang kéo, thông báo đọc màn hình tiếng Anh, `DndContext` luôn có `id` cố định để tránh lệch hydration; màu bằng `ChooseColorSheet`. Bản nháp so với bản đã lưu theo nội dung (khoá, bật, màu, thứ tự), kéo về đúng bản đã lưu thì Save tắt lại. Theo `.rules`: hook và state server của ba sheet nhập liệu nằm ở `pages/*ShortcutPage.tsx` (`ShortcutSheetsPage` gắn ở layout), sheet trong `components/` chỉ nhận props; shortcut chỉ điều hướng (New Recipe, New Food, Customize) là `<Link>`; bảy màu của Choose Color là token `--shortcut-*` (theme.css), không dùng màu Tailwind thô.
- Xoá món đã log không hỏi lại (Remove trong màn sửa món): màn sửa đóng trượt xuống, `useDeleteEntry` gỡ món khỏi cache ngày ngay (tổng ngày trừ luôn, lỗi thì trả lại) rồi mới gọi BE. Danh sách có thêm/xoá mục phải dùng `useExitingList` (`src/hooks`) + `CollapseItem` (`src/components/shared`): mục bị gỡ còn giữ 300ms ở vị trí cũ, co chiều cao (grid-rows 1fr → 0fr) và mờ dần; mục mới trượt vào từ phải. Đang áp dụng cho timeline, Your Plate, Notes, lịch sử cân. Xoá cả ngày (Delete day) vẫn có hộp xác nhận.
- Bảng Choose Icon cao gần hết màn hình trên mobile (`SheetFrame tall`, chỉ chừa mép trên), nút Select Icon / Cancel luôn dính đáy kể cả khi lưới ngắn; đổi tab thì lưới mới trượt vào từ phải (sang tab sau) hoặc từ trái (về tab trước) 300ms, tab đang chọn tự cuộn ra giữa hàng tab, lưới cuộn về đầu. Lần mở đầu không trượt.
- Bảng Choose Icon có tab theo MacroFactor: All · Baked Goods · Meats · Vegetables · Seafood · Fruit · Nuts and Seeds · Dairy and Eggs · Drinks · Sweets · Other. Bộ icon chỉ có 9 nhóm gốc nên Baked Goods / Sweets chỉ gom vài nguyên liệu (bột, đường, mật ong…) cho tới khi có thêm icon bánh và đồ ngọt.
- Tối ưu mobile (gốc ở component dùng chung): `index.css` đặt `touch-action: manipulation`, `overflow-x: clip` cho `body`, nút bấm trên màn cảm ứng mờ còn 0.8 khi giữ; `Button` cao 44px trên mobile (`size-11`, `md:` mới thu nhỏ), nút nhỏ (`xs`, `icon-xs`) có vùng chạm 44px bằng `before:-inset-2.5`, bấm co `scale-[0.97]` 150ms; Checkbox / Radio / Switch có vùng chạm 44px; Popover / Dropdown / Select đóng 150ms (ngắn hơn mở 200ms) và tắt hoạt ảnh khi `prefers-reduced-motion`; chip lọc, nút chọn khoảng thời gian, pill ToggleGroup cao 44px trên mobile (`h-11 md:h-9`). Ô nhập luôn ≥16px trên mobile (`Input` / `Textarea` / `SearchInput` dùng `text-base md:text-xs`) và có `inputMode` / `autoComplete` đúng.
- Bàn phím ảo trên iOS (không co layout viewport mà đẩy trang lên): `KeyboardViewport` (gắn ở `app/layout.tsx`, dùng `useVisibleViewport`) đặt `data-keyboard="open"` + `--kb-top` / `--kb-bottom` lên `<html>` khi bàn phím mở. Header dính dùng `in-data-[keyboard=open]:top-(--kb-top)`, thanh nút dính đáy dùng `in-data-[keyboard=open]:bottom-(--kb-bottom)` (không dùng transform để sticky vẫn đúng chỗ), tab bar và toolbar trên tab bar ẩn bằng `in-data-[keyboard=open]:hidden` như MacroFactor. Body thêm padding đáy bằng chiều cao bàn phím để ô ở cuối trang kéo lên được, và ô nhập ngoài dialog được cuộn lên phần trên của vùng nhìn thấy (chừa chỗ cho nút dính). Dialog/sheet tự co theo `--vv-*` trong `DialogContent`. Thanh dính mới có ô nhập bên dưới phải thêm hai biến thể trên.
- Thanh trạng thái theo MacroFactor: lưới Weekly Nutrition (`WeekMatrix`) mỗi ô là một khung tối bo nhẹ `w-5 h-7`, thanh dọc mảnh `w-1` bo tròn có nắp trắng ở đỉnh phần đã đầy, chưa có dữ liệu thì chỉ có dấu gạch, ngày sau hôm nay có thanh xám mờ, ngày chọn viền trắng bo `rounded-xl`. Nutrition Overview dùng thẻ 2 cột (`NutrientCard layout="tile"`: tên + kỳ, thanh dày 24px, vạch kẻ, số lớn + mũi tên; Calories chiếm cả hai cột). Hàng chất (`NutrientCard`, chi tiết món / plate) có thanh mảnh 4px (`NutrientBar thin`), vạch mục tiêu cao hơn thanh, vùng khoảng mục tiêu tô nhạt theo màu nhóm (token `bg-mf-tile-*`, `bg-mf-purple`); chất chưa có dữ liệu hiện "—" (không phải 0), chất không có mục tiêu hiện "No Target" và không có thanh. Màn chi tiết món trên cảm ứng dùng `NumericKeypad` riêng (chữ số, ".", "/", khoảng trắng, xoá) với ô nhập `inputMode="none"`; số lượng nhận phân số ("1/2", "1 1/2") qua `parseQuantity`; Log Foods / Add (hoặc Done) nằm ở hai ô cuối hàng dưới của bàn phím như MacroFactor, hàng nhập ẩn hai nút đó khi bàn phím số đang mở.
- Chi tiết món (bổ sung): đổi đơn vị g / oz / khẩu phần luôn quy đổi từ khối lượng thật (`mass` trong `FoodDetailView`, 100 g → 3.53 oz → 100 g, 109 g → 3.84 oz → 109 g) kể cả khi ô trống hoặc đang gõ dở; chỉ đổi giữa hai khẩu phần thật thì giữ số lượng. Số và nhãn đơn vị hiện lại bằng hiệu ứng mờ-trượt 220ms, đổi chế độ ⇅ trượt vào, vòng Impact on Targets chạy từ rỗng khi xuất hiện (`animate-ring-fill`), thanh chất đổi chiều rộng mượt; tất cả tắt khi giảm chuyển động. Thanh chất mảnh theo MacroFactor: cao 6px, nền tối, vùng mục tiêu là bản mờ (30%) của màu nhóm trên nền tối kéo tới hết thanh (token `--mf-vitamins`, `--mf-minerals`, `bg-mf-tile-*`), phần đã ăn màu sáng của nhóm, vạch mục tiêu xám nhạt; chất có thanh mà chưa có mục tiêu thì cả thanh là vùng tối, chỉ chất `kind: none` (Mono/Poly/Net/Starch/Cholesterol) không có thanh. Tên chất "Net Carbs". Tìm món: đổi từ khoá thì hiện skeleton thay vì danh sách của từ khoá trước (`useFoodSearch` chỉ giữ kết quả cũ khi cùng từ khoá).
- Kết quả tìm món (tab Search, `FoodSearchPanel`): chia nhóm như MacroFactor theo thứ tự From History → Common → Custom → Branded → Open Food Facts (ẩn nhóm rỗng). Các nhóm KHÔNG loại trừ nhau: From History là món đã log khớp từ khoá (tối đa 5, không có "See N More") và món đó vẫn có mặt ở nhóm gốc (OpenFoodFacts, `isMine` → Custom, có thương hiệu → Branded, còn lại Common). Mỗi nhóm 5 dòng; tiêu đề 20px bold, link "See N More" 14px gạch chân cùng baseline bên phải mở danh sách đầy đủ của nhóm (trượt vào từ phải 300ms, Back trượt về từ trái, Load more chỉ ở đó). Dòng kết quả dày ~45px: icon 28px, tên 15px phần khớp từ khoá in đậm, dòng phụ 12px "kcal P F C • khẩu phần (gram)" luôn kèm gram, cắt "…"; bấm cả dòng mở chi tiết, nút + gọn 32px chỉ hiện khi cài đặt Logger Food Tiles bật Multi-Add (mặc định mới là None như MF). Đang tìm thì skeleton theo nhóm. Hiện nhóm hoá ở FE từ kết quả đang tải; khi BE có API theo nhóm (top 5 + totalCount) thì "See N More" dùng tổng của BE.
- Chọn nhiều món trên timeline Food Log (như MacroFactor, `Docs/Design/Food_Log_Multi_Select.md`): bấm pill giờ (hoặc giữ 0,5s một món; More → Select All) vào chế độ chọn. Pill trắng khi cả giờ được chọn, mỗi dòng có vòng ✓/○ (`role="checkbox"`), bút chì mờ 40%. Thanh dưới `SelectionBar` nằm trên thanh tab thay ô tìm: `✕ Select N Foods` + chip View / Copy / Move / Remove / Modify Timestamp / Create Recipe (vô hiệu khi chưa chọn); Copy và Move mở hàng chip con trượt vào 200ms (To Now / Today / Tomorrow / Dates / Date & Time / Multi-Paste Inline), `‹` quay lại. Mọi ngày giờ chọn qua `SelectDatesSheet` (Dates | Ranges, tối đa 62 ngày, nút "Paste to Dates") và `DateTimeWheelSheet` (bánh xe ngày + giờ, hoặc HH : mm cho Modify Timestamp); Remove dùng hộp xác nhận "Remove Foods" (Remove trắng / Go Back); View = bảng "N Foods" tái dùng `FoodMacroRow`, `ImpactRings`, `PlateNutrition` (`allowDay={false}`). Copy/Move/Remove gọi `bulk-copy` / `bulk-move` / `bulk-delete` một lần, toast "Copied N foods", giữ giờ gốc khi đổi ngày.
- Create Recipe (`/recipes/new`, "Build your recipe"): từ chọn nhiều, các món có `foodItemId` (không phải recipe/quick add; bỏ qua kèm toast) thành nguyên liệu qua `recipeDraft` trong `ui.store` (đọc một lần rồi xoá). Recipe Name và Serving Quantity bắt buộc, "Weight of ingredients is X g" cập nhật tức thì, + mở bảng "Add Ingredient" (tìm món, bấm là thêm). Dòng nguyên liệu: icon, tên, "kcal P F C • g", ô lượng + đơn vị bên phải; bấm ô mở `IngredientEditorBar` (hàng chip mọi đơn vị: g, oz, khẩu phần, tbsp/tsp/fl oz/cup/ml khi món có `gramsPerMl`, lb + `NumericKeypad` có "/" cho phân số "1 1/2"; đổi đơn vị giữ nguyên khối lượng); vuốt trái để xoá (`SwipeToDelete`). Đơn vị khẩu phần gửi `foodServingId` + số khẩu phần, đơn vị khối lượng/thể tích gửi `foodServingId: null` + số gram. Thêm/xoá dòng có hoạt ảnh 300ms.
- Thanh tiến độ dinh dưỡng chạy từ 0 khi vừa hiện và đổi độ rộng mượt khi giá trị đổi (~500ms, `motion-safe`): dùng tiện ích `animate-bar-grow` (keyframe `width: 0 → độ rộng`, `index.css`) cộng `transition-[width] duration-500` trên phần tô. Áp cho `NutrientBar` (Food Detail, Plate, View, Recipe, Nutrition Overview), `AddFoodProgress`, `DailyNutritionCard`, `NutrientTile` của dashboard; vạch mục tiêu và vùng nên đạt fade-in 500ms. Thanh mới thêm ở đâu cũng phải theo quy tắc này.
- Create Recipe hai bước (vạch tiến độ 1/2 → 2/2 dưới tiêu đề, bước đổi trượt vào 300ms, Back ở bước 2 quay về bước 1): bước 1 thêm Total Weight (tuỳ chọn, gửi `cookedYieldGrams`) và mục Nutrition (`RecipeNutrition`: công tắc Serving | Recipe, thẻ 2 cột Calories/Protein/Fat/Carbs kèm thanh, rồi mọi nhóm chất cộng từ nguyên liệu, từ `POST /recipes/nutrients`); tiêu đề "Ingredients" dính đầu màn khi cuộn qua danh sách. Bước 2 "Preparation (optional)": thẻ "Your New Recipe" (icon đã chọn hoặc ba icon nguyên liệu xếp chồng) + nút Edit Icon mở `ChooseIconSheet` dùng chung, Preparation / Cooking Time (phút) nhập bằng bàn phím số riêng (`KeypadField` + `IngredientEditorBar` không chip), Link (http/https), Description 0/1500, Steps (+ mở bảng "Step N" 0/300; chạm để sửa, vuốt trái để xoá, kéo tay cầm "=" để sắp xếp bằng dnd-kit). Hai nút dính đáy: Create & Add (`POST /recipes/create-and-log`, ghi một khẩu phần vào hôm nay) và Create (`POST /recipes`).
- Trang số đo Scale Weight (`/weight`), Visual Body Fat (`/body-fat`) và từng số đo vòng (`/body-metrics/[metric]`, một `MeasurementPage` theo khoá trong `features/weight/body-measurements.ts`, khoảng cm khớp BE, hướng dẫn 6 bước `MEASUREMENT_TUTORIAL` dùng chung với Visual Body Fat) (`Docs/Design/Body_Metric_Pages.md`, `features/weight`): một `BodyMetricView` dùng chung — `SubPageHeader` (‹, tiêu đề, +), Average / Difference / "Oct 14 – 20, 2026", nút tròn phóng to biểu đồ (trắng khi đang phóng, ẩn chú thích/hướng dẫn/lịch sử như MF), `MetricChart` (thu gọn: trục y từ 0; phóng to: cao hơn và trục y vừa dữ liệu, tối thiểu 3 vạch; Difference có dấu "+3.0 cm"; vạch ngang đứt nhãn phải, 1W = 7 ngày gần nhất nhãn Mon…Sun, đường xanh `mf-green` + vòng rỗng tự vẽ `animate-chart-draw`, chạm/kéo hiện "79.3 kg · Sat, Oct 17"), `RangeBar` (1W…All + D/W/M mở bảng, không dropdown), thẻ chú thích, `TutorialCard tone="green"` (ẩn lưu localStorage), lịch sử theo tháng có bút chì. Một request lịch sử (`GET /weights?to&all=true`, `GET /body-metrics/visual-body-fat?to&all=true`), lọc kỳ + gộp D/W/M + Average/Difference ở FE. Bảng nhập `MetricEntrySheet`: ✕, ngày ▾ (`SheetFrame onTitleClick`) mở `SelectDateSheet` (lưới tháng thứ Hai đầu, ‹ ›, ngày tương lai tắt, Go to Today), thùng rác chỉ khi ngày đã có bản ghi (hỏi xác nhận), `NumericKeypad` trên cảm ứng, "," = "."; Scale Weight có Weight (kg/lb theo `unitPreference`, BE luôn kg) + Body Fat (gửi kèm `POST /weights` `bodyFatPercent` / `clearBodyFat`), Visual Body Fat có ô % + nút Reference (`BodyFatReferenceSheet`, chọn ô điền % giữa khoảng). Bảng giữ nội dung khi trượt xuống (ngày không về null khi đóng).
- Progress Photos (`/progress-photos`, `features/progress-photos`): tiêu đề + nút +, hai nút Open Gallery / Compare Before & After (tắt mờ khi chưa có ảnh / chưa đủ hai ngày), các ngày có ảnh nhóm theo tháng ("October 2026"); mỗi hàng ba ảnh tròn chồng (Front, Side, Back, hiện lần lượt), ngày "Tue, Oct 20" và nút bút chì. Sheet thêm / sửa (`PhotoSessionSheet`): ✕, ngày ▾ mở Select Date dùng chung của Body Metrics, phụ đề "Progress Photos", thùng rác chỉ khi ngày đã có ảnh (xác nhận rồi xoá cả ngày), ba ô vuông nét đứt Front / Side / Back có biểu tượng tư thế; chọn ảnh mở `CropPhotoScreen` toàn màn hình (khung vuông bốn góc trắng, kéo + chụm / cuộn để phóng, xoay trái / Reset / xoay phải, ✕ huỷ, ✓ vàng) và xuất JPEG 1080×1080 chất lượng 0.85 trước khi tải lên; ✕ trên ô để bỏ ảnh (xoá khi Save). Màn xem `/progress-photos/gallery?date=&angle=` (không thanh tab): nền tô theo màu trung bình của ảnh (lấy mẫu canvas, chuyển màu 700ms), công tắc Front | Side | Back (giữ ngày), ngày, ảnh vuông bo lớn, Trend / Scale Weight của ngày, dải ảnh thu nhỏ cuộn (ngày đang xem có ▾), thanh dưới chia sẻ / ‹ / ẩn chi tiết / › / sửa; vuốt trái phải đổi ngày, ảnh mới trượt vào từ phía vuốt. `/progress-photos/compare`: chọn ngày Before / After và góc, xem cạnh nhau hoặc thanh trượt phủ ảnh. Ảnh là dữ liệu riêng tư: URL có chữ ký hết hạn nên chỉ cache 4 phút, lần đầu cần tick đồng ý lưu riêng tư.
- Dashboard Body Metrics: ô Scale Weight / Visual Body Fat / số đo vòng (Neck, Shoulders…) ghi "Last 7 Entries", đường xu hướng xanh tự co giãn đầu mút chấm rỗng (một lần đo vẽ đoạn phẳng hai chấm), giá trị mới nhất và ›; **ô số đo vòng chỉ hiện khi số đo đó đã có dữ liệu** (không bao giờ hiện "--- cm"), dữ liệu từ `GET /body-metrics/measurements/overview` một lần cho tất cả. Ô Progress Photos: ảnh Front mới nhất tràn thẻ, lớp mờ dần ở đáy, ngày + ›. Ô Full Body: ngày mới nhất, thanh trượt ngang các chip chỉ số (vạch xanh trái, giá trị đậm, tên bên dưới, cuộn bắt điểm, mờ mép, chip hiện lần lượt) và "N metrics" ›.
- Weight Trend (`/dashboard/weight-trend`): mọi kỳ 1W / 1M / 3M / 6M / 1Y / All **kết thúc hôm nay** (1W = 7 ngày gần nhất, không phải tuần lịch có ngày chưa tới; `trailingWindow`). Biểu đồ hai đường: **Scale Weight** = tím đậm, đường cong mượt nối các lần cân thật, không marker; **Trend Weight** = tím nhạt, vòng tròn rỗng mỗi ngày (≤ 14 điểm), đường tự vẽ khi vào / đổi kỳ. Nút tròn bên phải số Average / Difference đổi trục: mặc định từ 0 (0 / 50 / 100), bấm thì vừa khít dữ liệu (như 78–79.5); không còn ẩn các mục bên dưới. Chạm / rê vào ngày hiện giá trị Trend và Scale của ngày đó. Chú giải theo đúng màu hai đường. Insights & Data: Weight Changes 3 / 7 / 14 / 30 / 90 ngày có vùng thu nhỏ, số kg và Decrease / Increase / No Change / Waiting kèm biểu tượng; Data Sources → /weight; lịch sử theo tháng từng ngày với ↘ −0.1 kg / → No Change. Dữ liệu từ BE (`GET /weights/trend` cho kỳ đang chọn và `all=true` cho lịch sử từng ngày, `GET /weights/trend/insights` cho Weight Changes, cân hiện tại, tốc độ tuần, năng lượng, dự báo); trend là EMA có MỖI NGÀY, scale chỉ ở ngày có cân; thiếu dữ liệu thì BE trả null / Waiting và FE hiện "---" / "-- kg".
- Expenditure (`/dashboard/expenditure`) làm như Weight Trend: mọi kỳ kết thúc HÔM NAY (`trailingWindow`); chuỗi MỖI NGÀY (ngày không có điểm giữ điểm trước, `dailyExpenditure` trong `expenditure-series.ts`, đổi sang chuỗi BE khi có). Flux Range là MỘT vùng cam mờ liền (mép trên / dưới cong mượt, hai đầu thẳng đứng, tự vẽ từ trái sang), đường Expenditure cam có marker mỗi ngày: ô vuông rỗng = Holding, vòng tròn rỗng = Updating (≤ 14 điểm). Nút tròn cạnh Average / Difference đổi trục: mặc định từ 0 (vạch mỗi 1000 kcal), bấm thì vừa khít dải Flux; chạm vào ngày hiện kcal, Flux low–high và Holding. Chú giải Flux Range / Expenditure / Holding, tutorial "The Key to Our Smart Programs". Insights: Expenditure Changes 3/7/14/30/90 với vùng thu nhỏ (`DetailPage/MiniArea`), kcal và Decrease / Increase / Waiting; Current Expenditure; Current Strategy (Updating / Holding); Data Sources: Nutrition Data Manager › và Scale Weight ›; lịch sử theo ngày "□ Holding" hoặc "○ −3 kcal".
- Nutrition Data Manager (`/nutrition-data`, `features/nutrition-data`, mở từ Data Sources của Expenditure và mục "Nutrition Data Manager" ở Dashboard): tiêu đề + nút +, danh sách theo tháng (mới trước), mỗi dòng là biểu tượng nguồn, kcal ("· Fasting" nếu nhịn ăn), biểu tượng "incomplete" (pie) nếu ngày chưa đủ, ngày "Tue, Oct 20" và bút chì (vùng chạm 44px). Sheet ngày: ✕, ngày ▾ mở Select Date dùng chung, "Nutrition", thùng rác chỉ khi ngày đã có dữ liệu (xác nhận; không xoá món đã log); Energy (kcal, số nguyên), Protein / Fat / Carbs (g, một số lẻ), công tắc "Are you fasting?" (bật thì khung xanh giải thích trượt xuống) và "Is this day incomplete?", Save, bàn phím số riêng trên màn cảm ứng. API `/nutrition-data` (GET / PUT / DELETE ?date=) đang chờ MOS-BE chốt contract.
- Mini chart của Weight Changes / Expenditure Changes (`DetailPage/MiniArea` + `padWindow`) vẽ ĐÚNG giá trị xu hướng từng ngày của cửa sổ N ngày (N + 1 ô, hôm nay ở ô cuối), tự co giãn theo min–max RIÊNG của hàng, nét trên đậm + vùng tô mờ; ngày thiếu dữ liệu để trống (hàng Waiting vẫn vẽ phần đã có, số "-- kg" / "-- kcal"). Số ở hàng: tăng "0.1 kg" (không dấu +) + nhãn Increase, giảm "−0.1 kg" + Decrease, |Δ| < 0.05 → No Change. Lịch sử theo ngày: tăng = biểu tượng trend-up + "+0.2 kg", giảm = trend-down + "−0.1 kg", bằng = mũi tên ngang + "No Change"; tím cho Weight Trend, cam cho Expenditure (ngày Holding vẫn "□ Holding").
- Nutrition Data Manager theo contract BE (`Docs/Design/Nutrition_Data_Manager.md`): `GET /nutrition-data` (không có `all`, mọi ngày khi bỏ `from` / `to`), `PUT` lưu một ngày, `DELETE ?date=` xoá cả ngày (entry + cờ). Ngày có món trong Food Log (`source = "App"`): ô Energy / Protein / Fat / Carbs và công tắc fasting bị khoá (BE trả 400 nếu sửa), sheet hiện ghi chú kèm nút "Open Food Log" mở đúng ngày đó, thùng rác ẩn, chỉ công tắc "Is this day incomplete?" lưu được (PUT chỉ gửi cờ). Ngày Manual / trống / fasting: lưu kcal tạo hoặc cập nhật đúng một món nhập tay, fasting xoá món nhập tay; số không đổi thì chỉ gửi cờ. Fasting kèm số khác 0, macro không có kcal, kcal > 10000, macro > 1000 g bị chặn ở FE trước khi gọi. Expenditure đọc `GET /expenditure/series` (liên tục tới hôm nay, Calibrating / Holding = ô vuông, Updating = vòng tròn) và `GET /expenditure/insights` (Expenditure Changes, Current Strategy Updating / Holding / Calibrating).
- Biểu đồ chi tiết KÉO NGANG được (Weight Trend, Expenditure, Energy Balance, Scale Weight / Visual Body Fat / số đo, Goal Progress): dùng chung `features/dashboard/chart/` (`use-chart-pan`, `use-tween`, `geometry`, `ChartAxes`). Dữ liệu là TOÀN BỘ lịch sử, khung đang xem kết thúc HÔM NAY (1W = 7 ngày gần nhất…), kéo bằng ngón tay / chuột có quán tính rồi bám về ngày gần nhất, cột / điểm cuối luôn đủ (hình neo sát mép phải); số Average / Difference và nhãn khoảng ngày ở đầu trang chạy theo khung đang kéo. Phần tử bọc chart cần `touch-pan-y` (cuộn dọc trang vẫn dùng được) và bỏ click ngay sau khi kéo (`pan.wasDragged()`). Đổi bộ lọc 1W / 1M / 3M / 6M / 1Y / All thì biểu đồ GIÃN / CO theo trục x (~400 ms, `useTween` trên số ô ngày, trục y chạy mượt theo dữ liệu trong khung); nút phóng to / đổi trục chạy mượt chiều cao / trục y; đổi D / W / M thì chart vẽ lại và hiện dần. Tất cả đều `motion-safe` (giảm chuyển động thì nhảy thẳng tới đích).
- Energy Balance (`GET /energy-balance/series?all=true` + `GET /energy-balance/insights`): tab Expenditure / Calorie Targets (gạch chân trượt, tab nhớ qua `dashboard.balanceMode`), cột xanh kcal đã ăn mỗi ngày (ngày chưa đủ `isIncomplete` vẽ mờ và không tính vào trung bình; nhịn ăn = 0 vẫn tính), đường chấm cam (Expenditure) / vàng (Targets của NGÀY đó), chú giải Calories + đường. Insights "Relative to Expenditure" / "Relative to Targets" 3 / 7 / 14 / 30 / 90 ngày kết thúc hôm nay: "−819 kcal" + ▼ Deficit / ▲ Surplus / Balance hoặc ▼ Below Target / ▲ Above Target / At Target (Waiting khi chưa có ngày dùng được). Cuối trang: lịch sử từng ngày theo tháng ("+832 kcal" + ngày + nhãn), bỏ ngày không có dữ liệu.
- Ô trên Dashboard lấy đúng nguồn BE: Steps = `GET /steps` (`last7DayAverage`, làm tròn; chưa có thì "---"), Period = `GET /periods` (lưới 30 ngày theo `startDate`–`endDate`, `daysSinceLastStart` → "N days ago"), Goal Progress = `GET /goals/progress` (`progressPercent`, kỳ "Last N Days" tính từ `startDate` của goal), mọi nutrient = `GET /nutrients?date=` (mã BE ↔ khoá danh mục ở `nutrient-codes.ts`; `amount` null → "---" thay vì 0; mốc thanh theo loại: target / floor / ceiling), calo + macro vẫn từ log + program. Ô Energy Balance theo tab Expenditure / Targets đang nhớ. Waist to Height = vòng eo ÷ chiều cao hồ sơ, Waist to Hip = vòng eo ÷ vòng hông (2 chữ số thập phân, chạm mở trang vòng eo). Steps / Period chưa có trang chi tiết nên ô không bấm được (chevron mờ).
- Trang Steps (`/steps`, ô Steps của Dashboard) và Period (`/period`, ô Period): cùng khung với các trang số đo — Steps: Average / Total của khoảng đang xem, biểu đồ cột mỗi ngày kéo ngang + giãn khi đổi 1W…All / D-W-M (`features/dashboard/chart`), nút phóng to, Insights (7-day / 30-day average, Best Day), lịch sử theo tháng, bút chì hoặc dấu + mở bảng nhập dùng chung `MetricEntrySheet` ở chế độ `integer` (số nguyên 0–100.000, Select Date, thùng rác + xác nhận khi sửa; cùng ngày ghi đè). Period: "N days ago" + Avg Cycle, lưới 30 ngày, Insights (chu kỳ / kỳ kinh trung bình), danh sách kỳ theo tháng bắt đầu, bảng thêm / sửa (Start Date, End Date không trước Start và có nút xoá, Symptoms, Notes); trùng ngày bắt đầu (409) báo ngay trong bảng. Mọi thay đổi invalidate tiền tố `steps` / `periods` nên ô Dashboard cập nhật ngay. Chưa có ảnh MacroFactor của hai trang này để so từng pixel.
