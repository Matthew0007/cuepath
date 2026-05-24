'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// 결제 시작 전 session + payment row 생성, orderId 반환
export async function createSessionForPayment(coachId: string): Promise<
  { orderId: string; amount: number } | { error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 코치 정보 확인
  const { data: coach } = await supabase
    .from('coaches')
    .select('hourly_rate, is_approved')
    .eq('id', coachId)
    .single()

  if (!coach?.is_approved) return { error: '승인되지 않은 코치입니다.' }
  if (user.id === coachId) return { error: '본인 세션은 예약할 수 없습니다.' }

  // session 생성
  const { data: session, error: sessionErr } = await supabase
    .from('sessions')
    .insert({
      coach_id: coachId,
      coachee_id: user.id,
      price: coach.hourly_rate,
      duration_minutes: 60,
      status: 'pending',
    })
    .select('id')
    .single()

  if (sessionErr || !session) return { error: '세션 생성 실패' }

  // orderId = session.id 를 그대로 사용 (UUID, Toss 조건 충족)
  const { error: paymentErr } = await supabase
    .from('payments')
    .insert({
      session_id: session.id,
      user_id: user.id,
      amount: coach.hourly_rate,
      status: 'pending',
      toss_order_id: session.id,
    })

  if (paymentErr) return { error: '결제 정보 생성 실패' }

  return { orderId: session.id, amount: coach.hourly_rate }
}
