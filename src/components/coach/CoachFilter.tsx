'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { COACHING_DOMAINS } from '@/lib/constants'

export function CoachFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/coaches?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-3">
      {/* 도메인 */}
      <select
        defaultValue={searchParams.get('domain') ?? ''}
        onChange={(e) => update('domain', e.target.value)}
        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
      >
        <option value="">전체 도메인</option>
        {COACHING_DOMAINS.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* 최소 평점 */}
      <select
        defaultValue={searchParams.get('min_rating') ?? ''}
        onChange={(e) => update('min_rating', e.target.value)}
        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
      >
        <option value="">평점 전체</option>
        {[4, 3, 2].map((r) => (
          <option key={r} value={r}>{r}점 이상</option>
        ))}
      </select>

      {/* 가격 정렬 */}
      <select
        defaultValue={searchParams.get('sort') ?? ''}
        onChange={(e) => update('sort', e.target.value)}
        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
      >
        <option value="">기본 정렬 (평점순)</option>
        <option value="price_asc">가격 낮은순</option>
        <option value="price_desc">가격 높은순</option>
      </select>
    </div>
  )
}
