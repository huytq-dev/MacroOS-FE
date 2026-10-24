'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { queryClient } from './query-client'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          {children}
          <Toaster position="top-center" />
          {/* Nút nổi của devtools (z ~99999, góc dưới) đè lên bảng trượt / thanh tab trên điện thoại: chỉ bật khi cần, NEXT_PUBLIC_RQ_DEVTOOLS=1 */}
          {process.env.NODE_ENV === 'development' &&
            process.env.NEXT_PUBLIC_RQ_DEVTOOLS === '1' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
        </TooltipProvider>
      </NextThemesProvider>
    </QueryClientProvider>
  )
}
