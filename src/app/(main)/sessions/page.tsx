import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STATUS_LABEL: Record<string, string> = {
  pending: '결제 대기',
  confirmed: '진행 중',
  completed: '완료',
  cancelled: '취소',
  refunded: '환불',
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
      created_at,
      coach_id,
      coachee_id,
      coaches!inner(
        profiles!inner(full_name)
      ),
      profiles!sessions_coachee_id_fkey!inner(full_name),
      reviews(id)
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
              ? (coacheeProfile?.full_name ?? '코치이')
              : (coachProfile?.full_name ?? '코치')

            const hasReview = Array.isArray(session.reviews)
              ? session.reviews.length > 0
              : !!session.reviews

            const canReview =
              !isCoach && session.status === 'completed' && !hasReview

            return (
              <div key={session.id} className="bg-white rounded-xl border p-5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-medium">{otherName}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      session.status === 'completed' ? 'bg-green-50 text-green-700' :
                      session.status === 'confirmed' ? 'bg-blue-50 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    )}>
                      {STATUS_LABEL[session.status] ?? session.status}
                    </span>
                    <span>{session.price.toLocaleString()}원</span>
                    <span>{new Date(session.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {session.status === 'confirmed' && (
                    <Link
                      href={`/chat/${session.id}`}
                      className={cn(buttonVariants({ size: 'sm' }))}
                    >
                      채팅방 입장
                    </Link>
                  )}
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
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p>세션 내역이 없습니다.</p>
          <Link href="/coaches" className="text-sm underline mt-2 inline-block">
            코치 찾아보기
          </Link>
        </div>
      )}
    </div>
  )
}
