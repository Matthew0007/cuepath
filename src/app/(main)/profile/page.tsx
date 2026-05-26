import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'
import { CareerBioForm } from '@/components/profile/CareerBioForm'
import { User, FileText, Camera } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, avatar_url, email, role, headline, career_bio')
    .eq('id', user.id)
    .single()

  let avatarSignedUrl: string | null = null
  if (profile?.avatar_url) {
    const { data } = await admin.storage
      .from('avatars')
      .createSignedUrl(profile.avatar_url, 3600)
    avatarSignedUrl = data?.signedUrl ?? null
  }

  // 컨설턴트인 경우 career_history 추가 조회
  let careerHistory: string | null = null
  if (profile?.role === 'coach') {
    const { data: coachRow } = await admin
      .from('coaches')
      .select('career_history')
      .eq('id', user.id)
      .maybeSingle()
    careerHistory = coachRow?.career_history ?? null
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {/* 헤더 */}
      <div className="bg-white rounded-xl border border-black/10 shadow-sm px-5 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-[#EAF0F8] rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-[#0A66C2]" />
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">프로필 관리</h1>
          <p className="text-xs text-gray-500 mt-0.5">사진, 이름, 자기소개를 설정합니다</p>
        </div>
      </div>

      {/* 프로필 사진 + 이름 */}
      <div className="bg-white rounded-xl border border-black/10 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
          <Camera className="w-4 h-4 text-[#0A66C2]" />
          기본 정보
        </h2>
        <ProfileEditForm
          initialName={profile?.full_name ?? ''}
          initialEmail={profile?.email ?? user.email ?? ''}
          initialAvatarUrl={avatarSignedUrl}
        />
      </div>

      {/* 이력 · 약력 */}
      <div className="bg-white rounded-xl border border-black/10 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-[#0A66C2]" />
          {profile?.role === 'coach' ? '컨설턴트 소개 · 경력' : '자기소개 · 이력'}
        </h2>
        <CareerBioForm
          initialHeadline={profile?.headline ?? ''}
          initialCareerBio={profile?.career_bio ?? ''}
          initialCareerHistory={careerHistory ?? ''}
          isCoach={profile?.role === 'coach'}
        />
      </div>
    </div>
  )
}
