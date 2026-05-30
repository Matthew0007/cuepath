import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { feature, anonymous_id } = body as { feature?: string; anonymous_id?: string }

    if (!feature || !['salary_calculator', 'career_consulting'].includes(feature)) {
      return NextResponse.json({ error: 'Invalid feature' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // feature_interests 테이블은 마이그레이션 후 types 재생성 전까지 any 캐스팅
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('feature_interests').insert({
      feature,
      user_id:      user?.id ?? null,
      anonymous_id: anonymous_id ?? null,
      referrer:     request.headers.get('referer')     ?? null,
      user_agent:   request.headers.get('user-agent')  ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    // 추적 실패 시 사용자 경험에 영향 없도록 200 반환
    return NextResponse.json({ ok: false })
  }
}
