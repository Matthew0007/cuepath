'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey')
    const orderId = searchParams.get('orderId')
    const amount = searchParams.get('amount')

    if (!paymentKey || !orderId || !amount) {
      setError('잘못된 접근입니다.')
      return
    }

    fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: parseInt(amount, 10),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.roomId) {
          router.replace(`/chat/${data.roomId}`)
        } else {
          setError(data.error ?? '결제 확인 실패')
        }
      })
      .catch(() => setError('네트워크 오류'))
  }, [searchParams, router])

  if (error) {
    return (
      <div className="text-center space-y-4">
        <p className="text-red-500">{error}</p>
        <a href="/dashboard" className="text-sm underline text-gray-500">
          대시보드로 돌아가기
        </a>
      </div>
    )
  }

  return (
    <div className="text-center space-y-2">
      <div className="text-4xl animate-pulse">⏳</div>
      <p className="text-gray-600">결제 확인 중...</p>
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Suspense>
        <SuccessContent />
      </Suspense>
    </div>
  )
}
