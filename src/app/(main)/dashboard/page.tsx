import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AvatarImage } from '@/components/ui/avatar-image'
import { cn } from '@/lib/utils'
import { CalendarDays, ChevronRight, Star } from 'lucide-react'

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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  // 컨설턴트는 /coach/dashboard로
  if (profile?.role === 'coach') redirect('/coach/dashboard')

  // 예정된 세션 (최근 3개)
  const { data: upcomingSessions } = await supabase
    .from('sessions')
    .select(`
      id, status, scheduled_at, duration_minutes, price,
      coaches!inner(profiles!inner(full_name, avatar_url))
    `)
    .eq('coachee_id', user.id)
    .in('status', ['requested', 'confirmed'])
    .order('scheduled_at', { ascending: true })
    .limit(3)

  // 추천 컨설턴트 (평점 상위)
  const admin = createAdminClient()
  const { data: featuredCoaches } = await admin
    .from('coaches')
    .select(`id, bio, domains, rating, review_count, profiles!inner(full_name, avatar_url)`)
    .eq('is_approved', true)
    .order('rating', { ascending: false })
    .limit(4)

  // 아바타 signed URL 생성
  const coachesWithAvatars = await Promise.all(
    (featuredCoaches ?? []).map(async (coach) => {
      const p = Array.isArray(coach.profiles) ? coach.profiles[0] : coach.profiles
      let avatarUrl: string | null = null
      if (p?.avatar_url) {
        const { data } = await admin.storage.from('avatars').createSignedUrl(p.avatar_url, 3600)
        avatarUrl = data?.signedUrl ?? null
      }
      return { ...coach, profileName: p?.full_name ?? null, avatarUrl }
    })
  )

  return (
    <div className="space-y-4">

      {/* 환영 카드 */}
      <div className="bg-white rounded-xl border border-black/10 shadow-sm p-5">
        <p className="text-lg font-semibold text-gray-900">
          안녕하세요, {profile?.full_name ?? user.email?.split('@')[0]}님 👋
        </p>
        <p className="text-sm text-gray-500 mt-1">오늘도 커리어 성장을 이어가세요.</p>
        <div className="mt-4 flex gap-2">
          <Link
            href="/coaches"
            className="inline-flex items-center gap-1.5 bg-[#0A66C2] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#004182] transition-colors"
          >
            컨설턴트 찾기
          </Link>
          <Link
            href="/sessions"
            className="inline-flex items-center gap-1.5 border border-[#0A66C2] text-[#0A66C2] text-sm font-medium px-4 py-2 rounded-full hover:bg-[#EAF0F8] transition-colors"
          >
            내 세션 보기
          </Link>
        </div>
      </div>

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
              const cp = Array.isArray(s.coaches?.profiles) ? s.coaches.profiles[0] : s.coaches?.profiles
              return (
                <div key={s.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#EAF0F8] flex items-center justify-center shrink-0">
                    <CalendarDays className="w-4 h-4 text-[#0A66C2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{cp?.full_name ?? '컨설턴트'}</p>
                    {s.scheduled_at && (
                      <p className="text-xs text-gray-500 mt-0.5">{fmtKST(s.scheduled_at)} · {s.duration_minutes}분</p>
                    )}
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium shrink-0', STATUS_COLOR[s.status] ?? 'bg-gray-100 text-gray-500')}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 추천 컨설턴트 */}
      <div className="bg-white rounded-xl border border-black/10 shadow-sm">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <p className="font-semibold text-gray-900">추천 컨설턴트</p>
          <Link href="/coaches" className="text-xs text-[#0A66C2] hover:underline flex items-center gap-0.5">
            전체 보기 <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-black/5">
          {coachesWithAvatars.map((coach) => (
            <Link
              key={coach.id}
              href={`/coaches/${coach.id}`}
              className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <AvatarImage src={coach.avatarUrl} name={coach.profileName} size={44} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{coach.profileName ?? '컨설턴트'}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs text-gray-600">{coach.rating.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({coach.review_count}개 후기)</span>
                </div>
                {coach.bio && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{coach.bio}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {coach.domains.slice(0, 2).map((d: string) => (
                    <span key={d} className="text-[10px] bg-[#EAF0F8] text-[#0A66C2] px-1.5 py-0.5 rounded-full">{d}</span>
                  ))}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
            </Link>
          ))}
        </div>
      </div>

      {/* 컨설턴트 신청 CTA */}
      <div className="bg-white rounded-xl border border-black/10 shadow-sm p-5">
        <p className="font-semibold text-gray-900 text-sm">컨설턴트로 활동하고 싶으신가요?</p>
        <p className="text-xs text-gray-500 mt-1">검증된 커리어 전문가로 등록하고 의뢰인과 연결되세요.</p>
        <Link
          href="/coaches/apply"
          className="inline-flex items-center gap-1.5 mt-3 border border-[#0A66C2] text-[#0A66C2] text-xs font-medium px-4 py-1.5 rounded-full hover:bg-[#EAF0F8] transition-colors"
        >
          컨설턴트 신청하기
        </Link>
      </div>
    </div>
  )
}
