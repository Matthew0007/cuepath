'use client'

import { useState } from 'react'
import { loadTossPayments } from '@tosspayments/tosspayments-sdk'
import { Button } from '@/components/ui/button'
import { createSessionForPayment } from '@/app/(main)/booking/actions'

interface PaymentButtonProps {
  coachId: string
  coachName: string
  amount: number
  customerKey: string   // 로그인 사용자 ID
}

export function PaymentButton({ coachId, coachName, amount, customerKey }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setLoading(true)
    setError(null)

    try {
      // 서버에서 session + payment row 생성
      const result = await createSessionForPayment(coachId)
      if ('error' in result) {
        setError(result.error)
        return
      }

      // 결제창 호출
      const tossPayments = await loadTossPayments(
        process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!
      )
      const payment = tossPayments.payment({ customerKey })
      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: result.amount },
        orderId: result.orderId,
        orderName: `${coachName} 코칭 세션 (60분)`,
        successUrl: `${window.location.origin}/booking/success`,
        failUrl: `${window.location.origin}/booking/fail`,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      // 사용자가 결제창 직접 닫은 경우 조용히 무시
      if (!msg.includes('PAY_PROCESS_CANCELED')) setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button onClick={handlePay} disabled={loading} className="w-full" size="lg">
        {loading ? '처리 중...' : `${amount.toLocaleString()}원 결제하기`}
      </Button>
    </div>
  )
}
