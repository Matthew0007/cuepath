import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// 로그인 필요 경로 (미인증 → /login 리다이렉트)
const PROTECTED_PREFIXES = ['/dashboard', '/chat', '/booking', '/coach', '/profile']

// 관리자 전용 경로 (미인증 → /admin/login 리다이렉트)
const ADMIN_PROTECTED_PREFIXES = ['/admin']

// 로그인 상태에서 접근 불가 경로 (인증됨 → /dashboard 리다이렉트)
const AUTH_ONLY_PATHS = ['/login', '/signup']

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAdminProtected =
    ADMIN_PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) &&
    pathname !== '/admin/login'
  const isAuthOnly = AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p))

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAdminProtected && !user) {
    const adminLoginUrl = request.nextUrl.clone()
    adminLoginUrl.pathname = '/admin/login'
    return NextResponse.redirect(adminLoginUrl)
  }

  if (isAuthOnly && user) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
