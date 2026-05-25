'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function SuccessContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey')
    const orderId = searchParams.get('orderId')
    const amount = searchParams.get('amount')

    if (!paymentKey || !orderId || !amount) {
      setErrorMsg('잘못된 접근입니다.')
      setStatus('error')
      return
    }

    fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount: parseInt(amount, 10) }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.sessionId) {
          setStatus('done')
        } else {
          setErrorMsg(data.error ?? '결제 확인 실패')
          setStatus('error')
        }
      })
      .catch(() => { setErrorMsg('네트워크 오류'); setStatus('error') })
  }, [searchParams])

  if (status === 'loading') {
    return (
      <div className="text-center space-y-2">
        <div className="text-4xl animate-pulse">⏳</div>
        <p className="text-gray-600">결제 확인 중...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="text-center space-y-4">
        <p className="text-red-500">{errorMsg}</p>
        <Link href="/dashboard" className="text-sm underline text-gray-500">
          대시보드로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="text-center space-y-6 max-w-sm">
      <div className="text-5xl">✅</div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">결제 완료!</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          예약 요청이 접수되었습니다.<br />
          컨설턴트가 승인하면 예약이 확정되고<br />
          채팅방이 예약 시간에 자동으로 열립니다.
        </p>
      </div>
      <Link href="/sessions" className={cn(buttonVariants(), 'w-full')}>
        내 세션 보기
      </Link>
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
