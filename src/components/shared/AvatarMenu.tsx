'use client'

import Link from 'next/link'
import { Apple, LogOut, Monitor, Moon, Sun, UserRound } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { useIsClient } from '@/hooks/use-is-client'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { routePath } from '@/config/route-path'
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
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

/** Ảnh đại diện mở menu tài khoản: hồ sơ, thực phẩm của tôi, giao diện, đăng xuất. Dùng ở header desktop và đầu trang mobile. */
export function AvatarMenu({ className }: { readonly className?: string }) {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const mounted = useIsClient()

  const displayName = user?.name || 'User'
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label="Account"
          className={cn('size-10 rounded-full p-0 md:size-9 md:border', className)}
        >
          <Avatar className="size-9 md:size-8">
            <AvatarImage src={user?.avatar} alt="" />
            <AvatarFallback className="bg-secondary text-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="end" sideOffset={4}>
        <DropdownMenuLabel className="font-normal">
          <p className="text-foreground text-sm font-semibold">{displayName}</p>
          <p className="text-muted-foreground truncate text-xs">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={routePath.profile}>
            <UserRound />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={routePath.foods}>
            <Apple />
            <span>My foods</span>
          </Link>
        </DropdownMenuItem>
        {mounted && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {theme === 'dark' ? <Moon /> : theme === 'light' ? <Sun /> : <Monitor />}
              <span>Theme</span>
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
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
