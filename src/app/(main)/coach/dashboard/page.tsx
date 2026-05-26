import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { CalendarDays, ChevronRight, Star, TrendingUp, Users, CheckCircle, XCircle } from 'lucide-react'
import { confirmSession, rejectSession } from '@/app/(main)/sessions/actions'

function fmtKST(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul', month: 'long', day: 'numeric',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

const STATUS_LABEL: Record<string, string> = {
  requested: '승인 대기', confirmed: '예약 확정', completed: '완료',
}
const STATUS_COLOR: Record<string, string> = {
  requested: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-blue-50 text-[#0A66C2]',
  completed: 'bg-green-50 text-green-700',
}

export default async function CoachDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'coach') redirect('/dashboard')

  const { data: coachRow } = await supabase
    .from('coaches')
    .select('is_approved, rating, review_count')
    .eq('id', user.id)
    .maybeSingle()

  if (!coachRow?.is_approved) {
    return (
      <div className="bg-white rounded-xl border border-black/10 shadow-sm p-8 text-center space-y-3">
        <div className="w-14 h-14 bg-yellow-50 rounded-full flex items-center justify-center mx-auto">
          <TrendingUp className="w-6 h-6 text-yellow-500" />
        </div>
        <p className="font-semibold text-gray-900">컨설턴트 심사 중입니다</p>
        <p className="text-sm text-gray-500">승인 완료 후 일정 관리와 세션 수락이 가능해집니다.</p>
      </div>
    )
  }

  // 통계
  const [
    { count: pendingCount },
    { count: confirmedCount },
    { count: completedCount },
    { data: upcomingSessions },
    { data: requestedSessions },
  ] = await Promise.all([
    supabase.from('sessions').select('id', { count: 'exact', head: true })
      .eq('coach_id', user.id).eq('status', 'requested'),
    supabase.from('sessions').select('id', { count: 'exact', head: true })
      .eq('coach_id', user.id).eq('status', 'confirmed'),
    supabase.from('sessions').select('id', { count: 'exact', head: true })
      .eq('coach_id', user.id).eq('status', 'completed'),
    supabase.from('sessions')
      .select(`id, status, scheduled_at, duration_minutes, profiles!sessions_coachee_id_fkey!inner(full_name)`)
      .eq('coach_id', user.id).eq('status', 'confirmed')
      .order('scheduled_at', { ascending: true }).limit(3),
    supabase.from('sessions')
      .select(`id, status, scheduled_at, duration_minutes, price, profiles!sessions_coachee_id_fkey!inner(full_name)`)
      .eq('coach_id', user.id).eq('status', 'requested')
      .order('created_at', { ascending: false }).limit(5),
  ])

  const stats = [
    { label: '승인 대기', value: pendingCount ?? 0, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: CalendarDays },
    { label: '예약 확정', value: confirmedCount ?? 0, color: 'text-[#0A66C2]', bg: 'bg-[#EAF0F8]', icon: CalendarDays },
    { label: '완료 세션', value: completedCount ?? 0, color: 'text-green-700', bg: 'bg-green-50', icon: TrendingUp },
    { label: '평점', value: coachRow.rating.toFixed(1), color: 'text-amber-600', bg: 'bg-amber-50', icon: Star },
  ]

  return (
    <div className="space-y-4">

      {/* 환영 카드 */}
      <div className="bg-white rounded-xl border border-black/10 shadow-sm p-5">
        <p className="text-lg font-semibold text-gray-900">
          안녕하세요, {profile?.full_name ?? user.email?.split('@')[0]}님 👋
        </p>
        <p className="text-sm text-gray-500 mt-1">오늘도 의뢰인의 커리어를 함께 이끌어주세요.</p>
        <div className="mt-4 flex gap-2">
          <Link
            href="/coach/schedule"
            className="inline-flex items-center gap-1.5 bg-[#0A66C2] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#004182] transition-colors"
          >
            일정 관리
          </Link>
          <Link
            href="/sessions"
            className="inline-flex items-center gap-1.5 border border-[#0A66C2] text-[#0A66C2] text-sm font-medium px-4 py-2 rounded-full hover:bg-[#EAF0F8] transition-colors"
          >
            세션 전체 보기
          </Link>
        </div>
      </div>

      {/* 통계 카드 4개 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-black/10 shadow-sm p-4">
            <div className={cn('w-9 h-9 rounded-full flex items-center justify-center mb-2', bg)}>
              <Icon className={cn('w-4 h-4', color)} />
            </div>
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* 승인 대기 요청 */}
      {(requestedSessions ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-black/10 shadow-sm">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-black/5">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">승인 대기 요청</p>
              {(pendingCount ?? 0) > 0 && (
                <span className="text-xs bg-yellow-400 text-white font-bold px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </div>
            <Link href="/sessions" className="text-xs text-[#0A66C2] hover:underline flex items-center gap-0.5">
              전체 보기 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-black/5">
            {(requestedSessions ?? []).map((s) => {
              const coacheeProfile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
              return (
                <div key={s.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{coacheeProfile?.full_name ?? '의뢰인'}</p>
                    {s.scheduled_at && (
                      <p className="text-xs text-gray-500 mt-0.5">{fmtKST(s.scheduled_at)} · {s.duration_minutes}분</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <form action={confirmSession.bind(null, s.id)}>
                      <button
                        type="submit"
                        className="flex items-center gap-1 bg-[#0A66C2] text-white text-xs font-medium px-3 py-1.5 rounded-full hover:bg-[#004182] transition-colors"
                      >
                        <CheckCircle className="w-3 h-3" />
                        수락
                      </button>
                    </form>
                    <form action={rejectSession.bind(null, s.id)}>
                      <button
                        type="submit"
                        className="flex items-center gap-1 border border-red-300 text-red-500 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <XCircle className="w-3 h-3" />
                        거부
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 예정 세션 */}
      {(upcomingSessions ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-black/10 shadow-sm">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <p className="font-semibold text-gray-900">예정된 세션</p>
            <Link href="/sessions" className="text-xs text-[#0A66C2] hover:underline flex items-center gap-0.5">
              전체 보기 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-black/5">
            {(upcomingSessions ?? []).map((s) => {
              const coacheeProfile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
              return (
                <div key={s.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#EAF0F8] flex items-center justify-center shrink-0">
                    <CalendarDays className="w-4 h-4 text-[#0A66C2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{coacheeProfile?.full_name ?? '의뢰인'}</p>
                    {s.scheduled_at && (
                      <p className="text-xs text-gray-500 mt-0.5">{fmtKST(s.scheduled_at)} · {s.duration_minutes}분</p>
                    )}
                  </div>
                  <span className="text-xs bg-blue-50 text-[#0A66C2] px-2 py-0.5 rounded-full shrink-0">확정</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
