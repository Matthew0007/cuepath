import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { CalendarDays, MessageSquare, Star } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  pending: '결제 대기', requested: '승인 대기', confirmed: '예약 확정',
  completed: '완료', cancelled: '취소', refunded: '환불',
}
const STATUS_COLOR: Record<string, string> = {
  requested: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-[#EAF0F8] text-[#0A66C2]',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-gray-100 text-gray-400',
  refunded: 'bg-gray-100 text-gray-400',
  pending: 'bg-gray-100 text-gray-400',
}

function fmtKST(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

export default async function SessionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id, status, price, duration_minutes, scheduled_at, created_at,
      coach_id, coachee_id,
      coaches!inner(profiles!inner(full_name)),
      profiles!sessions_coachee_id_fkey!inner(full_name),
      reviews(id),
      chat_rooms(id, is_active)
    `)
    .or(`coach_id.eq.${user!.id},coachee_id.eq.${user!.id}`)
    .order('created_at', { ascending: false })

  const active = (sessions ?? []).filter((s) => ['requested','confirmed'].includes(s.status))
  const past = (sessions ?? []).filter((s) => !['requested','confirmed'].includes(s.status))

  function SessionCard({ session }: { session: typeof sessions extends (infer T)[] | null ? T : never }) {
    if (!session) return null
    const isCoach = session.coach_id === user!.id
    const coachProfile = Array.isArray(session.coaches?.profiles) ? session.coaches.profiles[0] : session.coaches?.profiles
    const coacheeProfile = Array.isArray(session.profiles) ? session.profiles[0] : session.profiles
    const otherName = isCoach ? (coacheeProfile?.full_name ?? '의뢰인') : (coachProfile?.full_name ?? '컨설턴트')
    const hasReview = Array.isArray(session.reviews) ? session.reviews.length > 0 : !!session.reviews
    const canReview = !isCoach && session.status === 'completed' && !hasReview
    const chatRoom = Array.isArray(session.chat_rooms) ? session.chat_rooms[0] : session.chat_rooms
    const canChat = session.status === 'confirmed' && chatRoom?.is_active

    return (
      <div className="bg-white rounded-xl border border-black/10 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {/* 아이콘 */}
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5',
              session.status === 'confirmed' ? 'bg-[#EAF0F8]' :
              session.status === 'requested' ? 'bg-yellow-50' :
              session.status === 'completed' ? 'bg-green-50' : 'bg-gray-100',
            )}>
              <CalendarDays className={cn('w-4 h-4',
                session.status === 'confirmed' ? 'text-[#0A66C2]' :
                session.status === 'requested' ? 'text-yellow-500' :
                session.status === 'completed' ? 'text-green-600' : 'text-gray-400',
              )} />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-900 text-sm">{otherName}</p>
                <span className="text-xs text-gray-400">{isCoach ? '의뢰인' : '컨설턴트'}</span>
              </div>
              {session.scheduled_at && (
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {fmtKST(session.scheduled_at)} · {session.duration_minutes}분
                </p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLOR[session.status] ?? 'bg-gray-100 text-gray-500')}>
                  {STATUS_LABEL[session.status] ?? session.status}
                </span>
                <span className="text-xs text-gray-500">{session.price.toLocaleString()}원</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canChat && (
              <Link
                href={`/chat/${chatRoom.id}`}
                className="flex items-center gap-1.5 bg-[#0A66C2] text-white text-xs font-medium px-3 py-1.5 rounded-full hover:bg-[#004182] transition-colors"
              >
                <MessageSquare className="w-3 h-3" />
                채팅 입장
              </Link>
            )}
            {!isCoach && session.status === 'requested' && (
              <span className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-full">
                컨설턴트 승인 대기
              </span>
            )}
            {canReview && (
              <Link
                href={`/sessions/${session.id}/review`}
                className="flex items-center gap-1 border border-[#0A66C2] text-[#0A66C2] text-xs font-medium px-3 py-1.5 rounded-full hover:bg-[#EAF0F8] transition-colors"
              >
                <Star className="w-3 h-3" />
                후기 작성
              </Link>
            )}
            {hasReview && <span className="text-xs text-gray-400">후기 완료</span>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-black/10 shadow-sm px-5 py-4">
        <h1 className="font-semibold text-gray-900">내 세션</h1>
        <p className="text-xs text-gray-500 mt-0.5">전체 {(sessions ?? []).length}건</p>
      </div>

      {(sessions ?? []).length === 0 ? (
        <div className="bg-white rounded-xl border border-black/10 shadow-sm py-16 text-center space-y-3">
          <CalendarDays className="w-10 h-10 text-gray-200 mx-auto" />
          <p className="text-gray-400 text-sm">세션 내역이 없습니다.</p>
          <Link href="/coaches" className="inline-block text-sm text-[#0A66C2] hover:underline">
            컨설턴트 찾아보기 →
          </Link>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">진행 중</p>
              {active.map((s) => <SessionCard key={s.id} session={s} />)}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">지난 세션</p>
              {past.map((s) => <SessionCard key={s.id} session={s} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}
