// 세션 요금 정책 (2026-05-25 확정)
// 컨설턴트에게 settlement 금액은 노출하지 않음 — 추후 정산 기능 개발 시 반영
export const SESSION_OPTIONS = [
  { duration: 30, userPrice: 40_000, coachSettlement: 25_000 },
  { duration: 50, userPrice: 70_000, coachSettlement: 55_000 },
] as const

export type SessionDuration = 30 | 50

export const PLATFORM_FEE = 15_000  // 플랫폼 수수료 (건당 고정)

export function getSessionOption(duration: number) {
  return SESSION_OPTIONS.find((o) => o.duration === duration) ?? SESSION_OPTIONS[0]
}

// ──────────────────────────────────────────────
export const COACHING_DOMAINS = [
  'IT/개발',
  '마케팅',
  '디자인',
  'PM/기획',
  '데이터',
  '금융/컨설팅',
  '스타트업',
  '해외취업',
  '공기업/공무원',
  '대기업 공채',
] as const

export type CoachingDomain = (typeof COACHING_DOMAINS)[number]
