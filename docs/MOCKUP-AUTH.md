# Mockup ASCII: màn hình đăng nhập (iPhone 17 Pro Max, 440 × 956)

Mô tả bố cục và 5 trạng thái của màn hình đăng nhập. Các màn đăng ký, quên mật khẩu, đặt lại mật khẩu dùng chung khung `AuthShell` và cùng quy tắc ở `UI.md` mục 24.

Ký hiệu: `[ ]` ô nhập, `( )` nút, `▓` Skeleton, `⟳` spinner, `!` biểu tượng lỗi.

## 1. Mặc định

```
┌──────────────────────────────────────────┐
│ ▒▒▒▒▒▒▒▒▒▒▒▒ safe area ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │
│                                          │
│              (◉) MacroOS                 │  logo + tên, căn giữa
│                                          │
│  Đăng nhập                               │  tiêu đề 16px đậm
│  Nhập email và mật khẩu để tiếp tục      │  mô tả, màu muted
│  theo dõi calo.                          │
│                                          │
│  Email *                                 │  nhãn 12px
│  ┌────────────────────────────────────┐  │
│  │ ten@email.com                      │  │  ô cao 44px, chữ 16px,
│  └────────────────────────────────────┘  │  nền secondary, bo xl
│                                          │
│  Mật khẩu *                              │
│  ┌────────────────────────────────────┐  │
│  │ Nhập mật khẩu                  (👁) │  │
│  └────────────────────────────────────┘  │
│                         Quên mật khẩu?   │  liên kết gạch chân, căn phải
│                                          │
│  ┌────────────────────────────────────┐  │
│  │            Đăng nhập               │  │  nút pill đen, cao 44px
│  └────────────────────────────────────┘  │
│                                          │
│     Chưa có tài khoản? Tạo tài khoản     │
│                                          │
└──────────────────────────────────────────┘
```

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
