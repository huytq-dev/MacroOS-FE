'use client'

import { AppHeader } from '@/components/shared/AppHeader'
import { AppSidebar } from '@/components/shared/AppSidebar'
import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { cn } from '@/lib/utils'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useLocalStorage('sidebar-collapsed', false)

  return (
    <AuthGuard>
      <div className="bg-background text-foreground flex h-screen flex-col overflow-clip">
        <AppHeader />
        <div className="flex min-h-0 flex-1">
          <AppSidebar isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed((v) => !v)} />
          <main
            className={cn(
              'bg-muted/10 relative flex min-h-0 flex-1 flex-col overflow-clip p-4 transition-[margin] duration-200 md:p-5',
              isCollapsed ? 'ml-14' : 'ml-60'
            )}
          >
            <div className="flex h-full min-h-0 w-full flex-1 flex-col">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
