'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { submitReview } from '../../actions'

export default function ReviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!rating) { setError('평점을 선택해주세요.'); return }
    setLoading(true)
    setError(null)
    const result = await submitReview(sessionId, new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  const display = hovered || rating

  return (
    <div className="max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>코칭 후기 작성</CardTitle>
          <CardDescription>코칭 경험을 다른 이용자와 나눠주세요.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">{error}</p>
            )}

            {/* 별점 */}
            <div className="space-y-2">
              <p className="text-sm font-medium">평점</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="text-3xl transition-transform hover:scale-110"
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(star)}
                  >
                    {star <= display ? '★' : '☆'}
                  </button>
                ))}
              </div>
              <input type="hidden" name="rating" value={rating} />
            </div>

            {/* 내용 */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="content">
                후기 내용 <span className="text-gray-400 font-normal">(선택)</span>
              </label>
              <textarea
                id="content"
                name="content"
                rows={4}
                placeholder="코칭 경험을 자유롭게 작성해주세요."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || !rating}>
              {loading ? '제출 중...' : '후기 등록'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
