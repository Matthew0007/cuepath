import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { confirmPayment } from '@/lib/payment/toss'

export async function POST(request: Request) {
  const { paymentKey, orderId, amount } = await request.json()

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // DB에서 결제 정보 검증 (금액 위변조 방지)
  const { data: payment } = await supabase
    .from('payments')
    .select('id, amount, status, session_id')
    .eq('toss_order_id', orderId)
    .single()

  if (!payment) {
    return NextResponse.json({ error: '결제 정보를 찾을 수 없습니다' }, { status: 404 })
  }
  if (payment.status === 'paid') {
    return NextResponse.json({ error: '이미 처리된 결제입니다' }, { status: 409 })
  }
  if (payment.amount !== amount) {
    return NextResponse.json({ error: '결제 금액 불일치' }, { status: 400 })
  }

  // 토스 최종 승인
  try {
    await confirmPayment({ paymentKey, orderId, amount })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '결제 승인 실패'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000) // +60분

  // 트랜잭션: payment 확정 + session 확정 + chat_room 생성
  const [{ error: payErr }, { error: sessionErr }, { data: room, error: roomErr }] =
    await Promise.all([
      supabase
        .from('payments')
        .update({ status: 'paid', toss_payment_key: paymentKey, paid_at: now.toISOString() })
        .eq('id', payment.id),
      supabase
        .from('sessions')
        .update({ status: 'confirmed' })
        .eq('id', payment.session_id),
      supabase
        .from('chat_rooms')
        .insert({ session_id: payment.session_id, expires_at: expiresAt.toISOString() })
        .select('id')
        .single(),
    ])

  if (payErr || sessionErr || roomErr) {
    console.error('DB 업데이트 실패', { payErr, sessionErr, roomErr })
    return NextResponse.json({ error: 'DB 업데이트 실패' }, { status: 500 })
  }

  return NextResponse.json({ roomId: room!.id })
}
