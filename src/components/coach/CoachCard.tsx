import Link from 'next/link'
import { Star, ChevronRight } from 'lucide-react'
import { AvatarImage } from '@/components/ui/avatar-image'
import { FavoriteButton } from './FavoriteButton'

interface CoachCardProps {
  id: string
  fullName: string | null
  bio: string | null
  domains: string[]
  hourlyRate: number
  rating: number
  reviewCount: number
  avatarUrl?: string | null
  isFavorited?: boolean
}

export function CoachCard({
  id, fullName, bio, domains, hourlyRate, rating, reviewCount, avatarUrl, isFavorited = false,
}: CoachCardProps) {
  return (
    <div className="relative bg-white rounded-xl border border-black/10 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
      {/* 즐겨찾기 버튼 */}
      <div className="absolute top-3 right-3 z-10">
        <FavoriteButton coachId={id} initialFavorited={isFavorited} />
      </div>

      <Link href={`/coaches/${id}`} className="flex flex-col flex-1 p-5">
        {/* 헤더 */}
        <div className="flex items-start gap-3 pr-8">
          <AvatarImage src={avatarUrl ?? null} name={fullName} size={48} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{fullName ?? '컨설턴트'}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium text-gray-700">{rating.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({reviewCount}개 후기)</span>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#0A66C2] shrink-0">
            {hourlyRate.toLocaleString()}원
          </span>
        </div>

        {/* 소개 */}
        {bio && (
          <p className="text-xs text-gray-500 mt-3 line-clamp-2 leading-relaxed flex-1">{bio}</p>
        )}

        {/* 도메인 태그 */}
        <div className="flex flex-wrap gap-1 mt-3">
          {domains.slice(0, 3).map((d) => (
            <span key={d} className="text-[10px] bg-[#EAF0F8] text-[#0A66C2] px-2 py-0.5 rounded-full font-medium">
              {d}
            </span>
          ))}
          {domains.length > 3 && (
            <span className="text-[10px] text-gray-400">+{domains.length - 3}</span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
          <span className="text-xs text-gray-400">세션 예약 가능</span>
          <span className="flex items-center gap-0.5 text-xs text-[#0A66C2] font-medium">
            프로필 보기 <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </Link>
    </div>
  )
}
