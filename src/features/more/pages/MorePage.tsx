'use client'

import Link from 'next/link'
import {
  Apple,
  BookOpen,
  ChevronRight,
  ClipboardList,
  Compass,
  Eye,
  FileDown,
  Globe,
  Info,
  LayoutDashboard,
  LifeBuoy,
  MapPin,
  RefreshCw,
  Ruler,
  Scale,
  Tag,
  Target,
  Trash2,
  UserRound,
  Waypoints,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useProfile } from '@/features/users/hooks/use-profile'
import { useIsClient } from '@/hooks/use-is-client'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'
import pkg from '../../../../package.json'
import {
  AFTER_THEME,
  BEFORE_THEME,
  UNAVAILABLE_TEXT,
  type MoreIcon,
  type MoreRow,
  type MoreSection,
} from '../more.config'

const ICONS: Record<MoreIcon, LucideIcon> = {
  account: UserRound,
  subscription: Tag,
  integrations: RefreshCw,
  units: Ruler,
  language: Globe,
  dashboard: LayoutDashboard,
  foodLog: Apple,
  shortcuts: Waypoints,
  expenditure: Zap,
  weightTrend: Scale,
  strategy: Target,
  dataExport: FileDown,
  dataVisibility: Eye,
  accountDeletion: Trash2,
  knowledgeBase: BookOpen,
  roadmap: MapPin,
  support: LifeBuoy,
  legal: ClipboardList,
  tutorials: Compass,
  about: Info,
}

const ROW = 'flex min-h-16 items-center gap-4 px-4 text-lg'

function MenuCard({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="bg-card divide-foreground/10 divide-y overflow-hidden rounded-xl">
      {children}
    </div>
  )
}

/** Một hàng của More: có tính năng thì là liên kết; chưa có thì mờ, không bấm được, ghi "Not available yet" (không trang rỗng, không luồng giả). */
function MenuRow({ row }: { readonly row: MoreRow }) {
  const Icon = ICONS[row.icon]
  if (row.status === 'ready' && row.href)
    return (
      <Link
        href={row.href}
        className={cn(
          ROW,
          'active:bg-muted focus-visible:ring-ring/50 focus-visible:ring-1 focus-visible:outline-none'
        )}
      >
        <Icon aria-hidden="true" className="size-6 shrink-0" />
        <span className="flex-1">{row.label}</span>
        <ChevronRight aria-hidden="true" className="text-muted-foreground size-5" />
      </Link>
    )
  return (
    <div aria-disabled="true" className={cn(ROW, 'py-2 opacity-50')}>
      <Icon aria-hidden="true" className="size-6 shrink-0" />
      <span className="flex-1">
        <span className="block leading-snug">{row.label}</span>
        <span className="text-muted-foreground block text-sm">{UNAVAILABLE_TEXT}</span>
      </span>
    </div>
  )
}

function Section({ section }: { readonly section: MoreSection }) {
  return (
    <section aria-label={section.title} className="space-y-3">
      <h2 className="text-lg font-bold">{section.title}</h2>
      <MenuCard>
        {section.rows.map((row) => (
          <MenuRow key={row.key} row={row} />
        ))}
      </MenuCard>
    </section>
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

/**
 * Trang "More" (tab cuối thanh dưới) theo MacroFactor: hồ sơ, General, Feature Settings, Theme, Data Management, Community & Support, Other và số phiên bản
 * thật (package.json). Đăng xuất nằm ở Account (hồ sơ). Hàng chưa có tính năng thật hiện mờ ("Not available yet"), xem `more.config.ts`.
 */
export function MorePage() {
  const { user } = useAuth()
  const profile = useProfile()
  const memberSince = profile.data?.createdAt
    ? new Date(profile.data.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null
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
    <div className="flex max-w-2xl flex-col gap-8 md:pb-0">
      <div className="bg-card -mx-4 -mt-[calc(env(safe-area-inset-top)+1.25rem)] px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-5">
        <PageHeader display title="More" />
        <div className="mt-4 flex items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white text-xl font-bold text-black">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xl font-medium">{name}</p>
            <p className="text-muted-foreground truncate text-base">
              {memberSince ? `Member Since ${memberSince}` : user?.email}
            </p>
          </div>
        </div>
      </div>

      {BEFORE_THEME.map((section) => (
        <Section key={section.key} section={section} />
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

      {AFTER_THEME.map((section) => (
        <Section key={section.key} section={section} />
      ))}

      <p className="text-muted-foreground pb-2 text-center text-base">Version {pkg.version}</p>
    </div>
  )
}
