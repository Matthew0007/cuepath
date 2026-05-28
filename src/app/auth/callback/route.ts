import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Supabase 이메일 인증 후 리다이렉트 처리
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      // 이메일 인증 완료 시 full_name이 profiles에 없으면 auth 메타데이터에서 동기화
      const fullName = data.user.user_metadata?.full_name as string | undefined
      if (fullName) {
        await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('id', data.user.id)
          .is('full_name', null)
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
