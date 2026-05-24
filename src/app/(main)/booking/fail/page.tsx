'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'

function FailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const message = searchParams.get('message') ?? '결제가 취소되었습니다.'

  return (
    <div className="text-center space-y-4">
      <div className="text-4xl">❌</div>
      <h2 className="text-xl font-semibold">결제 실패</h2>
      <p className="text-sm text-gray-500">{message}</p>
      <div className="flex gap-2 justify-center">
        <Button variant="outline" onClick={() => router.back()}>
          다시 시도
        </Button>
        <Button variant="ghost" onClick={() => router.push('/coaches')}>
          코치 목록으로
        </Button>
      </div>
    </div>
  )
}

export default function BookingFailPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Suspense>
        <FailContent />
      </Suspense>
    </div>
  )
}
