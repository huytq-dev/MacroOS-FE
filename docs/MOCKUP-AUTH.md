# Mockup ASCII: màn hình đăng nhập (iPhone 17 Pro Max, 440 × 956)

Mô tả bố cục và 5 trạng thái của màn hình đăng nhập. Các màn đăng ký, quên mật khẩu, đặt lại mật khẩu dùng chung khung `AuthShell` và cùng quy tắc ở `UI.md` mục 24.

Ký hiệu: `[ ]` ô nhập, `( )` nút, `▓` Skeleton, `⟳` spinner, `!` biểu tượng lỗi.

## 1. Mặc định (phương án B: tờ form dính đáy, tầm ngón cái)

```
┌────────────────────────────────────────────┐
│ 9:41                              ▂▄▆ ⌁ ▮ │  status bar
│                                            │
│                  ╭──────╮                  │
│                  │  🔥  │                  │  logo 64px, nền đen, bo 2xl
│                  ╰──────╯                  │
│                 MacroOS                    │  24px đậm
│        Theo dõi calo và macro, nhẹ nhàng   │  14px, màu muted
│                                            │  vùng thương hiệu co giãn
├╭──────────────────────────────────────────╮┤
││                  ───                     ││  thanh kéo trang trí
││  Chào mừng quay lại                      ││  tiêu đề 20px đậm (h1)
││  Đăng nhập để xem nhật ký hôm nay.       ││  mô tả 14px muted
││                                          ││
││  Email *                                 ││
││  ┌────────────────────────────────────┐  ││
││  │ ✉  ten@email.com                   │  ││  cao 48px, chữ 16px,
││  └────────────────────────────────────┘  ││  nền secondary, không viền
││                                          ││
││  Mật khẩu *               Quên mật khẩu? ││  liên kết cùng hàng với nhãn
││  ┌────────────────────────────────────┐  ││
││  │ 🔒  Nhập mật khẩu              (👁) │  ││
││  └────────────────────────────────────┘  ││
││  ╭──────────────────────────────────────╮││
││  │             Đăng nhập                │││  nút pill đen 48px
││  ╰──────────────────────────────────────╯││
││     Chưa có tài khoản?  Tạo tài khoản    ││
│╰──────────────────────────────────────────╯│  đệm theo safe area dưới
└────────────────────────────────────────────┘
```

Từ `sm` (640px) trở lên: thương hiệu ở trên, tờ form thành thẻ bo 3xl căn giữa màn hình, không còn thanh kéo. Các trang đăng ký, quên mật khẩu, đặt lại mật khẩu dùng cùng khung này (`AuthShell`).

## 2. Bấm Đăng nhập khi để trống (lỗi từng ô, focus vào ô đầu)

```
│  Email *                                 │
│  ┌────────────────────────────────────┐  │
│  │ |                                  │  │  ← focus ở đây, viền đỏ
│  └────────────────────────────────────┘  │
│  Vui lòng nhập email                     │  chữ đỏ 11px, aria-describedby
│                                          │
│  Mật khẩu *                              │
│  ┌────────────────────────────────────┐  │
│  │ Nhập mật khẩu                  (👁) │  │  viền đỏ
│  └────────────────────────────────────┘  │
│  Vui lòng nhập mật khẩu                  │
│                         Quên mật khẩu?   │
│  ┌────────────────────────────────────┐  │
│  │            Đăng nhập               │  │  KHÔNG khóa nút vì form chưa hợp lệ
│  └────────────────────────────────────┘  │
```

## 3. Đang gửi (chỉ nút đổi, cả trang đứng yên)

```
│  Email *                                 │
│  ┌────────────────────────────────────┐  │
│  │ admin@gmail.com                    │  │  giá trị giữ nguyên
│  └────────────────────────────────────┘  │
│  Mật khẩu *                              │
│  ┌────────────────────────────────────┐  │
│  │ ••••••••                       (👁) │  │
│  └────────────────────────────────────┘  │
│                         Quên mật khẩu?   │
│  ┌────────────────────────────────────┐  │
│  │      ⟳  Đang đăng nhập...          │  │  disabled + aria-busy, nền đậm
│  └────────────────────────────────────┘  │
```

Không có skeleton toàn trang. Thành công thì nút giữ trạng thái này cho tới khi sang `/dashboard`.

## 4. BE từ chối (sai email hoặc mật khẩu)

```
│  Đăng nhập                               │
│  Nhập email và mật khẩu để tiếp tục      │
│  theo dõi calo.                          │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ (!) Không đăng nhập được           │  │  Alert destructive, role="alert"
│  │     Email hoặc mật khẩu không đúng.│  │  nguyên văn message của BE
│  └────────────────────────────────────┘  │
│                                          │
│  Email *                                 │
│  ┌────────────────────────────────────┐  │
│  │ admin@gmail.com                    │  │  giá trị còn nguyên để sửa
│  └────────────────────────────────────┘  │
│  Mật khẩu *                              │
│  ┌────────────────────────────────────┐  │
│  │ ••••••••                       (👁) │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │            Đăng nhập               │  │  nút mở khóa ngay
│  └────────────────────────────────────┘  │
```

Khi BE trả lỗi theo ô (400 có `errors`), lỗi hiện ngay dưới ô tương ứng như mục 2 và không có khung Alert.

## 5. Mất kết nối hoặc BE lỗi 5xx

```
│  ┌────────────────────────────────────┐  │
│  │ (!) Không đăng nhập được           │  │
│  │     Không kết nối được máy chủ.    │  │  câu chung, không lộ mã lỗi
│  │     Kiểm tra mạng rồi thử lại.     │  │
│  └────────────────────────────────────┘  │
```

Kèm toast ngắn "Hệ thống tạm thời không phản hồi" từ interceptor.

## Chỉ dùng skeleton cả trang ở đâu

```
Mở /login lần đầu, đang khôi phục phiên:

│              ▓▓▓▓▓▓▓▓▓▓                  │
│  ┌────────────────────────────────────┐  │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  │
│  └────────────────────────────────────┘  │
```

Chỉ lúc `isLoading` của `auth.store` đang là "khôi phục phiên". Không bao giờ bật khi bấm Đăng nhập.
