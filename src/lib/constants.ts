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
