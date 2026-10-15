import type { Metadata } from 'next'
import { DM_Sans, Geist_Mono } from 'next/font/google'
import NextTopLoader from 'nextjs-toploader'
import { Providers } from '@/lib/providers'
import './index.css'

// DM Sans = font thương hiệu MacroFactor (macrofactor.com/brand)
const geistSans = DM_Sans({ variable: '--font-geist-sans', subsets: ['latin', 'latin-ext'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'MacroOS', template: '%s | MacroOS' },
  description: 'Theo dõi calo và macro hằng ngày',
}

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' as const }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col font-sans">
        <NextTopLoader color="#FF8B41" height={3} showSpinner={false} />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
