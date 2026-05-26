'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { updateCareerBio } from '@/app/(main)/profile/actions'

interface CareerBioFormProps {
  initialHeadline: string
  initialCareerBio: string
  initialCareerHistory: string
  isCoach: boolean
}

export function CareerBioForm({
  initialHeadline,
  initialCareerBio,
  initialCareerHistory,
  isCoach,
}: CareerBioFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const result = await updateCareerBio(new FormData(e.currentTarget))
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }
    setSuccess(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 한 줄 소개 */}
      <div className="space-y-1.5">
        <Label htmlFor="headline" className="text-xs font-medium text-gray-600">
          한 줄 소개
        </Label>
        <input
          id="headline"
          name="headline"
          defaultValue={initialHeadline}
          placeholder={isCoach
            ? '예) 5년차 IT 채용 전문가 · 삼성전자 출신'
            : '예) 취업 준비 중 · 마케팅 직군 지망'}
          className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/30 focus:border-[#0A66C2] transition-colors placeholder:text-gray-300"
        />
        <p className="text-[11px] text-gray-400">프로필 카드에 표시됩니다.</p>
      </div>

      {/* 자기소개 */}
      <div className="space-y-1.5">
        <Label htmlFor="career_bio" className="text-xs font-medium text-gray-600">
          {isCoach ? '컨설턴트 소개' : '자기소개'}
        </Label>
        <textarea
          id="career_bio"
          name="career_bio"
          defaultValue={initialCareerBio}
          rows={5}
          placeholder={isCoach
            ? '커리어 코칭 전문 분야, 강점, 코칭 방식 등을 자유롭게 작성해주세요.'
            : '현재 상황, 목표, 관심 직군 등을 자유롭게 작성해주세요.'}
          className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/30 focus:border-[#0A66C2] transition-colors placeholder:text-gray-300 leading-relaxed"
        />
        {isCoach && (
          <p className="text-[11px] text-gray-400">컨설턴트 프로필 페이지에 표시됩니다.</p>
        )}
      </div>

      {/* 경력 사항 (컨설턴트 전용) */}
      {isCoach && (
        <div className="space-y-1.5">
          <Label htmlFor="career_history" className="text-xs font-medium text-gray-600">
            주요 경력
          </Label>
          <textarea
            id="career_history"
            name="career_history"
            defaultValue={initialCareerHistory}
            rows={6}
            placeholder={`회사명 · 직책 · 기간 순으로 작성해주세요.\n\n예)\n삼성전자 · HR 팀장 · 2018~2023\n카카오 · 채용 담당자 · 2023~현재`}
            className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/30 focus:border-[#0A66C2] transition-colors placeholder:text-gray-300 leading-relaxed font-mono"
          />
          <p className="text-[11px] text-gray-400">줄 바꿈으로 구분하면 보기 좋게 표시됩니다.</p>
        </div>
      )}

      {/* 일반 사용자 이력 */}
      {!isCoach && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-600">
            경력·학력 (선택)
          </Label>
          <p className="text-[11px] text-gray-400 bg-[#EAF0F8] rounded-lg px-3 py-2">
            위 자기소개란에 경력과 학력을 함께 작성하셔도 됩니다. 컨설턴트에게만 공유되는 정보입니다.
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}
      {success && (
        <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">저장됐습니다.</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="text-sm bg-[#0A66C2] text-white px-5 py-2 rounded-full hover:bg-[#004182] disabled:opacity-50 transition-colors font-medium"
      >
        {loading ? '저장 중...' : '저장'}
      </button>
    </form>
  )
}
