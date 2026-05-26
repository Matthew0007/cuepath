'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AvatarImage } from '@/components/ui/avatar-image'
import { updateProfileName } from '@/app/(main)/profile/actions'

interface ProfileEditFormProps {
  initialName: string
  initialEmail: string
  initialAvatarUrl: string | null
}

export function ProfileEditForm({ initialName, initialEmail, initialAvatarUrl }: ProfileEditFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [previewUrl, setPreviewUrl] = useState<string | null>(initialAvatarUrl)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const [nameError, setNameError] = useState<string | null>(null)
  const [nameLoading, setNameLoading] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setUploadSuccess(false)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('jpg, jpeg, png, webp 파일만 가능합니다.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('파일 크기는 5MB 이하여야 합니다.')
      return
    }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleAvatarUpload() {
    if (!selectedFile) return
    setUploadLoading(true)
    setUploadError(null)
    const body = new FormData()
    body.append('file', selectedFile)
    const res = await fetch('/api/profile/avatar', { method: 'POST', body })
    const json = await res.json()
    setUploadLoading(false)
    if (!res.ok || json.error) {
      setUploadError(json.error ?? '업로드에 실패했습니다.')
      return
    }
    setSelectedFile(null)
    setUploadSuccess(true)
    router.refresh()
  }

  async function handleNameSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setNameError(null)
    setNameSuccess(false)
    setNameLoading(true)
    const result = await updateProfileName(new FormData(e.currentTarget))
    setNameLoading(false)
    if (result.error) { setNameError(result.error); return }
    setNameSuccess(true)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* 사진 */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <AvatarImage src={previewUrl} size={80} className="ring-2 ring-[#EAF0F8]" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#0A66C2] rounded-full flex items-center justify-center hover:bg-[#004182] transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <div className="flex-1 space-y-1.5">
          <p className="text-sm font-medium text-gray-700">프로필 사진</p>
          <p className="text-xs text-gray-400">jpg, png, webp · 최대 5MB · 400×400px로 자동 변환</p>
          {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
          {uploadSuccess && <p className="text-xs text-green-600">사진이 업데이트됐습니다.</p>}
          {selectedFile && (
            <button
              onClick={handleAvatarUpload}
              disabled={uploadLoading}
              className="text-xs bg-[#0A66C2] text-white px-3 py-1.5 rounded-full hover:bg-[#004182] disabled:opacity-50 transition-colors"
            >
              {uploadLoading ? '업로드 중...' : '사진 저장'}
            </button>
          )}
        </div>
      </div>

      {/* 이름 + 이메일 */}
      <form onSubmit={handleNameSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-600">이메일</Label>
          <Input value={initialEmail} disabled className="bg-gray-50 text-gray-400 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="full_name" className="text-xs font-medium text-gray-600">이름</Label>
          <Input
            id="full_name"
            name="full_name"
            defaultValue={initialName}
            placeholder="이름을 입력하세요"
            required
            className="text-sm"
          />
        </div>
        {nameError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{nameError}</p>}
        {nameSuccess && <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">이름이 저장됐습니다.</p>}
        <button
          type="submit"
          disabled={nameLoading}
          className="text-sm bg-[#0A66C2] text-white px-5 py-2 rounded-full hover:bg-[#004182] disabled:opacity-50 transition-colors font-medium"
        >
          {nameLoading ? '저장 중...' : '저장'}
        </button>
      </form>
    </div>
  )
}
