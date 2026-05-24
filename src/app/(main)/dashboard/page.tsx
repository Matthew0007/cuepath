import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">대시보드</h1>
        <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
      </div>

      {/* Sprint 2에서 채울 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['내 세션', '코치 찾기', '내 후기'] as const).map((label) => (
          <div
            key={label}
            className="bg-white rounded-xl border p-6 text-sm text-gray-400"
          >
            {label} — 준비 중
          </div>
        ))}
      </div>
    </div>
  )
}
