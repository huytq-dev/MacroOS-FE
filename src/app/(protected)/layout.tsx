'use client'

import { usePathname } from 'next/navigation'
import { AppHeader } from '@/components/shared/AppHeader'
import { AppSidebar } from '@/components/shared/AppSidebar'
import { MobileTabBar } from '@/components/shared/MobileTabBar'
import { PageTransition } from '@/components/shared/PageTransition'
import { ShortcutSheetsPage } from '@/features/shortcuts/pages/ShortcutSheetsPage'
import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { OnboardingGuard } from '@/features/onboarding/components/OnboardingGuard'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { cn } from '@/lib/utils'

/** Luồng nhiều bước toàn màn hình (New Program, Check-in, Edit Goal): không header, sidebar, thanh tab; chỉ cần đã đăng nhập, như wizard thiết lập. */
const FULL_SCREEN_PREFIXES = [
  '/program/new',
  '/program/check-in',
  '/program/goal/edit',
  '/shortcuts',
]

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useLocalStorage('sidebar-collapsed', false)
  const pathname = usePathname()

  if (FULL_SCREEN_PREFIXES.some((prefix) => pathname.startsWith(prefix)))
    return (
      <AuthGuard>
        <OnboardingGuard>
          <div className="bg-background text-foreground min-h-dvh">{children}</div>
        </OnboardingGuard>
      </AuthGuard>
    )

  return (
    <AuthGuard>
      <OnboardingGuard>
        <div className="bg-background text-foreground flex min-h-dvh flex-col md:h-screen md:overflow-clip">
          <AppHeader />
          <div className="flex min-h-0 flex-1">
            <AppSidebar
              isCollapsed={isCollapsed}
              onToggleCollapse={() => setIsCollapsed((v) => !v)}
            />
            {/* Mobile: không sidebar, chừa chỗ cho tab bar dưới; desktop: cuộn trong main */}
            <main
              className={cn(
                'relative flex min-h-0 flex-1 flex-col overflow-x-clip px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-[calc(5rem+env(safe-area-inset-bottom))] transition-[margin] duration-200 in-data-[keyboard=open]:pb-4 md:overflow-y-auto md:p-5 md:pb-5',
                isCollapsed ? 'md:ml-14' : 'md:ml-60'
              )}
            >
              {/* Chuyển trang kiểu MacroFactor: `key` theo đường dẫn để mỗi lần đổi trang thì trang mới chạy hoạt ảnh vào. */}
              <PageTransition key={pathname} depth={pathname.split('/').filter(Boolean).length}>
                {children}
              </PageTransition>
            </main>
          </div>
          <MobileTabBar />
          <ShortcutSheetsPage />
        </div>
      </OnboardingGuard>
    </AuthGuard>
  )
}
