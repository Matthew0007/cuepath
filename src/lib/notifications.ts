import { createAdminClient } from '@/lib/supabase/admin'

type NotificationType =
  | 'session_requested'
  | 'session_confirmed'
  | 'session_rejected'
  | 'review_requested'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  body?: string
  link?: string
}

export async function createNotification(params: CreateNotificationParams) {
  const db = createAdminClient()
  const { error } = await db.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    link: params.link ?? null,
  })
  if (error) console.error('[Notification] 생성 실패', error)
}
