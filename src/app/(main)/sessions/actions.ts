'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import {
  sendSessionConfirmedEmail,
  sendSessionRejectedEmail,
} from '@/lib/email'

export async function submitReview(sessionId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rating = parseInt(formData.get('rating') as string, 10)
  const content = formData.get('content') as string

  if (!rating || rating < 1 || rating > 5) return { error: '평점을 선택해주세요.' }

  const { data: session } = await supabase
    .from('sessions')
    .select('id, coach_id, coachee_id, status')
    .eq('id', sessionId)
    .eq('coachee_id', user.id)
    .eq('status', 'completed')
    .single()

  if (!session) return { error: '후기를 작성할 수 없는 세션입니다.' }

  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('session_id', sessionId)
    .maybeSingle()

  if (existing) return { error: '이미 후기를 작성하셨습니다.' }

  const { error } = await supabase.from('reviews').insert({
    session_id: sessionId,
    coachee_id: user.id,
    coach_id: session.coach_id,
    rating,
    content: content || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/sessions')
  redirect('/sessions?reviewed=1')
}

export async function confirmSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // 세션 조회 (코치 본인 + requested 상태 검증)
  const { data: session } = await admin
    .from('sessions')
    .select(`
      id, coach_id, coachee_id, scheduled_at, duration_minutes,
      coaches!inner(profiles!inner(full_name, email:profiles(email))),
      profiles!sessions_coachee_id_fkey!inner(full_name, email)
    `)
    .eq('id', sessionId)
    .eq('coach_id', user.id)
    .eq('status', 'requested')
    .single()

  if (!session) {
    revalidatePath('/sessions')
    return
  }

  await admin.from('sessions').update({ status: 'confirmed' }).eq('id', sessionId)

  const coachProfile = Array.isArray(session.coaches?.profiles)
    ? session.coaches.profiles[0] : session.coaches?.profiles
  const coacheeProfile = Array.isArray(session.profiles)
    ? session.profiles[0] : session.profiles

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cuepath.o-r.kr'

  // 알림 + 이메일 (병렬)
  await Promise.all([
    createNotification({
      userId: session.coachee_id,
      type: 'session_confirmed',
      title: '세션이 확정되었습니다',
      body: `${coachProfile?.full_name ?? '컨설턴트'}님이 세션을 확정했습니다.`,
      link: '/sessions',
    }),
    coacheeProfile?.email ? sendSessionConfirmedEmail({
      coacheeEmail: coacheeProfile.email,
      coacheeName: coacheeProfile.full_name ?? '의뢰인',
      coachName: coachProfile?.full_name ?? '컨설턴트',
      scheduledAt: session.scheduled_at ?? '',
      durationMinutes: session.duration_minutes,
      sessionLink: `${siteUrl}/sessions`,
    }) : Promise.resolve(),
  ])

  revalidatePath('/sessions')
  revalidatePath('/coach/dashboard')
}

export async function rejectSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: session } = await admin
    .from('sessions')
    .select(`
      id, coach_id, coachee_id, slot_id,
      coaches!inner(profiles!inner(full_name)),
      profiles!sessions_coachee_id_fkey!inner(full_name, email)
    `)
    .eq('id', sessionId)
    .eq('coach_id', user.id)
    .eq('status', 'requested')
    .single()

  if (!session) {
    revalidatePath('/sessions')
    return
  }

  // 세션 취소 + 슬롯 복원
  await Promise.all([
    admin.from('sessions').update({ status: 'cancelled' }).eq('id', sessionId),
    session.slot_id
      ? admin.from('coach_slots').update({ status: 'available' }).eq('id', session.slot_id)
      : Promise.resolve(),
  ])

  const coachProfile = Array.isArray(session.coaches?.profiles)
    ? session.coaches.profiles[0] : session.coaches?.profiles
  const coacheeProfile = Array.isArray(session.profiles)
    ? session.profiles[0] : session.profiles

  await Promise.all([
    createNotification({
      userId: session.coachee_id,
      type: 'session_rejected',
      title: '세션 요청이 거부되었습니다',
      body: '결제금액 환불은 3~5 영업일 내 처리됩니다.',
      link: '/sessions',
    }),
    coacheeProfile?.email ? sendSessionRejectedEmail({
      coacheeEmail: coacheeProfile.email,
      coacheeName: coacheeProfile.full_name ?? '의뢰인',
      coachName: coachProfile?.full_name ?? '컨설턴트',
    }) : Promise.resolve(),
  ])

  revalidatePath('/sessions')
  revalidatePath('/coach/dashboard')
}
