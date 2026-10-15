'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { routePath } from '@/config/route-path'
import { Skeleton } from '@/components/ui/skeleton'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`${routePath.login}?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [isAuthenticated, isLoading, pathname, router])

  if (isLoading) {
    return (
      <div className="bg-background flex h-screen flex-col overflow-hidden" aria-busy="true">
        <div className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
          <Skeleton className="h-6 w-6 rounded-md" />
          <Skeleton className="h-4 w-28 rounded-sm" />
        </div>
        <div className="flex min-h-0 flex-1">
          <div className="flex w-60 shrink-0 flex-col gap-0.5 border-r px-1 pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex h-[30px] items-center gap-2 px-2">
                <Skeleton className="h-3.5 w-3.5 shrink-0 rounded-sm" />
                <Skeleton className="h-3 w-24 rounded-sm" />
              </div>
            ))}
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="flex-1 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null
  return <>{children}</>
}
