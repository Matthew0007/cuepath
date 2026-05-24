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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">대시보드</h1>
        <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 코치 찾기 */}
        <Link
          href="/coaches"
          className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow"
        >
          <p className="font-medium">코치 찾기</p>
          <p className="text-sm text-gray-400 mt-1">승인된 코치 목록 보기</p>
        </Link>

        {/* 내 세션 — Sprint 3 */}
        <div className="bg-white rounded-xl border p-6 text-gray-400">
          <p className="font-medium text-gray-700">내 세션</p>
          <p className="text-sm mt-1">준비 중 (Sprint 3)</p>
        </div>

        {/* 코치 신청 또는 상태 */}
        {coachRow ? (
          <div className="bg-white rounded-xl border p-6">
            <p className="font-medium">코치 신청 현황</p>
            <p className="text-sm mt-1">
              {coachRow.is_approved ? (
                <span className="text-green-600">승인 완료</span>
              ) : (
                <span className="text-yellow-600">심사 중</span>
              )}
            </p>
          </div>
        ) : (
          <Link
            href="/coaches/apply"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'bg-white rounded-xl border p-6 h-auto flex-col items-start justify-start hover:shadow-md transition-shadow'
            )}
          >
            <p className="font-medium">코치 신청</p>
            <p className="text-sm text-gray-400 mt-1">코치로 활동하기</p>
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
