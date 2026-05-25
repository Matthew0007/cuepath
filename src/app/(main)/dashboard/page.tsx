import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  const { data: coachRow } = await supabase
    .from('coaches')
    .select('is_approved')
    .eq('id', user!.id)
    .maybeSingle()

  // 컨설턴트인 경우: 대기 중 예약 요청 수
  let pendingRequestCount = 0
  if (coachRow?.is_approved) {
    const { count } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('coach_id', user!.id)
      .eq('status', 'requested')
    pendingRequestCount = count ?? 0
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">대시보드</h1>
        <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 컨설턴트 찾기 */}
        <Link
          href="/coaches"
          className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow"
        >
          <p className="font-medium">컨설턴트 찾기</p>
          <p className="text-sm text-gray-400 mt-1">승인된 컨설턴트 목록 보기</p>
        </Link>

        {/* 내 세션 */}
        <Link
          href="/sessions"
          className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow"
        >
          <p className="font-medium">내 세션</p>
          <p className="text-sm text-gray-400 mt-1">예약·진행·완료 세션 보기</p>
        </Link>

        {/* 컨설턴트 신청 / 현황 / 캘린더 */}
        {coachRow ? (
          coachRow.is_approved ? (
            <Link
              href="/coach/schedule"
              className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow relative"
            >
              <p className="font-medium">내 캘린더 관리</p>
              <p className="text-sm text-gray-400 mt-1">슬롯 등록 및 예약 관리</p>
              {pendingRequestCount > 0 && (
                <span className="absolute top-4 right-4 text-xs bg-yellow-400 text-white font-bold px-2 py-0.5 rounded-full">
                  {pendingRequestCount}
                </span>
              )}
            </Link>
          ) : (
            <div className="bg-white rounded-xl border p-6">
              <p className="font-medium">컨설턴트 신청 현황</p>
              <p className="text-sm mt-1 text-yellow-600">심사 중</p>
            </div>
          )
        ) : (
          <Link
            href="/coaches/apply"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'bg-white rounded-xl border p-6 h-auto flex-col items-start justify-start hover:shadow-md transition-shadow',
            )}
          >
            <p className="font-medium">컨설턴트 신청</p>
            <p className="text-sm text-gray-400 mt-1">컨설턴트로 활동하기</p>
          </Link>
        )}
      </div>

      {/* 관리자 전용 링크 */}
      {profile?.role === 'admin' && (
        <div className="pt-4 border-t">
          <Link
            href="/admin/coaches"
            className="text-sm text-gray-500 hover:text-gray-900 underline"
          >
            관리자 콘솔 →
          </Link>
        </div>
      )}
    </div>
  )
}
