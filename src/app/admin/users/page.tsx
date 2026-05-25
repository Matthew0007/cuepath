import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { cn } from '@/lib/utils'

const ROLE_LABEL: Record<string, string> = { coachee: '의뢰인', coach: '컨설턴트', admin: '관리자' }
const ROLE_COLOR: Record<string, string> = {
  coachee: 'bg-gray-100 text-gray-600',
  coach:   'bg-blue-50 text-blue-700',
  admin:   'bg-purple-50 text-purple-700',
}
const PENALTY_COLOR: Record<string, string> = {
  warning:   'bg-yellow-50 text-yellow-700',
  suspended: 'bg-orange-50 text-orange-700',
  banned:    'bg-red-50 text-red-700',
}
const PENALTY_LABEL: Record<string, string> = {
  warning: '경고', suspended: '정지', banned: '영구정지',
}

export default async function AdminUsersPage() {
  const db = createAdminClient()

  const { data: users } = await db
    .from('profiles')
    .select(`
      id, full_name, email, role, created_at,
      penalties(id, level, reason, created_at),
      coaches(id, is_approved, rating, review_count)
    `)
    .order('created_at', { ascending: false })

  const { data: sessionCounts } = await db
    .from('sessions')
    .select('coachee_id')

  const coacheeCounts = (sessionCounts ?? []).reduce<Record<string, number>>((acc, s) => {
    acc[s.coachee_id] = (acc[s.coachee_id] ?? 0) + 1
    return acc
  }, {})

  const total      = users?.length ?? 0
  const coaches    = users?.filter((u) => u.role === 'coach').length ?? 0
  const penalised  = users?.filter((u) => Array.isArray(u.penalties) && u.penalties.length > 0).length ?? 0

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">사용자 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            전체 {total}명 · 컨설턴트 {coaches}명 · 제재 대상 {penalised}명
          </p>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['이름', '이메일', '역할', '세션', '제재 현황', '가입일', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {(users ?? []).map((user) => {
              const penalties = Array.isArray(user.penalties) ? user.penalties : []
              const coach     = Array.isArray(user.coaches)   ? user.coaches[0]   : user.coaches

              // 가장 심각한 페널티 계산
              const worstLevel = penalties.find((p) => p.level === 'banned')?.level
                ?? penalties.find((p) => p.level === 'suspended')?.level
                ?? penalties.find((p) => p.level === 'warning')?.level

              const sessionCount = coacheeCounts[user.id] ?? 0

              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${user.id}`} className="font-medium hover:underline">
                      {user.full_name ?? '-'}
                    </Link>
                    {coach && (
                      <span className={cn(
                        'ml-2 text-[11px] px-1.5 py-0.5 rounded font-medium',
                        coach.is_approved ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-600',
                      )}>
                        {coach.is_approved ? '컨설턴트 승인' : '심사중'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', ROLE_COLOR[user.role] ?? 'bg-gray-100 text-gray-600')}>
                      {ROLE_LABEL[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{sessionCount > 0 ? `${sessionCount}건` : '-'}</td>
                  <td className="px-4 py-3">
                    {worstLevel ? (
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', PENALTY_COLOR[worstLevel])}>
                        {PENALTY_LABEL[worstLevel]} {penalties.length > 1 ? `외 ${penalties.length - 1}건` : ''}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">없음</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {new Date(user.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${user.id}`} className="text-xs text-blue-500 hover:underline whitespace-nowrap">
                      상세 →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
