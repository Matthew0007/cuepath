import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface CoachCardProps {
  id: string
  fullName: string | null
  bio: string | null
  domains: string[]
  hourlyRate: number
  rating: number
  reviewCount: number
}

export function CoachCard({
  id,
  fullName,
  bio,
  domains,
  hourlyRate,
  rating,
  reviewCount,
}: CoachCardProps) {
  return (
    <Link href={`/coaches/${id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold">{fullName ?? '코치'}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                ★ {rating.toFixed(1)} ({reviewCount}개 후기)
              </p>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {hourlyRate.toLocaleString()}원
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {bio && (
            <p className="text-sm text-gray-600 line-clamp-2">{bio}</p>
          )}
          <div className="flex flex-wrap gap-1">
            {domains.map((d) => (
              <span
                key={d}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
              >
                {d}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
