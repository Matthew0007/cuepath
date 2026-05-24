import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

// 0.0(무해) ~ 1.0(명백한 연락처 교환 시도) 반환
export async function classifyContactIntent(text: string): Promise<number> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 10,
    messages: [
      {
        role: 'user',
        content: `다음 채팅 메시지가 외부 연락처(전화번호·이메일·SNS 등)를 교환하려는 의도인지 0.0~1.0 사이의 숫자만 응답하세요.
0.0 = 전혀 없음, 1.0 = 명백한 연락처 교환 시도.

메시지: """${text}"""

숫자만:`,
      },
    ],
  })

  const raw = (response.content[0] as { type: string; text: string }).text.trim()
  const score = parseFloat(raw)
  return isNaN(score) ? 0 : Math.min(1, Math.max(0, score))
}
