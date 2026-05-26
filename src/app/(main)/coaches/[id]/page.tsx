import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AvatarImage } from '@/components/ui/avatar-image'
import { Star, CalendarDays, MessageSquare, Shield } from 'lucide-react'

interface CoachPageProps { params: Promise<{ id: string }> }

export default async function CoachPage({ params }: CoachPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: coach } = await supabase
    .from('coaches')
    .select(`id, bio, domains, hourly_rate, rating, review_count, profiles!inner(full_name, avatar_url)`)
    .eq('id', id)
    .eq('is_approved', true)
    .single()

  if (!coach) notFound()

  const profile = Array.isArray(coach.profiles) ? coach.profiles[0] : coach.profiles

  let avatarSignedUrl: string | null = null
  if (profile?.avatar_url) {
    const admin = createAdminClient()
    const { data } = await admin.storage.from('avatars').createSignedUrl(profile.avatar_url, 3600)
    avatarSignedUrl = data?.signedUrl ?? null
  }

  // 후기 조회
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`rating, content, created_at, profiles!reviews_coachee_id_fkey(full_name)`)
    .eq('coach_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  const SESSION_OPTIONS = [
    { label: '30분 세션', price: 40000, duration: 30 },
    { label: '50분 세션', price: 70000, duration: 50 },
  ]

  return (
    <div className="space-y-4">
      {/* 프로필 카드 */}
      <div className="bg-white rounded-xl border border-black/10 shadow-sm overflow-hidden">
        {/* 배경 배너 */}
        <div className="h-20 bg-gradient-to-r from-[#0A66C2] to-[#004182]" />

        <div className="px-6 pb-6">
          {/* 아바타 + 이름 */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <AvatarImage src={avatarSignedUrl} name={profile?.full_name} size={80} className="ring-4 ring-white" />
            <Link
              href={`/booking/${coach.id}`}
              className="bg-[#0A66C2] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#004182] transition-colors"
            >
              세션 예약
            </Link>
          </div>

          <h1 className="text-xl font-bold text-gray-900">{profile?.full_name ?? '컨설턴트'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">커리어 코칭 컨설턴트 · Cuepath 인증</p>

          {/* 평점 */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${s <= Math.round(coach.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-800">{coach.rating.toFixed(1)}</span>
            <span className="text-sm text-gray-500">({coach.review_count}개 후기)</span>
          </div>

          {/* 도메인 */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {coach.domains.map((d) => (
              <span key={d} className="text-xs bg-[#EAF0F8] text-[#0A66C2] px-2.5 py-1 rounded-full font-medium">
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 소개 */}
      {coach.bio && (
        <div className="bg-white rounded-xl border border-black/10 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#0A66C2]" />
            컨설턴트 소개
          </h2>
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{coach.bio}</p>
        </div>
      )}

      {/* 세션 옵션 */}
      <div className="bg-white rounded-xl border border-black/10 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-[#0A66C2]" />
          세션 안내
        </h2>
        <div className="space-y-3">
          {SESSION_OPTIONS.map((opt) => (
            <div key={opt.duration} className="flex items-center justify-between py-3 px-4 rounded-lg bg-gray-50 border border-black/5">
              <div>
                <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">1:1 채팅 코칭 · 시간 제한 채팅방</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#0A66C2]">{opt.price.toLocaleString()}원</p>
              </div>
            </div>
          ))}
        </div>
        <Link
          href={`/booking/${coach.id}`}
          className="mt-4 w-full flex items-center justify-center bg-[#0A66C2] text-white text-sm font-semibold py-2.5 rounded-full hover:bg-[#004182] transition-colors"
        >
          지금 예약하기
        </Link>
      </div>

      {/* 안전 안내 */}
      <div className="bg-white rounded-xl border border-black/10 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#057642]" />
          안전한 코칭 환경
        </h2>
        <div className="space-y-2">
          {[
            'Cuepath가 직접 검증한 컨설턴트',
            '4층 보안 시스템으로 외부 연락처 차단',
            '플랫폼 내에서만 소통 — 안전하고 투명한 채팅',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-[#057642] mt-0.5">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 후기 */}
      {(reviews ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-black/10 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">후기 {reviews?.length}개</h2>
          <div className="space-y-4">
            {reviews?.map((r, i) => {
              const reviewerProfile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
              return (
                <div key={i} className="border-b border-black/5 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-full bg-[#EAF0F8] flex items-center justify-center text-xs font-semibold text-[#0A66C2]">
                      {reviewerProfile?.full_name?.[0] ?? '?'}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{reviewerProfile?.full_name ?? '익명'}</span>
                    <div className="flex items-center gap-0.5 ml-auto">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                  {r.content && <p className="text-sm text-gray-600 leading-relaxed">{r.content}</p>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleDateString('ko-KR')}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
