'use client'

import Link from 'next/link'
import { LogOut, Monitor, Moon, Sun, UserRound } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { useIsClient } from '@/hooks/use-is-client'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { routePath } from '@/config/route-path'
import { Logo } from '@/components/shared/Logo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const THEMES = [
  { value: 'light', label: 'Sáng', icon: Sun },
  { value: 'dark', label: 'Tối', icon: Moon },
  { value: 'system', label: 'Hệ thống', icon: Monitor },
] as const

export function AppHeader() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const mounted = useIsClient()

  const displayName = user?.name || 'Người dùng'
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="bg-background/80 sticky top-0 z-40 h-12 w-full shrink-0 border-b backdrop-blur-md">
      <div className="flex h-12 items-center px-4">
        <Link href={routePath.dashboard}>
          <Logo height={28} />
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 rounded-full border p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" sideOffset={4}>
              <DropdownMenuLabel className="font-normal">
                <p className="text-foreground text-sm font-semibold">{displayName}</p>
                <p className="text-muted-foreground truncate text-xs">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={routePath.profile}>
                  <UserRound />
                  <span>Hồ sơ</span>
                </Link>
              </DropdownMenuItem>
              {mounted && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    {theme === 'dark' ? <Moon /> : theme === 'light' ? <Sun /> : <Monitor />}
                    <span>Giao diện</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {THEMES.map(({ value, label, icon: Icon }) => (
                      <DropdownMenuItem
                        key={value}
                        onClick={() => setTheme(value)}
                        className={cn(theme === value && 'bg-accent font-semibold')}
                      >
                        <Icon />
                        <span>{label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={logout}>
                <LogOut />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
