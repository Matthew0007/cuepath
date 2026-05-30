import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: '연봉 비교·협상 계산기 | Cuepath',
  description: '모든 보상 항목을 총보상으로 환산해 비교하고, 협상 3단계 금액을 산출합니다.',
}

export default function SalaryLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Pretendard 폰트 */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
      />
      {children}
    </>
  )
}
