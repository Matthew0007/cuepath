import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookingForm } from '@/components/booking/BookingForm'

interface BookingPageProps {
  params: Promise<{ coachId: string }>
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { coachId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach } = await supabase
    .from('coaches')
    .select(`id, domains, profiles!inner(full_name)`)
    .eq('id', coachId)
    .eq('is_approved', true)
    .single()

  if (!coach) notFound()

  const profile = Array.isArray(coach.profiles) ? coach.profiles[0] : coach.profiles
  const coachName = profile?.full_name ?? '컨설턴트'

  // 컨설턴트 가용 요일·시간 규칙
  const { data: availability } = await supabase
    .from('coach_availability')
    .select('day_of_week, time_hhmm')
    .eq('coach_id', coachId)
    .order('day_of_week')
    .order('time_hhmm')

  // 이미 예약된 세션의 scheduled_at (중복 예약 방지)
  const { data: bookedSessions } = await supabase
    .from('sessions')
    .select('scheduled_at')
    .eq('coach_id', coachId)
    .in('status', ['pending', 'requested', 'confirmed'])
    .gte('scheduled_at', new Date().toISOString())

  const bookedDatetimes = (bookedSessions ?? [])
    .map((s) => s.scheduled_at)
    .filter(Boolean) as string[]

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">세션 예약</h1>
        <p className="text-sm text-gray-500 mt-1">{coachName} 컨설턴트</p>
      </div>

      <BookingForm
        coachId={coachId}
        coachName={coachName}
        availability={availability ?? []}
        bookedDatetimes={bookedDatetimes}
        userId={user.id}
      />
    </div>
  )
}
