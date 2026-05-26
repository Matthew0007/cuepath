'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function updateProfileName(formData: FormData): Promise<{ error?: string }> {
  const user = await getUser()
  if (!user) return { error: '인증이 필요합니다.' }

  const fullName = (formData.get('full_name') as string).trim()
  if (!fullName) return { error: '이름을 입력해주세요.' }

  const { error } = await createAdminClient()
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  revalidatePath('/coach/dashboard')
  return {}
}

export async function updateCareerBio(formData: FormData): Promise<{ error?: string }> {
  const user = await getUser()
  if (!user) return { error: '인증이 필요합니다.' }

  const headline   = (formData.get('headline')   as string | null)?.trim() || null
  const career_bio = (formData.get('career_bio') as string | null)?.trim() || null

  const admin = createAdminClient()

  const { error: profileError } = await admin
    .from('profiles')
    .update({ headline, career_bio })
    .eq('id', user.id)

  if (profileError) return { error: profileError.message }

  // 컨설턴트인 경우 coaches 테이블도 동기화
  const { data: coachRow } = await admin
    .from('coaches')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (coachRow) {
    const career_history = (formData.get('career_history') as string | null)?.trim() || null
    await admin
      .from('coaches')
      .update({ bio: career_bio, career_history })
      .eq('id', user.id)
  }

  revalidatePath('/profile')
  revalidatePath(`/coaches/${user.id}`)
  return {}
}
