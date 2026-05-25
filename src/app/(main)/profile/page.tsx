import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, email')
    .eq('id', user.id)
    .single()

  let avatarSignedUrl: string | null = null
  if (profile?.avatar_url) {
    const admin = createAdminClient()
    const { data } = await admin.storage
      .from('avatars')
      .createSignedUrl(profile.avatar_url, 3600)
    avatarSignedUrl = data?.signedUrl ?? null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">회원정보 수정</h1>
        <p className="text-sm text-gray-500 mt-1">프로필 사진과 이름을 변경할 수 있습니다.</p>
      </div>

      <ProfileEditForm
        initialName={profile?.full_name ?? ''}
        initialEmail={profile?.email ?? user.email ?? ''}
        initialAvatarUrl={avatarSignedUrl}
      />
    </div>
  )
}
