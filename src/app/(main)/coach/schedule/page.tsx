import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ScheduleManager } from '@/components/coach/ScheduleManager'

export default async function CoachSchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach } = await supabase
    .from('coaches')
    .select('id')
    .eq('id', user.id)
    .eq('is_approved', true)
    .single()

  if (!coach) redirect('/dashboard')

  // 반복 가용성 규칙
  const { data: availability } = await supabase
    .from('coach_availability')
    .select('id, day_of_week, time_hhmm')
    .eq('coach_id', user.id)
    .order('day_of_week')
    .order('time_hhmm')

  // 향후 + 최근 과거 세션 (캘린더 표시용)
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id, scheduled_at, status, duration_minutes, price,
      profiles!sessions_coachee_id_fkey!inner(full_name)
    `)
    .eq('coach_id', user.id)
    .in('status', ['pending', 'requested', 'confirmed'])
    .gte('scheduled_at', from)
    .order('scheduled_at', { ascending: true })

  const mappedSessions = (sessions ?? []).map((s) => {
    const p = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
    return {
      id: s.id,
      scheduled_at: s.scheduled_at ?? '',
      status: s.status,
      duration_minutes: s.duration_minutes,
      price: s.price,
      coacheeName: p?.full_name ?? '의뢰인',
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">내 캘린더 관리</h1>
        <p className="text-sm text-gray-500 mt-1">반복 가용 일정을 설정하고 예약 요청을 관리합니다.</p>
      </div>
      <ScheduleManager
        availability={availability ?? []}
        sessions={mappedSessions}
      />
    </div>
  )
}
