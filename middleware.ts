import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { routePath } from '@/config/route-path'

const AUTH_PATHS = [routePath.login, routePath.register, routePath.forgotPassword, routePath.resetPassword]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('access_token')?.value

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Đã login mà vào trang auth → về dashboard
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    return token ? NextResponse.redirect(new URL(routePath.dashboard, request.url)) : NextResponse.next()
  }

  // Protected: chưa login → /login?redirect=
  if (!token) {
    const loginUrl = new URL(routePath.login, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
