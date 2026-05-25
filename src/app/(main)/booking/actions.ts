'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SESSION_OPTIONS } from '@/lib/constants'

export async function createSessionForPayment(
  coachId: string,
  dateStr: string,       // YYYY-MM-DD (KST)
  timeHhmm: string,      // HH:MM (KST)
  durationMinutes: number,
  amount: number,
): Promise<{ orderId: string; amount: number } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 금액 검증 (클라이언트 위변조 방지)
  const validOption = SESSION_OPTIONS.find(
    (o) => o.duration === durationMinutes && o.userPrice === amount
  )
  if (!validOption) return { error: '유효하지 않은 결제 금액입니다.' }

  // 코치 확인
  const { data: coach } = await supabase
    .from('coaches')
    .select('is_approved')
    .eq('id', coachId)
    .single()

  if (!coach?.is_approved) return { error: '승인되지 않은 컨설턴트입니다.' }
  if (user.id === coachId) return { error: '본인 세션은 예약할 수 없습니다.' }

  // KST → UTC
  const scheduledAt = new Date(`${dateStr}T${timeHhmm}:00+09:00`).toISOString()

  // 요일 확인 (KST 기준)
  const dayOfWeek = new Date(`${dateStr}T12:00:00+09:00`).getUTCDay()

  // 가용성 규칙 확인
  const { data: rule } = await supabase
    .from('coach_availability')
    .select('id')
    .eq('coach_id', coachId)
    .eq('day_of_week', dayOfWeek)
    .eq('time_hhmm', timeHhmm)
    .maybeSingle()

  if (!rule) return { error: '해당 시간은 컨설턴트의 가용 일정이 아닙니다.' }

  // 이미 예약된 세션 확인
  const { data: existing } = await supabase
    .from('sessions')
    .select('id')
    .eq('coach_id', coachId)
    .eq('scheduled_at', scheduledAt)
    .in('status', ['pending', 'requested', 'confirmed'])
    .maybeSingle()

  if (existing) return { error: '이미 예약된 시간입니다.' }

  // 슬롯 조회 또는 생성
  let slotId: string
  const { data: existingSlot } = await supabase
    .from('coach_slots')
    .select('id, status')
    .eq('coach_id', coachId)
    .eq('start_at', scheduledAt)
    .maybeSingle()

  if (existingSlot) {
    if (existingSlot.status !== 'available') return { error: '이미 예약된 슬롯입니다.' }
    slotId = existingSlot.id
  } else {
    const { data: newSlot, error: slotErr } = await supabase
      .from('coach_slots')
      .insert({ coach_id: coachId, start_at: scheduledAt })
      .select('id')
      .single()
    if (slotErr || !newSlot) return { error: '슬롯 생성에 실패했습니다.' }
    slotId = newSlot.id
  }

  // 세션 생성
  const { data: session, error: sessionErr } = await supabase
    .from('sessions')
    .insert({
      coach_id: coachId,
      coachee_id: user.id,
      price: amount,
      duration_minutes: durationMinutes,
      status: 'pending',
      slot_id: slotId,
      scheduled_at: scheduledAt,
    })
    .select('id')
    .single()

  if (sessionErr || !session) return { error: '세션 생성에 실패했습니다.' }

  // 결제 row 생성
  const { error: paymentErr } = await supabase
    .from('payments')
    .insert({
      session_id: session.id,
      user_id: user.id,
      amount,
      status: 'pending',
      toss_order_id: session.id,
    })

  if (paymentErr) return { error: '결제 정보 생성에 실패했습니다.' }

  return { orderId: session.id, amount }
}
