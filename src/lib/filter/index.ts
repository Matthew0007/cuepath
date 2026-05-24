import { runPatternFilter } from './patterns'
import { classifyContactIntent } from './llm'

const LLM_THRESHOLD = 0.3

export interface MessageFilterResult {
  blocked: boolean
  reason?: string
}

// 텍스트 메시지 필터 (1→2→3층)
export async function filterText(text: string): Promise<MessageFilterResult> {
  // 1·2층: 정규식 + 우회 사전
  const patternResult = runPatternFilter(text)
  if (patternResult.blocked) {
    return { blocked: true, reason: patternResult.reason }
  }

  // 3층: 의심도가 임계값 이상일 때만 LLM 호출 (비용 통제)
  if (patternResult.suspicionScore >= LLM_THRESHOLD) {
    try {
      const score = await classifyContactIntent(text)
      if (score >= LLM_THRESHOLD) {
        return { blocked: true, reason: 'AI 연락처 교환 의도 감지' }
      }
    } catch {
      // LLM 오류 시 통과 (가용성 우선)
    }
  }

  return { blocked: false }
}

// 이미지 메시지 필터 (4층: OCR → 1·2층 재실행)
export async function filterImage(base64Image: string): Promise<MessageFilterResult> {
  const { extractTextFromImage } = await import('@/lib/ocr/vision')
  const extractedText = await extractTextFromImage(base64Image)

  if (!extractedText.trim()) return { blocked: false }

  const patternResult = runPatternFilter(extractedText)
  if (patternResult.blocked) {
    return { blocked: true, reason: `이미지 내 ${patternResult.reason}` }
  }

  return { blocked: false }
}
