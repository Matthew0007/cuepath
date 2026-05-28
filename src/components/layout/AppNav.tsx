'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Users, CalendarDays, User, LogOut, Settings,
} from 'lucide-react'
import { AvatarImage } from '@/components/ui/avatar-image'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { cn } from '@/lib/utils'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

interface AppNavProps {
  userName: string
  avatarUrl: string | null
  role: string
  unreadCount?: number
}

const coacheeLinks = [
  { href: '/dashboard', label: '홈', icon: Home },
  { href: '/coaches',   label: '컨설턴트', icon: Users },
  { href: '/sessions',  label: '세션', icon: CalendarDays },
  { href: '/profile',   label: '프로필', icon: User },
]

const coachLinks = [
  { href: '/coach/dashboard', label: '홈', icon: Home },
  { href: '/sessions',        label: '세션', icon: CalendarDays },
  { href: '/coach/schedule',  label: '일정', icon: CalendarDays },
  { href: '/profile',         label: '프로필', icon: User },
]

export function AppNav({ userName, avatarUrl, role, unreadCount = 0 }: AppNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const links = role === 'coach' ? coachLinks : coacheeLinks

  async function handleLogout() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-black/10 shadow-sm">
      <div className="max-w-[1128px] mx-auto px-4 h-14 flex items-center gap-4">
        {/* 로고 */}
        <Link
          href={role === 'coach' ? '/coach/dashboard' : role === 'admin' ? '/admin' : '/dashboard'}
          className="shrink-0"
        >
          <span className="font-extrabold text-xl text-[#0A66C2] tracking-tight">Cuepath</span>
        </Link>

        {/* 검색창 */}
        <div className="hidden md:flex items-center bg-[#EAF0F8] rounded-md px-3 py-1.5 gap-2 w-56">
          <svg className="w-4 h-4 text-[#0A66C2]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <span className="text-sm text-[#0A66C2]/70">컨설턴트 검색</span>
        </div>

        <div className="flex-1" />

        {/* 네비게이션 링크 */}
        <nav className="hidden md:flex items-center h-full">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && href !== '/coach/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 px-4 h-14 text-xs font-medium transition-colors border-b-2 -mb-px',
                  active
                    ? 'text-[#0A66C2] border-[#0A66C2]'
                    : 'text-gray-500 border-transparent hover:text-[#0A66C2]',
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            )
          })}
          {role === 'admin' && (
            <Link
              href="/admin"
              className="flex flex-col items-center justify-center gap-0.5 px-4 h-14 text-xs font-medium text-gray-500 hover:text-[#0A66C2] border-b-2 border-transparent -mb-px"
            >
              <Settings className="w-5 h-5" />
              <span>관리자</span>
            </Link>
          )}
        </nav>

        {/* 알림 벨 */}
        <NotificationBell initialUnreadCount={unreadCount} />

        {/* 구분선 */}
        <div className="hidden md:block w-px h-8 bg-gray-200" />

        {/* 프로필 + 로그아웃 */}
        <div className="flex items-center gap-2">
          <Link href="/profile" className="flex flex-col items-center gap-0.5 group">
            <AvatarImage src={avatarUrl} name={userName} size={28} />
            <span className="text-[10px] text-gray-500 group-hover:text-[#0A66C2] hidden md:block leading-none">나</span>
          </Link>
          <button
            onClick={handleLogout}
            className="hidden md:flex flex-col items-center gap-0.5 text-gray-500 hover:text-red-500 transition-colors px-2"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px]">로그아웃</span>
          </button>
        </div>
      </div>

      {/* 모바일 하단 네비게이션 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-black/10 flex z-50">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && href !== '/coach/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium',
                active ? 'text-[#0A66C2]' : 'text-gray-400',
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
