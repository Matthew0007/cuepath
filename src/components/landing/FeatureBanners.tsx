'use client'

import { useRouter } from 'next/navigation'

export function FeatureBanners() {
  const router = useRouter()

  const handleSalaryClick = () => {
    // 관심 데이터 수집 — 비동기(fire-and-forget), 네비게이션 차단 없음
    fetch('/api/feature-interest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature: 'salary_calculator' }),
    }).catch(() => {})
    router.push('/salary')
  }

  return (
    <section className="max-w-[1128px] mx-auto px-4 py-14">
      {/* 상단 타이틀 */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 leading-tight">
          커리어의 다음 챕터를<br className="md:hidden" /> 준비하세요
        </h1>
        <p className="text-gray-500 text-lg">
          취업·이직에 필요한 도구와 전문가를 한 곳에서
        </p>
      </div>

      {/* 기능 배너 2열 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── 연봉 비교·협상 계산기 (활성) ── */}
        <div className="bg-white rounded-2xl border border-black/10 shadow-md overflow-hidden flex flex-col">
          {/* 컬러 헤더 */}
          <div className="bg-gradient-to-br from-[#0A66C2] to-[#004182] p-8 text-white">
            <div className="text-5xl mb-4">💰</div>
            <h2 className="text-2xl font-extrabold mb-2">연봉 비교·협상 계산기</h2>
            <p className="text-blue-200 text-sm leading-relaxed">
              모든 보상 항목을 총보상으로 환산해 비교하고<br />
              협상 3단계 금액을 자동 산출합니다.
            </p>
          </div>

          {/* 기능 목록 + 버튼 */}
          <div className="p-7 flex-1 flex flex-col justify-between">
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#EAF0F8] text-[#0A66C2] flex items-center justify-center text-xs font-bold shrink-0">✓</span>
                현재 회사 vs 제안 총보상 비교
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#EAF0F8] text-[#0A66C2] flex items-center justify-center text-xs font-bold shrink-0">✓</span>
                4대보험 · 소득세 공제 후 실수령액 계산
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#EAF0F8] text-[#0A66C2] flex items-center justify-center text-xs font-bold shrink-0">✓</span>
                협상 앵커 · 목표 · 최저 수용선 자동 산출
              </li>
            </ul>
            <div className="mt-8 space-y-2">
              <button
                onClick={handleSalaryClick}
                className="w-full bg-[#0A66C2] text-white font-semibold py-3.5 rounded-full hover:bg-[#004182] active:scale-[.98] transition-all text-sm"
              >
                지금 사용하기 →
              </button>
            </div>
          </div>
        </div>

        {/* ── 커리어 컨설팅 (비활성 · Coming Soon) ── */}
        <div className="bg-white rounded-2xl border border-black/10 shadow-md overflow-hidden flex flex-col opacity-60 pointer-events-none select-none">
          {/* 컬러 헤더 */}
          <div className="bg-gradient-to-br from-gray-300 to-gray-400 p-8 text-white relative">
            <span className="absolute top-4 right-4 bg-white/25 text-white text-xs font-bold px-3 py-1 rounded-full border border-white/30">
              Coming Soon
            </span>
            <div className="text-5xl mb-4">🤝</div>
            <h2 className="text-2xl font-extrabold mb-2">커리어 컨설팅</h2>
            <p className="text-gray-100 text-sm leading-relaxed">
              검증된 전문 컨설턴트와<br />
              1:1 채팅 코칭 세션
            </p>
          </div>

          {/* 기능 목록 + 버튼 */}
          <div className="p-7 flex-1 flex flex-col justify-between">
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs font-bold shrink-0">✓</span>
                전문 컨설턴트 매칭 (10개 도메인)
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs font-bold shrink-0">✓</span>
                취업 · 이직 1:1 코칭 세션
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs font-bold shrink-0">✓</span>
                안전한 채팅 환경 · 투명한 후기
              </li>
            </ul>
            <div className="mt-8 space-y-2">
              <button
                disabled
                className="w-full bg-gray-100 text-gray-400 font-semibold py-3.5 rounded-full cursor-not-allowed text-sm"
              >
                준비 중입니다
              </button>
              <p className="text-center text-xs text-gray-400 font-semibold">Coming Soon</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
