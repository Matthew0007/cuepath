'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AvatarImage } from '@/components/ui/avatar-image'
import { updateProfileName } from '@/app/(main)/profile/actions'

interface ProfileEditFormProps {
  initialName: string
  initialEmail: string
  initialAvatarUrl: string | null
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_MB = 5

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

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('jpg, jpeg, png, webp 파일만 업로드할 수 있습니다.')
      return
    }

    if (file.size > MAX_MB * 1024 * 1024) {
      setUploadError(`파일 크기는 ${MAX_MB}MB 이하여야 합니다.`)
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleAvatarUpload() {
    if (!selectedFile) return

    setUploadLoading(true)
    setUploadError(null)
    setUploadSuccess(false)

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

    if (result.error) {
      setNameError(result.error)
      return
    }

    setNameSuccess(true)
    router.refresh()
  }

  return (
    <div className="space-y-8 max-w-lg">
      {/* 프로필 사진 */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-medium">프로필 사진</h2>

        <div className="flex items-center gap-5">
          <AvatarImage src={previewUrl} size={80} className="border" />

          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              사진 선택
            </Button>
            <p className="text-xs text-gray-400">
              jpg, jpeg, png, webp · 최대 5MB
            </p>
          </div>
        </div>

        {uploadError && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">{uploadError}</p>
        )}
        {uploadSuccess && (
          <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md">프로필 사진이 업데이트되었습니다.</p>
        )}

        {selectedFile && (
          <Button onClick={handleAvatarUpload} disabled={uploadLoading} size="sm">
            {uploadLoading ? '업로드 중...' : '사진 저장'}
          </Button>
        )}

        <p className="text-xs text-gray-400">
          업로드 후 400×400px WebP로 자동 변환됩니다.
        </p>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-medium">기본 정보</h2>

        <div className="space-y-2">
          <Label>이메일</Label>
          <Input value={initialEmail} disabled className="bg-gray-50 text-gray-500" />
          <p className="text-xs text-gray-400">이메일은 변경할 수 없습니다.</p>
        </div>

        <form onSubmit={handleNameSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">이름</Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={initialName}
              placeholder="이름을 입력하세요"
              required
            />
          </div>

          {nameError && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">{nameError}</p>
          )}
          {nameSuccess && (
            <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md">이름이 업데이트되었습니다.</p>
          )}

          <Button type="submit" disabled={nameLoading}>
            {nameLoading ? '저장 중...' : '정보 저장'}
          </Button>
        </form>
      </div>
    </div>
  )
}
