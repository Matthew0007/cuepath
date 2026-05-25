'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

function supabase() { return createAdminClient() }

export async function giveWarning(coachId: string, formData: FormData): Promise<void> {
  const db = supabase()
  const reason = (formData.get('reason') as string).trim()
  if (!reason) return

  await db.from('penalties').insert({ user_id: coachId, level: 'warning', reason })

  // 경고 3회 이상이면 자동 영구정지
  const { count } = await db
    .from('penalties')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', coachId)
    .eq('level', 'warning')

  if ((count ?? 0) >= 3) {
    await db.from('penalties').insert({
      user_id: coachId,
      level: 'banned',
      reason: `경고 ${count}회 누적에 의한 자동 영구정지`,
    })
  }

  revalidatePath(`/admin/coaches/${coachId}`)
}

export async function giveSuspension(coachId: string, formData: FormData): Promise<void> {
  const db = supabase()
  const reason = (formData.get('reason') as string).trim()
  const startsAt = formData.get('starts_at') as string
  const expiresAt = formData.get('expires_at') as string

  if (!reason || !startsAt || !expiresAt) return

  const start = new Date(`${startsAt}T00:00:00+09:00`)
  const end = new Date(`${expiresAt}T23:59:59+09:00`)
  if (end <= start) return

  await db.from('penalties').insert({
    user_id: coachId,
    level: 'suspended',
    reason,
    starts_at: start.toISOString(),
    expires_at: end.toISOString(),
  })

  // 활동정지 기간 내 available 슬롯 → blocked
  await db
    .from('coach_slots')
    .update({ status: 'blocked' })
    .eq('coach_id', coachId)
    .eq('status', 'available')
    .gte('start_at', start.toISOString())
    .lte('start_at', end.toISOString())

  revalidatePath(`/admin/coaches/${coachId}`)
}

export async function giveBan(coachId: string, formData: FormData): Promise<void> {
  const reason = (formData.get('reason') as string).trim()
  if (!reason) return

  await supabase().from('penalties').insert({ user_id: coachId, level: 'banned', reason })
  revalidatePath(`/admin/coaches/${coachId}`)
}

export async function liftPenalty(penaltyId: string): Promise<void> {
  await supabase().from('penalties').delete().eq('id', penaltyId)
  // revalidatePath는 penaltyId로 coachId를 알 수 없으므로 넓게 무효화
  revalidatePath('/admin/coaches')
}

export async function toggleSlotBlock(slotId: string, currentStatus: string): Promise<void> {
  const newStatus = currentStatus === 'blocked' ? 'available' : 'blocked'
  await supabase().from('coach_slots').update({ status: newStatus }).eq('id', slotId)
  revalidatePath('/admin/coaches')
}
