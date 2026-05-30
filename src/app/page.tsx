import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FeatureBanners } from '@/components/landing/FeatureBanners'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-[#F3F2EF]">

      {/* 헤더 */}
      <header className="bg-white border-b border-black/10 shadow-sm sticky top-0 z-50">
        <div className="max-w-[1128px] mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-extrabold text-xl text-[#0A66C2] tracking-tight">Cuepath</span>
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                href="/dashboard"
                className="text-sm text-[#0A66C2] font-medium hover:underline"
              >
                대시보드
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-[#0A66C2] px-4 py-1.5 rounded-full border border-[#0A66C2] hover:bg-[#EAF0F8] transition-colors"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-semibold text-white bg-[#0A66C2] px-4 py-1.5 rounded-full hover:bg-[#004182] transition-colors"
                >
                  시작하기
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 기능 배너 */}
      <FeatureBanners />

      {/* 푸터 */}
      <footer className="bg-white border-t border-black/10 py-8 text-center text-sm text-gray-400">
        © 2026 Cuepath. All rights reserved.
      </footer>

    </div>
  )
}
