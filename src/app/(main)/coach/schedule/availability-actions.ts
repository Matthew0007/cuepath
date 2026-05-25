'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getApprovedCoach() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach } = await supabase
    .from('coaches')
    .select('id')
    .eq('id', user.id)
    .eq('is_approved', true)
    .single()

  return { supabase, user, coach }
}

export async function saveAvailabilityRules(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const { supabase, user, coach } = await getApprovedCoach()
  if (!coach) return { error: '승인된 컨설턴트만 설정할 수 있습니다.' }

  let rules: { day_of_week: number; time_hhmm: string }[] = []
  try {
    rules = JSON.parse(formData.get('rules') as string)
  } catch {
    return { error: '잘못된 데이터 형식입니다.' }
  }

  const { error: delErr } = await supabase
    .from('coach_availability')
    .delete()
    .eq('coach_id', user.id)

  if (delErr) return { error: delErr.message }

  if (rules.length > 0) {
    const { error: insErr } = await supabase
      .from('coach_availability')
      .insert(rules.map((r) => ({ coach_id: user.id, day_of_week: r.day_of_week, time_hhmm: r.time_hhmm })))
    if (insErr) return { error: insErr.message }
  }

  revalidatePath('/coach/schedule')
  return {}
}
