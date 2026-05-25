'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function applyCoach(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 이미 코치 신청 여부 확인
  const { data: existing } = await supabase
    .from('coaches')
    .select('id')
    .eq('id', user.id)
    .single()

  if (existing) return { error: '이미 컨설턴트 신청이 완료된 계정입니다.' }

  const domains = formData.getAll('domains') as string[]
  if (domains.length === 0) return { error: '최소 1개 도메인을 선택해주세요.' }

  const hourlyRate = parseInt(formData.get('hourly_rate') as string, 10)
  if (isNaN(hourlyRate) || hourlyRate < 10000) {
    return { error: '시간당 금액은 최소 10,000원 이상이어야 합니다.' }
  }

  // handle_new_user 트리거 미실행 계정 대비: profiles 행 보장
  await supabase.from('profiles').upsert(
    { id: user.id, email: user.email ?? '', full_name: user.user_metadata?.full_name ?? null },
    { onConflict: 'id', ignoreDuplicates: true }
  )

  const { error } = await supabase.from('coaches').insert({
    id: user.id,
    bio: formData.get('bio') as string,
    domains,
    hourly_rate: hourlyRate,
  })

  if (error) return { error: error.message }

  redirect('/dashboard?applied=1')
}
