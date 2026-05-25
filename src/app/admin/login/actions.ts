'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function adminLogin(formData: FormData): Promise<{ error?: string }> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인에 실패했습니다.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    await supabase.auth.signOut()
    return { error: '관리자 권한이 없는 계정입니다.' }
  }

  redirect('/admin')
}
