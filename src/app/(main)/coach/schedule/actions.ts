'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getApprovedCoach() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach } = await supabase
    .from('coaches')
    .select('id')
    .eq('id', user.id)
    .eq('is_approved', true)
    .single()

  return { supabase, user, coach }
}

export async function addSlot(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const { supabase, user, coach } = await getApprovedCoach()
  if (!coach) return { error: '승인된 컨설턴트만 슬롯을 등록할 수 있습니다.' }

  const date = formData.get('date') as string
  const time = formData.get('time') as string
  if (!date || !time) return { error: '날짜와 시간을 입력해주세요.' }

  // KST 기준 입력 → UTC 변환
  const startAt = new Date(`${date}T${time}:00+09:00`)
  if (isNaN(startAt.getTime())) return { error: '유효하지 않은 날짜/시간입니다.' }
  if (startAt < new Date()) return { error: '과거 시간은 등록할 수 없습니다.' }

  const { error } = await supabase.from('coach_slots').insert({
    coach_id: user.id,
    start_at: startAt.toISOString(),
  })

  if (error) {
    if (error.code === '23505') return { error: '이미 같은 시간에 슬롯이 있습니다.' }
    return { error: error.message }
  }

  revalidatePath('/coach/schedule')
  return {}
}

export async function removeSlot(slotId: string): Promise<void> {
  const { supabase, user, coach } = await getApprovedCoach()
  if (!coach) return

  await supabase
    .from('coach_slots')
    .delete()
    .eq('id', slotId)
    .eq('coach_id', user.id)
    .eq('status', 'available')

  revalidatePath('/coach/schedule')
}

export async function approveSession(sessionId: string): Promise<void> {
  const { supabase, user, coach } = await getApprovedCoach()
  if (!coach) return

  const { data: session } = await supabase
    .from('sessions')
    .select('id, scheduled_at, duration_minutes')
    .eq('id', sessionId)
    .eq('coach_id', user.id)
    .eq('status', 'requested')
    .single()

  if (!session) return

  await supabase.from('sessions').update({ status: 'confirmed' }).eq('id', sessionId)

  // 예약 시간이 이미 지났으면 즉시 채팅방 오픈
  if (session.scheduled_at && new Date(session.scheduled_at) <= new Date()) {
    const expiresAt = new Date(
      Date.now() + session.duration_minutes * 60 * 1000
    ).toISOString()
    await supabase.from('chat_rooms').insert({ session_id: sessionId, expires_at: expiresAt })
  }

  revalidatePath('/coach/schedule')
  revalidatePath('/sessions')
}

export async function rejectSession(sessionId: string): Promise<void> {
  const { supabase, user, coach } = await getApprovedCoach()
  if (!coach) return

  const { data: session } = await supabase
    .from('sessions')
    .select('slot_id')
    .eq('id', sessionId)
    .eq('coach_id', user.id)
    .eq('status', 'requested')
    .single()

  if (!session) return

  await supabase.from('sessions').update({ status: 'cancelled' }).eq('id', sessionId)

  if (session.slot_id) {
    await supabase.from('coach_slots').update({ status: 'available' }).eq('id', session.slot_id)
  }

  revalidatePath('/coach/schedule')
  revalidatePath('/sessions')
}
