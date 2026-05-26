'use client'

import { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { COACHING_DOMAINS } from '@/lib/constants'
import { applyCoach } from '../actions'
import { FileText, Link as LinkIcon, Upload, X } from 'lucide-react'

export default function CoachApplyPage() {
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('PDF 파일만 업로드할 수 있습니다.')
      e.target.value = ''
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다.')
      e.target.value = ''
      return
    }
    setError(null)
    setSelectedFile(file)
  }

  return (
    <div className="max-w-xl space-y-4">
      {/* 헤더 */}
      <div className="bg-white rounded-xl border border-black/10 shadow-sm px-5 py-4">
        <h1 className="font-semibold text-gray-900">컨설턴트 신청</h1>
        <p className="text-xs text-gray-500 mt-1">
          심사 후 승인되면 컨설턴트로 활동할 수 있습니다. (1~3 영업일 소요)
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">

          {/* ── 기본 정보 ─────────────────────────────── */}
          <div className="bg-white rounded-xl border border-black/10 shadow-sm p-5 space-y-5">
            <p className="text-sm font-semibold text-gray-700">기본 정보</p>

            {/* 자기소개 */}
            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-xs font-medium text-gray-600">
                컨설턴트 소개 <span className="text-red-400">*</span>
              </Label>
              <textarea
                id="bio"
                name="bio"
                required
                rows={4}
                placeholder="경력, 전문 분야, 코칭 스타일을 소개해주세요."
                className="w-full text-sm border border-black/15 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/30 focus:border-[#0A66C2] transition-colors placeholder:text-gray-300"
              />
            </div>

            {/* 도메인 */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600">
                전문 도메인 <span className="text-red-400">*</span>
                <span className="text-gray-400 font-normal ml-1">(복수 선택 가능)</span>
              </Label>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                {COACHING_DOMAINS.map((d) => (
                  <label key={d} className="flex items-center gap-2 text-sm cursor-pointer text-gray-700 hover:text-[#0A66C2]">
                    <input type="checkbox" name="domains" value={d} className="accent-[#0A66C2]" />
                    {d}
                  </label>
                ))}
              </div>
            </div>

            {/* 세션 금액 */}
            <div className="space-y-1.5">
              <Label htmlFor="hourly_rate" className="text-xs font-medium text-gray-600">
                세션 기준 금액 (원) <span className="text-red-400">*</span>
              </Label>
              <Input
                id="hourly_rate"
                name="hourly_rate"
                type="number"
                min={10000}
                step={1000}
                placeholder="50000"
                required
                className="text-sm"
              />
              <p className="text-[11px] text-gray-400">최소 10,000원 · 1,000원 단위 · 30분/50분 세션에 동일 적용</p>
            </div>
          </div>

          {/* ── 심사 자료 ─────────────────────────────── */}
          <div className="bg-white rounded-xl border border-black/10 shadow-sm p-5 space-y-5">
            <div>
              <p className="text-sm font-semibold text-gray-700">심사 자료</p>
              <p className="text-xs text-gray-400 mt-0.5">
                아래 정보는 관리자 심사 시에만 사용되며 사용자에게 노출되지 않습니다.
              </p>
            </div>

            {/* LinkedIn URL */}
            <div className="space-y-1.5">
              <Label htmlFor="linkedin_url" className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-[#0A66C2]" />
                LinkedIn 프로필 URL
              </Label>
              <Input
                id="linkedin_url"
                name="linkedin_url"
                type="url"
                placeholder="https://www.linkedin.com/in/yourprofile"
                className="text-sm"
              />
            </div>

            {/* 기타 URL */}
            <div className="space-y-1.5">
              <Label htmlFor="other_profile_url" className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-gray-400" />
                기타 프로필 URL
              </Label>
              <Input
                id="other_profile_url"
                name="other_profile_url"
                type="url"
                placeholder="개인 홈페이지, 포트폴리오, GitHub 등"
                className="text-sm"
              />
            </div>

            {/* 이력서 PDF */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                이력서 / 포트폴리오 (PDF)
              </Label>

              <input
                ref={fileInputRef}
                type="file"
                name="resume"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />

              {selectedFile ? (
                <div className="flex items-center gap-3 border border-black/10 rounded-lg px-3 py-2.5 bg-[#EAF0F8]">
                  <FileText className="w-4 h-4 text-[#0A66C2] shrink-0" />
                  <span className="text-sm text-gray-700 flex-1 truncate">{selectedFile.name}</span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {(selectedFile.size / 1024 / 1024).toFixed(1)}MB
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 border border-dashed border-black/20 rounded-lg py-4 text-sm text-gray-400 hover:border-[#0A66C2] hover:text-[#0A66C2] transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  PDF 파일 선택 (최대 10MB)
                </button>
              )}
            </div>

            <p className="text-[11px] text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
              LinkedIn URL, 기타 URL, 이력서 중 하나 이상 제출을 권장합니다. 심사 기간이 단축될 수 있습니다.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0A66C2] text-white font-semibold py-3 rounded-full hover:bg-[#004182] disabled:opacity-50 transition-colors text-sm"
          >
            {loading ? '신청 중...' : '컨설턴트 신청하기'}
          </button>
        </div>
      </form>
    </div>
  )
}
