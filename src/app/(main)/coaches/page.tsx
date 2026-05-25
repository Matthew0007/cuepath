import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { CoachCard } from '@/components/coach/CoachCard'
import { CoachFilter } from '@/components/coach/CoachFilter'

interface SearchParams {
  domain?: string
  min_rating?: string
  sort?: string
}

interface CoachesPageProps {
  searchParams: Promise<SearchParams>
}

export default async function CoachesPage({ searchParams }: CoachesPageProps) {
  const { domain, min_rating, sort } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('coaches')
    .select(`
      id,
      bio,
      domains,
      hourly_rate,
      rating,
      review_count,
      profiles!inner(full_name)
    `)
    .eq('is_approved', true)

  if (domain) {
    query = query.contains('domains', [domain])
  }
  if (min_rating) {
    query = query.gte('rating', parseFloat(min_rating))
  }

  if (sort === 'price_asc') {
    query = query.order('hourly_rate', { ascending: true })
  } else if (sort === 'price_desc') {
    query = query.order('hourly_rate', { ascending: false })
  } else {
    query = query.order('rating', { ascending: false })
  }

  const { data: coaches } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">컨설턴트 찾기</h1>
        <span className="text-sm text-gray-500">{coaches?.length ?? 0}명</span>
      </div>

      <Suspense>
        <CoachFilter />
      </Suspense>

      {coaches && coaches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coaches.map((coach) => {
            const profile = Array.isArray(coach.profiles)
              ? coach.profiles[0]
              : coach.profiles
            return (
              <CoachCard
                key={coach.id}
                id={coach.id}
                fullName={profile?.full_name ?? null}
                bio={coach.bio}
                domains={coach.domains}
                hourlyRate={coach.hourly_rate}
                rating={coach.rating}
                reviewCount={coach.review_count}
              />
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p>조건에 맞는 컨설턴트가 없습니다.</p>
        </div>
      )}
    </div>
  )
}
