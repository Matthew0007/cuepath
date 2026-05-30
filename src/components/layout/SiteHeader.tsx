'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UserInfo {
  name: string | null
  email: string | null
  role: string | null
}

interface SiteHeaderProps {
  /** 좌측에 표시할 뒤로가기 링크 */
  backHref?: string
  backLabel?: string
}

export function SiteHeader({ backHref, backLabel = '홈으로' }: SiteHeaderProps) {
  // undefined = 로딩 중, null = 비로그인, UserInfo = 로그인
  const [user, setUser] = useState<UserInfo | null | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) { setUser(null); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', authUser.id)
        .single()
      setUser({
        name:  profile?.full_name ?? authUser.user_metadata?.full_name ?? null,
        email: authUser.email ?? null,
        role:  profile?.role ?? 'coachee',
      })
    })
  }, [])

  const dashboardHref =
    user?.role === 'coach' ? '/coach/dashboard'
    : user?.role === 'admin' ? '/admin'
    : '/dashboard'

  const displayName = user?.name ?? user?.email?.split('@')[0] ?? '사용자'
  const initial = (user?.name ?? user?.email ?? '?')[0].toUpperCase()

  return (
    <header className="bg-white border-b border-black/10 shadow-sm sticky top-0 z-50">
      <div className="max-w-[1128px] mx-auto px-4 h-14 flex items-center justify-between">

        {/* 좌측: 로고 + 뒤로가기 */}
        <div className="flex items-center gap-3">
          <Link href="/" className="font-extrabold text-xl text-[#0A66C2] tracking-tight shrink-0">
            Cuepath
          </Link>
          {backHref && (
            <Link
              href={backHref}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 border border-gray-200 px-3 py-1 rounded-full hover:bg-gray-50 transition-colors"
            >
              ← {backLabel}
            </Link>
          )}
        </div>

        {/* 우측: 인증 영역 */}
        <div className="flex items-center gap-2">
          {user === undefined ? (
            /* 로딩 스켈레톤 */
            <div className="w-28 h-8 bg-gray-100 rounded-full animate-pulse" />
          ) : user ? (
            /* 로그인 상태: 마이페이지 */
            <Link
              href={dashboardHref}
              className="flex items-center gap-2 hover:bg-[#EAF0F8] px-3 py-1.5 rounded-full transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0A66C2] to-[#004182] flex items-center justify-center text-white font-bold text-sm shrink-0">
                {initial}
              </div>
              <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate hidden sm:block">
                {displayName}
              </span>
              <span className="text-xs text-gray-400 hidden sm:block">마이페이지</span>
            </Link>
          ) : (
            /* 비로그인: 로그인하기 + 가입하기 */
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-[#0A66C2] px-4 py-1.5 rounded-full border border-[#0A66C2] hover:bg-[#EAF0F8] transition-colors"
              >
                로그인하기
              </Link>
              <Link
                href="/signup"
                className="text-sm font-semibold text-white bg-[#0A66C2] px-4 py-1.5 rounded-full hover:bg-[#004182] transition-colors"
              >
                가입하기
              </Link>
            </>
          )}
        </div>

      </div>
    </header>
  )
}
