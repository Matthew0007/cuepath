import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Shield, Star, Users } from 'lucide-react'

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
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-[#0A66C2] font-medium hover:underline"
                >
                  대시보드
                </Link>
              </>
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

      {/* 히어로 */}
      <section className="max-w-[1128px] mx-auto px-4 pt-16 pb-12 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
            커리어의 다음 챕터,<br />
            <span className="text-[#0A66C2]">검증된 컨설턴트</span>와<br />
            함께하세요
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            취업·이직 전문 컨설턴트와 1:1 채팅 코칭.<br />
            IT·금융·마케팅·스타트업 등 10개 도메인.
          </p>
          <div className="flex gap-3">
            <Link
              href={user ? '/coaches' : '/signup'}
              className="inline-flex items-center bg-[#0A66C2] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#004182] transition-colors"
            >
              {user ? '컨설턴트 찾기' : '무료로 시작하기'}
            </Link>
            <Link
              href="/coaches"
              className="inline-flex items-center border border-[#0A66C2] text-[#0A66C2] font-semibold px-6 py-3 rounded-full hover:bg-[#EAF0F8] transition-colors"
            >
              컨설턴트 둘러보기
            </Link>
          </div>
        </div>

        {/* 우측 일러스트 카드 */}
        <div className="shrink-0 w-full md:w-[340px] bg-white rounded-2xl border border-black/10 shadow-md p-6 space-y-4">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">추천 컨설턴트</p>
          {[
            { name: '김지원', domain: 'IT · 개발', rating: 4.9, reviews: 42 },
            { name: '박민준', domain: '금융 · 투자', rating: 4.8, reviews: 31 },
            { name: '이서연', domain: '마케팅 · 브랜드', rating: 4.7, reviews: 28 },
          ].map((c) => (
            <div key={c.name} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A66C2] to-[#004182] flex items-center justify-center text-white font-bold text-sm shrink-0">
                {c.name[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-500">{c.domain}</p>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-xs font-medium text-gray-700">{c.rating}</span>
              </div>
            </div>
          ))}
          <Link
            href={user ? '/coaches' : '/signup'}
            className="block text-center text-sm font-semibold text-[#0A66C2] border border-[#0A66C2] py-2 rounded-full hover:bg-[#EAF0F8] transition-colors mt-2"
          >
            전체 컨설턴트 보기
          </Link>
        </div>
      </section>

      {/* 특징 */}
      <section className="bg-white border-y border-black/10 py-14">
        <div className="max-w-[1128px] mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">왜 Cuepath인가요?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: '검증된 컨설턴트',
                desc: 'Cuepath가 직접 검증한 커리어 전문가. 허위 정보 없이 신뢰할 수 있는 컨설팅.',
                color: 'bg-[#EAF0F8] text-[#0A66C2]',
              },
              {
                icon: Shield,
                title: '안전한 채팅 환경',
                desc: '4층 차단 시스템으로 외부 연락처 유출을 원천 차단. 플랫폼 안에서만 소통.',
                color: 'bg-green-50 text-green-700',
              },
              {
                icon: Star,
                title: '투명한 후기 시스템',
                desc: '실제 세션 완료 후에만 작성 가능한 검증된 후기. 평점 조작 불가.',
                color: 'bg-amber-50 text-amber-600',
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="text-center space-y-3 p-6 rounded-2xl border border-black/5 hover:shadow-sm transition-shadow">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 가격 */}
      <section className="max-w-[1128px] mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">세션 요금</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
          {[
            { duration: '30분', price: '40,000원', desc: '빠른 커리어 상담' },
            { duration: '50분', price: '70,000원', desc: '심층 코칭 세션', highlight: true },
          ].map((opt) => (
            <div
              key={opt.duration}
              className={`rounded-2xl border p-6 text-center space-y-2 ${opt.highlight ? 'border-[#0A66C2] bg-[#EAF0F8]' : 'border-black/10 bg-white'}`}
            >
              <p className="text-3xl font-bold text-gray-900">{opt.price}</p>
              <p className="text-sm font-medium text-gray-700">{opt.duration} 세션</p>
              <p className="text-xs text-gray-500">{opt.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0A66C2] py-16 text-center text-white space-y-5">
        <h2 className="text-3xl font-bold">지금 바로 커리어를 업그레이드하세요</h2>
        <p className="text-blue-200">컨설턴트 신청도 무료. 승인 후 즉시 활동 가능.</p>
        <div className="flex gap-3 justify-center">
          <Link
            href={user ? '/coaches' : '/signup'}
            className="bg-white text-[#0A66C2] font-semibold px-6 py-3 rounded-full hover:bg-gray-100 transition-colors"
          >
            {user ? '컨설턴트 찾기' : '무료 회원가입'}
          </Link>
          <Link
            href="/coaches/apply"
            className="border border-white text-white font-semibold px-6 py-3 rounded-full hover:bg-white/10 transition-colors"
          >
            컨설턴트 신청
          </Link>
        </div>
      </section>

      <footer className="bg-white border-t border-black/10 py-8 text-center text-sm text-gray-400">
        © 2026 Cuepath. All rights reserved.
      </footer>
    </div>
  )
}
