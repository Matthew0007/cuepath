'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function submitReview(sessionId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rating = parseInt(formData.get('rating') as string, 10)
  const content = formData.get('content') as string

  if (!rating || rating < 1 || rating > 5) return { error: '평점을 선택해주세요.' }

  // 세션 확인 (완료 + 본인 세션)
  const { data: session } = await supabase
    .from('sessions')
    .select('id, coach_id, coachee_id, status')
    .eq('id', sessionId)
    .eq('coachee_id', user.id)
    .eq('status', 'completed')
    .single()

  if (!session) return { error: '후기를 작성할 수 없는 세션입니다.' }

  // 중복 확인
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
