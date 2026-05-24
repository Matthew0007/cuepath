// 1층: 정규식 패턴 직접 탐지
// 2층: 한글 숫자·우회 표현 정규화 후 재탐지

const PHONE_RE =
  /(\b01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}\b)|(\b\d{2,3}[-\s.]?\d{3,4}[-\s.]?\d{4}\b)/

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+\s*@\s*[a-zA-Z0-9.\-]+\s*\.\s*[a-zA-Z]{2,}/

const SNS_RE =
  /(카카오톡?\s*(아이디|id)?[:：]?\s*\S+)|(카톡\s*[:：]?\s*\S+)|(라인\s*(id)?[:：]?\s*\S+)|(인스타\s*(그램)?\s*(id)?[:：]?\s*\S+)|(@[a-zA-Z0-9_]{2,})/i

const URL_RE = /(https?:\/\/|www\.)\S+/i

// 한글 숫자 → 아라비아 숫자 변환 테이블
const KO_DIGIT: Record<string, string> = {
  영: '0', 공: '0',
  일: '1', 하나: '1', 한: '1',
  이: '2', 둘: '2', 두: '2',
  삼: '3', 셋: '3', 세: '3',
  사: '4', 넷: '4', 네: '4',
  오: '5', 다섯: '5',
  육: '6', 여섯: '6',
  칠: '7', 일곱: '7',
  팔: '8', 여덟: '8',
  구: '9', 아홉: '9',
}

// 우회 표현 정규화
function normalize(text: string): string {
  let result = text

  // 한글 숫자를 아라비아 숫자로
  for (const [ko, num] of Object.entries(KO_DIGIT)) {
    result = result.replace(new RegExp(ko, 'g'), num)
  }

  // 자음·모음 분리 패딩 제거 (ㅋ, ㅎ 등 조음 접미 제거)
  result = result.replace(/[ㄱ-ㅎㅏ-ㅣ]/g, '')

  // 공백·특수문자 제거 후 숫자만 붙이기 (01O → 010 등)
  result = result
    .replace(/[Oo]/g, '0')       // O → 0
    .replace(/[lI|]/g, '1')      // l/I → 1
    .replace(/\s+/g, ' ')
    .trim()

  return result
}

export interface FilterResult {
  blocked: boolean
  reason?: string
  suspicionScore: number // 0~1 (LLM 호출 여부 판단용)
}

export function runPatternFilter(text: string): FilterResult {
  // 1층: 원문 검사
  if (PHONE_RE.test(text))  return { blocked: true, reason: '전화번호 감지', suspicionScore: 1 }
  if (EMAIL_RE.test(text))  return { blocked: true, reason: '이메일 감지', suspicionScore: 1 }
  if (SNS_RE.test(text))    return { blocked: true, reason: 'SNS 연락처 감지', suspicionScore: 1 }
  if (URL_RE.test(text))    return { blocked: true, reason: '외부 URL 감지', suspicionScore: 1 }

  // 2층: 정규화 후 재검사
  const norm = normalize(text)
  if (PHONE_RE.test(norm))  return { blocked: true, reason: '우회 전화번호 감지', suspicionScore: 1 }
  if (EMAIL_RE.test(norm))  return { blocked: true, reason: '우회 이메일 감지', suspicionScore: 1 }
  if (SNS_RE.test(norm))    return { blocked: true, reason: '우회 SNS 연락처 감지', suspicionScore: 1 }

  // 의심 키워드 (LLM 판단 필요 수준)
  const suspiciousTerms = ['연락처', '번호 알려', '번호 줄게', '개인톡', '디엠', 'dm', '문자 해', '따로 연락']
  const hasSuspicious = suspiciousTerms.some((t) =>
    text.toLowerCase().includes(t)
  )

  return {
    blocked: false,
    suspicionScore: hasSuspicious ? 0.4 : 0,
  }
}
