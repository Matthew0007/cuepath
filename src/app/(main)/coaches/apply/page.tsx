'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { COACHING_DOMAINS } from '@/lib/constants'
import { applyCoach } from '../actions'

export default function CoachApplyPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await applyCoach(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>코치 신청</CardTitle>
          <CardDescription>
            심사 후 승인되면 코치로 활동할 수 있습니다. (1~3 영업일 소요)
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">
                {error}
              </p>
            )}

            {/* 자기소개 */}
            <div className="space-y-2">
              <Label htmlFor="bio">코치 소개</Label>
              <textarea
                id="bio"
                name="bio"
                required
                rows={4}
                placeholder="경력, 전문 분야, 코칭 스타일을 소개해주세요."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* 도메인 */}
            <div className="space-y-2">
              <Label>전문 도메인 (복수 선택 가능)</Label>
              <div className="grid grid-cols-2 gap-2">
                {COACHING_DOMAINS.map((d) => (
                  <label key={d} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" name="domains" value={d} className="rounded" />
                    {d}
                  </label>
                ))}
              </div>
            </div>

            {/* 금액 */}
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">세션 금액 (원)</Label>
              <Input
                id="hourly_rate"
                name="hourly_rate"
                type="number"
                min={10000}
                step={1000}
                placeholder="50000"
                required
              />
              <p className="text-xs text-gray-400">최소 10,000원, 1,000원 단위</p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '신청 중...' : '코치 신청하기'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
