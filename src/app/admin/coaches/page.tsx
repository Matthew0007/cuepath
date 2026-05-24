import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { approveCoach, rejectCoach } from '../actions'

export default async function AdminCoachesPage() {
  const supabase = createAdminClient()

  const { data: pending } = await supabase
    .from('coaches')
    .select(`
      id,
      bio,
      domains,
      hourly_rate,
      created_at,
      profiles!inner(full_name, email)
    `)
    .eq('is_approved', false)
    .order('created_at', { ascending: true })

  const { data: approved } = await supabase
    .from('coaches')
    .select('id')
    .eq('is_approved', true)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">코치 승인 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          대기 {pending?.length ?? 0}명 · 승인 {approved?.length ?? 0}명
        </p>
      </div>

      {pending && pending.length > 0 ? (
        <div className="space-y-4">
          {pending.map((coach) => {
            const profile = Array.isArray(coach.profiles)
              ? coach.profiles[0]
              : coach.profiles

            return (
              <div key={coach.id} className="bg-white rounded-xl border p-6 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{profile?.full_name ?? '-'}</p>
                    <p className="text-sm text-gray-500">{profile?.email}</p>
                  </div>
                  <p className="text-sm font-medium">{coach.hourly_rate.toLocaleString()}원</p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {coach.domains.map((d) => (
                    <span
                      key={d}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                    >
                      {d}
                    </span>
                  ))}
                </div>

                {coach.bio && (
                  <p className="text-sm text-gray-600 line-clamp-3">{coach.bio}</p>
                )}

                <p className="text-xs text-gray-400">
                  신청일: {new Date(coach.created_at).toLocaleDateString('ko-KR')}
                </p>

                <div className="flex gap-2 pt-1">
                  <form action={approveCoach.bind(null, coach.id)}>
                    <Button type="submit" size="sm">승인</Button>
                  </form>
                  <form action={rejectCoach.bind(null, coach.id)}>
                    <Button type="submit" size="sm" variant="destructive">거부</Button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p>대기 중인 코치 신청이 없습니다.</p>
        </div>
      )}
    </div>
  )
}
