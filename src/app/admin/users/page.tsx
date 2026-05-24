import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function liftPenalty(penaltyId: string) {
  'use server'
  const supabase = createAdminClient()
  await supabase.from('penalties').delete().eq('id', penaltyId)
  revalidatePath('/admin/users')
}

export default async function AdminUsersPage() {
  const supabase = createAdminClient()

  const { data: users } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      role,
      created_at,
      penalties(id, level, reason, expires_at, created_at)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">사용자 관리</h1>
        <p className="text-sm text-gray-500 mt-1">총 {users?.length ?? 0}명</p>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['이름', '이메일', '역할', '페널티', '가입일', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {users?.map((user) => {
              const penalties = Array.isArray(user.penalties) ? user.penalties : []
              const latestPenalty = penalties[0]

              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{user.full_name ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      user.role === 'admin' ? 'bg-purple-50 text-purple-700' :
                      user.role === 'coach' ? 'bg-blue-50 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {latestPenalty ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        latestPenalty.level === 'banned' ? 'bg-red-50 text-red-700' :
                        latestPenalty.level === 'suspended' ? 'bg-orange-50 text-orange-700' :
                        'bg-yellow-50 text-yellow-700'
                      }`}>
                        {latestPenalty.level} ({penalties.length}건)
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(user.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">
                    {latestPenalty && (
                      <form action={liftPenalty.bind(null, latestPenalty.id)}>
                        <button type="submit" className="text-xs text-blue-500 hover:underline">
                          제재 해제
                        </button>
                      </form>
                    )}
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
