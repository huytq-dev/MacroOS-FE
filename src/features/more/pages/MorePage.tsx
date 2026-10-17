'use client'

import Link from 'next/link'
import {
  Apple,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Ruler,
  Scale,
  Target,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { routePath } from '@/config/route-path'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useIsClient } from '@/hooks/use-is-client'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

interface MenuItem {
  readonly label: string
  readonly icon: LucideIcon
  readonly href: string
}

const SECTIONS: readonly { readonly title: string; readonly items: readonly MenuItem[] }[] = [
  {
    title: 'General',
    items: [
      { label: 'Account', icon: UserRound, href: routePath.profile },
      { label: 'Units', icon: Ruler, href: routePath.profile },
    ],
  },
  {
    title: 'Feature Settings',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: routePath.dashboardCustomize },
      { label: 'Food Log', icon: Apple, href: routePath.foodLog },
      { label: 'My Foods', icon: Apple, href: routePath.foods },
      { label: 'Weight Trend', icon: Scale, href: routePath.weight },
      { label: 'Strategy', icon: Target, href: routePath.program },
    ],
  },
]

const ROW = 'flex min-h-16 items-center gap-4 px-4 text-lg'

function MenuCard({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="bg-card divide-foreground/10 divide-y overflow-hidden rounded-xl">
      {children}
    </div>
  )
}

const THEMES = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const

/** Một thẻ chọn giao diện: chữ "Aa", bốn chấm màu và khung ô; "System" chia đôi sáng/tối. */
function ThemeCard({
  value,
  selected,
  onSelect,
}: {
  value: string
  selected: boolean
  onSelect: () => void
}) {
  const dots = (
    <span aria-hidden="true" className="flex gap-1">
      {['#ff8261', '#ffd35a', '#5dba85', '#a78bfa'].map((color) => (
        <span key={color} className="size-2.5 rounded-full" style={{ background: color }} />
      ))}
    </span>
  )
  const face = (dark: boolean) => (
    <span
      className={cn(
        'flex flex-1 flex-col justify-end gap-1 p-2',
        dark ? 'bg-zinc-900 text-white' : 'bg-white text-black'
      )}
    >
      <span className="text-xl leading-none font-bold">Aa</span>
      {dots}
    </span>
  )
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${value} theme`}
      onClick={onSelect}
      className={cn(
        'focus-visible:ring-ring/50 flex aspect-square flex-1 flex-col overflow-hidden rounded-xl border-2 transition-colors focus-visible:ring-1 focus-visible:outline-none',
        selected ? 'border-white' : 'border-zinc-700'
      )}
    >
      {value === 'system' ? (
        <>
          {face(false)}
          {face(true)}
        </>
      ) : (
        face(value === 'dark')
      )}
    </button>
  )
}

/** Trang "More" (tab cuối thanh dưới): hồ sơ, các nhóm cài đặt, chọn giao diện, đăng xuất — thay cho menu ảnh đại diện trên điện thoại. */
export function MorePage() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const mounted = useIsClient()
  const name = user?.name || 'User'
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex max-w-2xl flex-col gap-8 pb-16 md:pb-0">
      <div className="bg-card -mx-4 -mt-4 px-4 pt-4 pb-5">
        <PageHeader display title="More" />
        <div className="mt-4 flex items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white text-xl font-bold text-black">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xl font-medium">{name}</p>
            <p className="text-muted-foreground truncate text-base">{user?.email}</p>
          </div>
        </div>
      </div>

      {SECTIONS.map((section) => (
        <section key={section.title} aria-label={section.title} className="space-y-3">
          <h2 className="text-lg font-bold">{section.title}</h2>
          <MenuCard>
            {section.items.map(({ label, icon: Icon, href }) => (
              <Link
                key={label}
                href={href}
                className={cn(
                  ROW,
                  'active:bg-muted focus-visible:ring-ring/50 focus-visible:ring-1 focus-visible:outline-none'
                )}
              >
                <Icon aria-hidden="true" className="size-6 shrink-0" />
                <span className="flex-1">{label}</span>
                <ChevronRight aria-hidden="true" className="text-muted-foreground size-5" />
              </Link>
            ))}
          </MenuCard>
        </section>
      ))}

      <section aria-label="Theme" className="space-y-3">
        <h2 className="text-lg font-bold">Theme</h2>
        <div role="radiogroup" aria-label="Theme" className="flex gap-3">
          {THEMES.map(({ value }) => (
            <ThemeCard
              key={value}
              value={value}
              selected={mounted && theme === value}
              onSelect={() => setTheme(value)}
            />
          ))}
        </div>
      </section>

      <section aria-label="Other" className="space-y-3">
        <h2 className="text-lg font-bold">Other</h2>
        <MenuCard>
          <button
            type="button"
            onClick={logout}
            className={cn(
              ROW,
              'text-destructive active:bg-muted w-full text-left focus-visible:ring-1 focus-visible:outline-none'
            )}
          >
            <LogOut aria-hidden="true" className="size-6 shrink-0" />
            Sign out
          </button>
        </MenuCard>
      </section>
    </div>
  )
}
