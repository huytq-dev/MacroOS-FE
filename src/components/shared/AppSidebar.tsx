'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Apple,
  ChevronLeft,
  LayoutDashboard,
  Scale,
  Target,
  UserRound,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { routePath } from '@/config/route-path'
import { cn } from '@/lib/utils'

interface NavItem {
  icon: LucideIcon
  label: string
  href: string
}

// Thêm mục menu ở đây khi có trang mới (đồng bộ với config/route-path.ts)
const NAV_ITEMS: readonly NavItem[] = [
  { icon: LayoutDashboard, label: 'Hôm nay', href: routePath.dashboard },
  { icon: UtensilsCrossed, label: 'Nhật ký', href: routePath.foodLog },
  { icon: Apple, label: 'Thực phẩm', href: routePath.foods },
  { icon: Target, label: 'Program', href: routePath.program },
  { icon: Scale, label: 'Cân nặng', href: routePath.weight },
  { icon: UserRound, label: 'Hồ sơ', href: routePath.profile },
]

interface AppSidebarProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function AppSidebar({ isCollapsed, onToggleCollapse }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'border-sidebar-border bg-sidebar text-sidebar-foreground fixed top-12 left-0 z-50 hidden h-[calc(100vh-3rem)] shrink-0 flex-col overflow-hidden border-r transition-[width] duration-200 md:flex',
        isCollapsed ? 'w-14' : 'w-60'
      )}
      aria-label="Main navigation"
    >
      <nav className="flex flex-1 flex-col gap-0.5 px-1 pt-2" aria-label="Site navigation">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          const button = (
            <Button
              asChild
              variant="ghost"
              className={cn(
                'flex h-[30px] w-full items-center gap-2 rounded-md text-[12px] font-normal',
                isCollapsed ? 'justify-center px-2' : 'px-2',
                active
                  ? 'bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary font-semibold'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <Link href={href} aria-current={active ? 'page' : undefined}>
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {!isCollapsed && <span className="flex-1 truncate text-left">{label}</span>}
              </Link>
            </Button>
          )
          if (!isCollapsed) return <div key={href}>{button}</div>
          return (
            <Tooltip key={href}>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          )
        })}
      </nav>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onToggleCollapse}
        className="text-sidebar-foreground/50 hover:bg-sidebar-accent border-sidebar-border/30 h-9 w-full shrink-0 rounded-none border-t"
        aria-label={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
      >
        <ChevronLeft
          className={cn('h-4 w-4 transition-transform', isCollapsed && 'rotate-180')}
          aria-hidden="true"
        />
      </Button>
    </aside>
  )
}
