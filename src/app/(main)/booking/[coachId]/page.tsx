import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PaymentButton } from '@/components/booking/PaymentButton'

interface BookingPageProps {
  params: Promise<{ coachId: string }>
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { coachId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: coach } = await supabase
    .from('coaches')
    .select(`
      id,
      hourly_rate,
      domains,
      profiles!inner(full_name)
    `)
    .eq('id', coachId)
    .eq('is_approved', true)
    .single()

  if (!coach) notFound()

  const profile = Array.isArray(coach.profiles) ? coach.profiles[0] : coach.profiles
  const coachName = profile?.full_name ?? '코치'

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">세션 예약</h1>

      {/* 예약 요약 */}
      <div className="bg-white rounded-xl border divide-y">
        <div className="px-5 py-4 flex justify-between">
          <span className="text-gray-500">코치</span>
          <span className="font-medium">{coachName}</span>
        </div>
        <div className="px-5 py-4 flex justify-between">
          <span className="text-gray-500">도메인</span>
          <span className="text-sm">{coach.domains.join(', ')}</span>
        </div>
        <div className="px-5 py-4 flex justify-between">
          <span className="text-gray-500">세션 시간</span>
          <span>60분</span>
        </div>
        <div className="px-5 py-4 flex justify-between">
          <span className="text-gray-500 font-medium">결제 금액</span>
          <span className="font-semibold text-lg">
            {coach.hourly_rate.toLocaleString()}원
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-400">
        결제 완료 후 즉시 채팅방이 열립니다. 채팅방은 60분 후 자동으로 만료됩니다.
      </p>

      <PaymentButton
        coachId={coachId}
        coachName={coachName}
        amount={coach.hourly_rate}
        customerKey={user!.id}
      />
    </div>
  )
}
