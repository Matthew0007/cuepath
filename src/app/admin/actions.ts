'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function approveCoach(coachId: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('coaches')
    .update({ is_approved: true, approved_at: new Date().toISOString() })
    .eq('id', coachId)
  revalidatePath('/admin/coaches')
}

export async function rejectCoach(coachId: string): Promise<void> {
  const supabase = createAdminClient()
  // 코치 row 삭제 (재신청 가능하도록)
  await supabase.from('coaches').delete().eq('id', coachId)
  revalidatePath('/admin/coaches')
}
