import type { Metadata, Viewport } from 'next'
import { DM_Sans, Geist_Mono, Unbounded } from 'next/font/google'
import NextTopLoader from 'nextjs-toploader'
import { Providers } from '@/lib/providers'
import './index.css'

// DM Sans = font thương hiệu MacroFactor (macrofactor.com/brand)
const geistSans = DM_Sans({
  variable: '--font-geist-sans',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
})
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })
// Chữ rộng, đậm cho wordmark MacroOS (giống phong cách MacroFactor); chỉ nạp 2 độ đậm dùng cho logo
const brandFont = Unbounded({
  variable: '--font-brand-src',
  subsets: ['latin'],
  weight: ['300', '700'],
})

export const metadata: Metadata = {
  title: { default: 'MacroOS', template: '%s | MacroOS' },
  description: 'Track your daily calories and macros',
  applicationName: 'MacroOS',
  // Chạy dạng ứng dụng trên iPhone (Safari: Chia sẻ → Thêm vào Màn hình chính): không thanh Safari, thanh trạng thái trong suốt.
  // Nội dung đã chừa chỗ cho tai thỏ/thanh Home bằng env(safe-area-inset-*).
  appleWebApp: { capable: true, title: 'MacroOS', statusBarStyle: 'black-translucent' },
  icons: { icon: '/favicon.ico', apple: '/icon-180.png' },
  formatDetection: { telephone: false },
  // Next chỉ phát `mobile-web-app-capable`; iOS cũ còn đọc thẻ apple- này nên thêm tường minh
  other: { 'apple-mobile-web-app-capable': 'yes' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
    { media: '(prefers-color-scheme: light)', color: '#f5f5f5' },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${brandFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        <NextTopLoader color="#FF8B41" height={3} showSpinner={false} />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
