'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function toggleFavorite(coachId: string, currentlyFavorited: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (currentlyFavorited) {
    await supabase
      .from('coach_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('coach_id', coachId)
  } else {
    await supabase
      .from('coach_favorites')
      .insert({ user_id: user.id, coach_id: coachId })
  }

  revalidatePath('/coaches')
  revalidatePath(`/coaches/${coachId}`)
  revalidatePath('/dashboard')
}
