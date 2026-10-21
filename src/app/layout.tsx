import type { CSSProperties } from 'react'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import NextTopLoader from 'nextjs-toploader'
import { KeyboardViewport } from '@/components/shared/KeyboardViewport'
import { Providers } from '@/lib/providers'
import './index.css'

// Font tự host (woff2 lấy từ Google Fonts, giấy phép OFL) trong ./fonts: build không còn tải font từ Google nên không hỏng khi mạng
// tới Google chập chờn. Như next/font/google, mỗi subset là một face có unicode-range riêng (trình duyệt chỉ tải phần cần); face latin
// tắt fallback để danh sách font đi latin → latin-ext → fallback. next/font chỉ nhận giá trị literal nên unicode-range viết thẳng.

// DM Sans = font thương hiệu MacroFactor (macrofactor.com/brand)
const sansLatin = localFont({
  src: './fonts/dm-sans-latin.woff2',
  weight: '400 700',
  adjustFontFallback: false,
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
})
const sansLatinExt = localFont({
  src: './fonts/dm-sans-latin-ext.woff2',
  weight: '400 700',
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF',
    },
  ],
})
const geistMono = localFont({
  src: './fonts/geist-mono-latin.woff2',
  weight: '100 900',
  variable: '--font-geist-mono',
})
// Chữ "expanded" cho tiêu đề tab chính (Archivo trục wdth 62–125%, đậm 800): gần font tiêu đề của MacroFactor hơn Unbounded
const displayLatin = localFont({
  src: './fonts/archivo-latin.woff2',
  weight: '100 900',
  adjustFontFallback: false,
  declarations: [
    { prop: 'font-stretch', value: '62% 125%' },
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
})
const displayLatinExt = localFont({
  src: './fonts/archivo-latin-ext.woff2',
  weight: '100 900',
  declarations: [
    { prop: 'font-stretch', value: '62% 125%' },
    {
      prop: 'unicode-range',
      value:
        'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF',
    },
  ],
})
// Chữ rộng, đậm cho wordmark MacroOS (giống phong cách MacroFactor); dùng độ đậm 300 và 700
const brandFont = localFont({
  src: './fonts/unbounded-latin.woff2',
  weight: '300 700',
  variable: '--font-brand-src',
})

const familyOf = (...fonts: readonly { style: { fontFamily: string } }[]) =>
  fonts.map((font) => font.style.fontFamily).join(', ')

// Hai subset của một font ghép thành một danh sách font (latin trước, latin-ext sau)
const fontVariables = {
  '--font-geist-sans': familyOf(sansLatin, sansLatinExt),
  '--font-display-src': familyOf(displayLatin, displayLatinExt),
} as CSSProperties

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
  // Android Chrome: bàn phím co layout viewport nên sheet cao 100dvh tự nằm trên bàn phím (iOS xử lý bằng useVisibleViewport)
  interactiveWidget: 'resizes-content',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#141414' },
    { media: '(prefers-color-scheme: light)', color: '#f5f5f5' },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} ${brandFont.variable} h-full antialiased`}
      style={fontVariables}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        <NextTopLoader color="#FF8B41" height={3} showSpinner={false} />
        <KeyboardViewport />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
