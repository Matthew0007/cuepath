import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buttonVariants } from '@/components/ui/button'
import { AvatarImage } from '@/components/ui/avatar-image'
import { cn } from '@/lib/utils'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: { full_name: string | null; avatar_url: string | null } | null = null
  let avatarSignedUrl: string | null = null

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single()
    profile = data

    if (data?.avatar_url) {
      const admin = createAdminClient()
      const { data: signed } = await admin.storage
        .from('avatars')
        .createSignedUrl(data.avatar_url, 3600)
      avatarSignedUrl = signed?.signedUrl ?? null
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="border-b px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <span className="font-bold text-xl">Cuepath</span>

        {user ? (
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <AvatarImage src={avatarSignedUrl} name={profile?.full_name} size={32} />
              <span className="text-sm font-medium text-gray-700">
                {profile?.full_name ?? user.email}
              </span>
            </Link>
            <Link href="/dashboard" className={cn(buttonVariants({ size: 'sm' }))}>
              대시보드
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
              로그인
            </Link>
            <Link href="/signup" className={cn(buttonVariants({ size: 'sm' }))}>
              시작하기
            </Link>
          </div>
        )}
      </header>

      {/* 히어로 */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center space-y-6">
        <h1 className="text-5xl font-bold leading-tight tracking-tight">
          커리어의 다음 챕터,<br />
          검증된 컨설턴트와 함께
        </h1>
        <p className="text-xl text-gray-500">
          취업·이직 전문 컨설턴트와 1:1 채팅 코칭.<br />
          결제 후 즉시 시작, 60분 집중 세션.
        </p>
        <Link href={user ? '/coaches' : '/signup'} className={cn(buttonVariants({ size: 'lg' }), 'px-8')}>
          {user ? '컨설턴트 찾기' : '무료로 시작하기'}
        </Link>
      </section>

      {/* 특징 */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: '검증된 컨설턴트',
              desc: 'Matthew가 직접 검증한 커리어 전문가. IT·마케팅·금융·스타트업 등 10개 도메인.',
            },
            {
              title: '안전한 채팅',
              desc: '4층 차단 시스템으로 외부 연락처 유출을 방지. 플랫폼 안에서만 소통.',
            },
            {
              title: '합리적인 가격',
              desc: '컨설턴트가 직접 설정한 가격. 중간 마진 없이 투명하게.',
            },
          ].map((f) => (
            <div key={f.title} className="bg-gray-50 rounded-2xl p-6 space-y-2">
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white py-20 text-center space-y-4">
        <h2 className="text-3xl font-bold">지금 바로 컨설턴트를 만나보세요</h2>
        <p className="text-gray-400">컨설턴트 신청도 무료. 승인 후 즉시 활동 가능.</p>
        <div className="flex gap-3 justify-center pt-2">
          <Link
            href="/coaches"
            className={cn(buttonVariants({ variant: 'outline' }), 'border-white text-white hover:bg-white hover:text-gray-900')}
          >
            컨설턴트 둘러보기
          </Link>
          <Link
            href={user ? '/dashboard' : '/signup'}
            className={cn(buttonVariants(), 'bg-white text-gray-900 hover:bg-gray-100')}
          >
            {user ? '대시보드로 이동' : '회원가입'}
          </Link>
        </div>
      </section>

      <footer className="text-center py-8 text-sm text-gray-400">
        © 2026 Cuepath. All rights reserved.
      </footer>
    </div>
  )
}
