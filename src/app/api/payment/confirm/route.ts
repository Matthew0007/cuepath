import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { confirmPayment } from '@/lib/payment/toss'

export async function POST(request: Request) {
  const { paymentKey, orderId, amount } = await request.json()

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // DB 금액 검증
  const { data: payment } = await supabase
    .from('payments')
    .select('id, amount, status, session_id')
    .eq('toss_order_id', orderId)
    .single()

  if (!payment) return NextResponse.json({ error: '결제 정보를 찾을 수 없습니다' }, { status: 404 })
  if (payment.status === 'paid') return NextResponse.json({ error: '이미 처리된 결제입니다' }, { status: 409 })
  if (payment.amount !== amount) return NextResponse.json({ error: '결제 금액 불일치' }, { status: 400 })

  // 세션에 연결된 슬롯 조회
  const { data: session } = await supabase
    .from('sessions')
    .select('slot_id')
    .eq('id', payment.session_id)
    .single()

  // 토스 최종 승인
  try {
    await confirmPayment({ paymentKey, orderId, amount })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '결제 승인 실패'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // 결제 확정 + 세션 → requested (컨설턴트 승인 대기)
  const [{ error: payErr }, { error: sessionErr }] = await Promise.all([
    supabase
      .from('payments')
      .update({ status: 'paid', toss_payment_key: paymentKey, paid_at: new Date().toISOString() })
      .eq('id', payment.id),
    supabase
      .from('sessions')
      .update({ status: 'requested' })
      .eq('id', payment.session_id),
  ])

  if (payErr || sessionErr) {
    console.error('DB 업데이트 실패', { payErr, sessionErr })
    return NextResponse.json({ error: 'DB 업데이트 실패' }, { status: 500 })
  }

  // 슬롯 booked 처리
  if (session?.slot_id) {
    await supabase.from('coach_slots').update({ status: 'booked' }).eq('id', session.slot_id)
  }

  return NextResponse.json({ sessionId: payment.session_id })
}
