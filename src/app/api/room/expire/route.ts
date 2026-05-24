import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Vercel Cron이 매 분 호출 — Authorization: Bearer <CRON_SECRET>
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: expired, error } = await supabase
    .from('chat_rooms')
    .update({ is_active: false })
    .eq('is_active', true)
    .lte('expires_at', new Date().toISOString())
    .select('id, session_id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (expired && expired.length > 0) {
    await supabase
      .from('sessions')
      .update({ status: 'completed' })
      .in('id', expired.map((r) => r.session_id))
  }

  return NextResponse.json({ expired: expired?.length ?? 0 })
}
