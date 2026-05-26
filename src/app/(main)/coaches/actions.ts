'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function applyCoach(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

  const bio           = (formData.get('bio')               as string).trim()
  const linkedinUrl   = (formData.get('linkedin_url')      as string).trim() || null
  const otherUrl      = (formData.get('other_profile_url') as string).trim() || null
  const resumeFile    = formData.get('resume') as File | null

  const admin = createAdminClient()

  // 이력서 PDF 업로드
  let resumePath: string | null = null
  if (resumeFile && resumeFile.size > 0) {
    if (resumeFile.type !== 'application/pdf') {
      return { error: '이력서는 PDF 파일만 업로드 가능합니다.' }
    }
    if (resumeFile.size > 10 * 1024 * 1024) {
      return { error: '파일 크기는 10MB 이하여야 합니다.' }
    }

    const buffer = Buffer.from(await resumeFile.arrayBuffer())
    const path   = `${user.id}_${Date.now()}.pdf`

    const { error: uploadErr } = await admin.storage
      .from('coach-resumes')
      .upload(path, buffer, { contentType: 'application/pdf', upsert: true })

    if (uploadErr) return { error: `이력서 업로드 실패: ${uploadErr.message}` }
    resumePath = path
  }

  // profiles 행 보장
  await admin.from('profiles').upsert(
    { id: user.id, email: user.email ?? '', full_name: user.user_metadata?.full_name ?? null },
    { onConflict: 'id', ignoreDuplicates: true }
  )

  const { error } = await admin.from('coaches').insert({
    id: user.id,
    bio,
    domains,
    hourly_rate: hourlyRate,
    linkedin_url:      linkedinUrl,
    other_profile_url: otherUrl,
    resume_path:       resumePath,
  })

  if (error) return { error: error.message }

  redirect('/dashboard?applied=1')
}
