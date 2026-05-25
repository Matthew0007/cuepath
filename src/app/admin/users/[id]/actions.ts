'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

function db() { return createAdminClient() }

export async function giveWarning(userId: string, formData: FormData): Promise<void> {
  const reason = (formData.get('reason') as string).trim()
  if (!reason) return

  await db().from('penalties').insert({ user_id: userId, level: 'warning', reason })

  // 경고 3회 누적 시 자동 영구정지
  const { count } = await db()
    .from('penalties')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('level', 'warning')

  if ((count ?? 0) >= 3) {
    await db().from('penalties').insert({
      user_id: userId,
      level: 'banned',
      reason: `경고 ${count}회 누적 자동 영구정지`,
    })
  }

  revalidatePath(`/admin/users/${userId}`)
  revalidatePath('/admin/users')
}

export async function giveSuspension(userId: string, formData: FormData): Promise<void> {
  const reason   = (formData.get('reason') as string).trim()
  const startsAt = formData.get('starts_at') as string
  const expiresAt = formData.get('expires_at') as string
  if (!reason || !startsAt || !expiresAt) return

  const start = new Date(`${startsAt}T00:00:00+09:00`)
  const end   = new Date(`${expiresAt}T23:59:59+09:00`)
  if (end <= start) return

  await db().from('penalties').insert({
    user_id: userId,
    level: 'suspended',
    reason,
    starts_at: start.toISOString(),
    expires_at: end.toISOString(),
  })

  revalidatePath(`/admin/users/${userId}`)
  revalidatePath('/admin/users')
}

export async function giveBan(userId: string, formData: FormData): Promise<void> {
  const reason = (formData.get('reason') as string).trim()
  if (!reason) return

  await db().from('penalties').insert({ user_id: userId, level: 'banned', reason })
  revalidatePath(`/admin/users/${userId}`)
  revalidatePath('/admin/users')
}

export async function liftPenalty(penaltyId: string, userId: string): Promise<void> {
  await db().from('penalties').delete().eq('id', penaltyId)
  revalidatePath(`/admin/users/${userId}`)
  revalidatePath('/admin/users')
}
