import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CoachPageProps {
  params: Promise<{ id: string }>
}

export default async function CoachPage({ params }: CoachPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: coach } = await supabase
    .from('coaches')
    .select(`
      id,
      bio,
      domains,
      hourly_rate,
      rating,
      review_count,
      profiles!inner(full_name, avatar_url)
    `)
    .eq('id', id)
    .eq('is_approved', true)
    .single()

  if (!coach) notFound()

  const profile = Array.isArray(coach.profiles)
    ? coach.profiles[0]
    : coach.profiles

  return (
    <div className="max-w-2xl space-y-8">
      {/* 코치 헤더 */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl shrink-0">
          {profile?.full_name?.[0] ?? '?'}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{profile?.full_name ?? '컨설턴트'}</h1>
          <p className="text-gray-500 mt-1">
            ★ {coach.rating.toFixed(1)} · 후기 {coach.review_count}개 · {coach.hourly_rate.toLocaleString()}원/회
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {coach.domains.map((d) => (
              <span
                key={d}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 소개 */}
      {coach.bio && (
        <div>
          <h2 className="font-medium mb-2">컨설턴트 소개</h2>
          <p className="text-gray-700 whitespace-pre-line">{coach.bio}</p>
        </div>
      )}

      {/* 예약 */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between">
          <span className="font-medium">{coach.hourly_rate.toLocaleString()}원 / 60분</span>
          <Link
            href={`/booking/${coach.id}`}
            className={cn(buttonVariants(), 'min-w-28')}
          >
            세션 예약
          </Link>
        </div>
      </div>
    </div>
  )
}
