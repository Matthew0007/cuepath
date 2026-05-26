import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CoachCard } from '@/components/coach/CoachCard'
import { CoachFilter } from '@/components/coach/CoachFilter'
import { Users } from 'lucide-react'

interface SearchParams { domain?: string; min_rating?: string; sort?: string }
interface CoachesPageProps { searchParams: Promise<SearchParams> }

export default async function CoachesPage({ searchParams }: CoachesPageProps) {
  const { domain, min_rating, sort } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('coaches')
    .select(`id, bio, domains, hourly_rate, rating, review_count, profiles!inner(full_name, avatar_url)`)
    .eq('is_approved', true)

  if (domain) query = query.contains('domains', [domain])
  if (min_rating) query = query.gte('rating', parseFloat(min_rating))

  if (sort === 'price_asc') query = query.order('hourly_rate', { ascending: true })
  else if (sort === 'price_desc') query = query.order('hourly_rate', { ascending: false })
  else query = query.order('rating', { ascending: false })

  const { data: coaches } = await query

  // 아바타 signed URL
  const admin = createAdminClient()
  const coachesWithAvatars = await Promise.all(
    (coaches ?? []).map(async (coach) => {
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
      {/* 헤더 */}
      <div className="bg-white rounded-xl border border-black/10 shadow-sm px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#EAF0F8] rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-[#0A66C2]" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">컨설턴트 찾기</h1>
            <p className="text-xs text-gray-500">승인된 커리어 전문가 {coachesWithAvatars.length}명</p>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl border border-black/10 shadow-sm px-5 py-3">
        <Suspense>
          <CoachFilter />
        </Suspense>
      </div>

      {/* 목록 */}
      {coachesWithAvatars.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coachesWithAvatars.map((coach) => (
            <CoachCard
              key={coach.id}
              id={coach.id}
              fullName={coach.profileName}
              bio={coach.bio}
              domains={coach.domains}
              hourlyRate={coach.hourly_rate}
              rating={coach.rating}
              reviewCount={coach.review_count}
              avatarUrl={coach.avatarUrl}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-black/10 shadow-sm py-20 text-center">
          <p className="text-gray-400 text-sm">조건에 맞는 컨설턴트가 없습니다.</p>
        </div>
      )}
    </div>
  )
}
