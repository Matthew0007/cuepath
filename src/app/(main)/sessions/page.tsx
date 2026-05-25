import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STATUS_LABEL: Record<string, string> = {
  pending:   '결제 대기',
  requested: '승인 대기',
  confirmed: '예약 확정',
  completed: '완료',
  cancelled: '취소',
  refunded:  '환불',
}

const STATUS_COLOR: Record<string, string> = {
  requested: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  refunded:  'bg-gray-100 text-gray-500',
  pending:   'bg-gray-100 text-gray-500',
}

function fmtKST(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: 'long', day: 'numeric',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

export default async function SessionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id,
      status,
      price,
      duration_minutes,
      scheduled_at,
      created_at,
      coach_id,
      coachee_id,
      coaches!inner(
        profiles!inner(full_name)
      ),
      profiles!sessions_coachee_id_fkey!inner(full_name),
      reviews(id),
      chat_rooms(id, is_active)
    `)
    .or(`coach_id.eq.${user!.id},coachee_id.eq.${user!.id}`)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">내 세션</h1>

      {sessions && sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isCoach = session.coach_id === user!.id
            const coachProfile = Array.isArray(session.coaches?.profiles)
              ? session.coaches.profiles[0]
              : session.coaches?.profiles
            const coacheeProfile = Array.isArray(session.profiles)
              ? session.profiles[0]
              : session.profiles

            const otherName = isCoach
              ? (coacheeProfile?.full_name ?? '의뢰인')
              : (coachProfile?.full_name ?? '컨설턴트')

            const hasReview = Array.isArray(session.reviews)
              ? session.reviews.length > 0
              : !!session.reviews

            const canReview = !isCoach && session.status === 'completed' && !hasReview

            // 채팅방이 활성 상태인지 확인
            const chatRoom = Array.isArray(session.chat_rooms)
              ? session.chat_rooms[0]
              : session.chat_rooms
            const canChat = session.status === 'confirmed' && chatRoom?.is_active

            return (
              <div key={session.id} className="bg-white rounded-xl border p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <p className="font-medium">{otherName}</p>

                    {/* 예약 일시 */}
                    {session.scheduled_at && (
                      <p className="text-sm text-gray-600">
                        📅 {fmtKST(session.scheduled_at)} · {session.duration_minutes}분
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        STATUS_COLOR[session.status] ?? 'bg-gray-100 text-gray-600',
                      )}>
                        {STATUS_LABEL[session.status] ?? session.status}
                      </span>
                      <span>{session.price.toLocaleString()}원</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* 채팅방 입장 */}
                    {canChat && (
                      <Link
                        href={`/chat/${chatRoom.id}`}
                        className={cn(buttonVariants({ size: 'sm' }))}
                      >
                        채팅방 입장
                      </Link>
                    )}

                    {/* 승인 대기 안내 (의뢰인) */}
                    {!isCoach && session.status === 'requested' && (
                      <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg">
                        컨설턴트 승인 대기 중
                      </span>
                    )}

                    {/* 후기 */}
                    {canReview && (
                      <Link
                        href={`/sessions/${session.id}/review`}
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                      >
                        후기 작성
                      </Link>
                    )}
                    {hasReview && (
                      <span className="text-xs text-gray-400">후기 완료</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p>세션 내역이 없습니다.</p>
          <Link href="/coaches" className="text-sm underline mt-2 inline-block">
            컨설턴트 찾아보기
          </Link>
        </div>
      )}
    </div>
  )
}
