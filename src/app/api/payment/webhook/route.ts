import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 토스페이먼츠 웹훅 — 결제 상태 동기화 (보조 수단)
// 주된 처리는 /api/payment/confirm 에서 수행
export async function POST(request: Request) {
  const body = await request.json()
  const { eventType, data } = body

  if (eventType !== 'PAYMENT_STATUS_CHANGED') {
    return NextResponse.json({ ok: true })
  }

  const { orderId, status, paymentKey } = data
  if (!orderId || !status) {
    return NextResponse.json({ error: '잘못된 웹훅' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 취소 이벤트만 웹훅으로 처리 (confirm은 API에서 처리됨)
  if (status === 'CANCELED') {
    await supabase
      .from('payments')
      .update({ status: 'cancelled' })
      .eq('toss_order_id', orderId)
      .eq('toss_payment_key', paymentKey)
  }

  return NextResponse.json({ ok: true })
}
