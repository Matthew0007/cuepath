import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AppNav } from '@/components/layout/AppNav'
import { LeftSidebar } from '@/components/layout/LeftSidebar'

interface MainLayoutProps {
  children: React.ReactNode
}

export default async function MainLayout({ children }: MainLayoutProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, role')
    .eq('id', user.id)
    .single()

  let avatarSignedUrl: string | null = null
  if (profile?.avatar_url) {
    const admin = createAdminClient()
    const { data } = await admin.storage
      .from('avatars')
      .createSignedUrl(profile.avatar_url, 3600)
    avatarSignedUrl = data?.signedUrl ?? null
  }

  const role = profile?.role ?? 'coachee'
  const userName = profile?.full_name ?? user.email ?? ''

  return (
    <div className="min-h-screen bg-[#F3F2EF]">
      <AppNav userName={userName} avatarUrl={avatarSignedUrl} role={role} />
      <div className="max-w-[1128px] mx-auto px-4 pt-5 pb-20 md:pb-8 flex gap-4 items-start">
        <LeftSidebar
          userName={userName}
          avatarUrl={avatarSignedUrl}
          role={role}
          email={user.email}
        />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
