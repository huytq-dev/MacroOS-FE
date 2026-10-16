'use client'

import { AppHeader } from '@/components/shared/AppHeader'
import { AppSidebar } from '@/components/shared/AppSidebar'
import { MobileTabBar } from '@/components/shared/MobileTabBar'
import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { cn } from '@/lib/utils'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useLocalStorage('sidebar-collapsed', false)

  return (
    <AuthGuard>
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
              'relative flex min-h-0 flex-1 flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(6.5rem+env(safe-area-inset-bottom))] transition-[margin] duration-200 md:overflow-y-auto md:p-5 md:pb-5',
              isCollapsed ? 'md:ml-14' : 'md:ml-60'
            )}
          >
            <div className="flex w-full flex-1 flex-col">{children}</div>
          </main>
        </div>
        <MobileTabBar />
      </div>
    </AuthGuard>
  )
}
