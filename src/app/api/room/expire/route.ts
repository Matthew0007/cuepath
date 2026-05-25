import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Vercel Cron이 매 분 호출 — Authorization: Bearer <CRON_SECRET>
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  // 1. 만료된 채팅방 비활성화
  const { data: expired } = await supabase
    .from('chat_rooms')
    .update({ is_active: false })
    .eq('is_active', true)
    .lte('expires_at', now)
    .select('id, session_id')

  if (expired && expired.length > 0) {
    await supabase
      .from('sessions')
      .update({ status: 'completed' })
      .in('id', expired.map((r) => r.session_id))
  }

  // 2. confirmed 세션 중 scheduled_at에 도달했고 채팅방이 없는 경우 → 채팅방 오픈
  const { data: readySessions } = await supabase
    .from('sessions')
    .select('id, scheduled_at, duration_minutes')
    .eq('status', 'confirmed')
    .lte('scheduled_at', now)

  let opened = 0
  if (readySessions && readySessions.length > 0) {
    for (const session of readySessions) {
      // 이미 채팅방이 있는지 확인
      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('session_id', session.id)
        .maybeSingle()

      if (!existingRoom && session.scheduled_at) {
        const expiresAt = new Date(
          new Date(session.scheduled_at).getTime() + session.duration_minutes * 60 * 1000
        ).toISOString()

        await supabase
          .from('chat_rooms')
          .insert({ session_id: session.id, expires_at: expiresAt })

        opened++
      }
    }
  }

  return NextResponse.json({
    expired: expired?.length ?? 0,
    opened,
  })
}
