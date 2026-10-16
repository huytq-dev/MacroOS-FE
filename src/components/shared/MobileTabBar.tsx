'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Apple,
  LayoutDashboard,
  Scale,
  Target,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import { routePath } from '@/config/route-path'
import { cn } from '@/lib/utils'

interface TabItem {
  icon: LucideIcon
  label: string
  href: string
}

// 5 tab dưới (iPhone: vùng chạm ≥ 44px); Hồ sơ nằm trong menu avatar ở header
const TABS: readonly TabItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: routePath.dashboard },
  { icon: UtensilsCrossed, label: 'Nhật ký', href: routePath.foodLog },
  { icon: Apple, label: 'Món ăn', href: routePath.foods },
  { icon: Target, label: 'Program', href: routePath.program },
  { icon: Scale, label: 'Cân', href: routePath.weight },
]

export function MobileTabBar() {
  const pathname = usePathname()
  return (
    <nav
      className="bg-background/95 fixed inset-x-0 bottom-0 z-50 flex h-14 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label="Điều hướng chính"
    >
      {TABS.map(({ icon: Icon, label, href }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] transition-colors',
              active ? 'text-primary font-semibold' : 'text-muted-foreground'
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
