import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: 최근 알림 목록 + 안읽은 수
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, title, body, link, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const unreadCount = (notifications ?? []).filter((n) => !n.is_read).length

  return NextResponse.json({ notifications: notifications ?? [], unreadCount })
}

// POST: 전체 읽음 처리
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return NextResponse.json({ ok: true })
}
