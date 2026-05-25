import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LogoutButton } from '@/components/ui/logout-button'
import { NavButtons } from '@/components/ui/nav-buttons'
import { AvatarImage } from '@/components/ui/avatar-image'

interface MainLayoutProps {
  children: React.ReactNode
}

export default async function MainLayout({ children }: MainLayoutProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <span className="font-semibold text-lg">Cuepath</span>
        <div className="flex items-center gap-4">
          <NavButtons />
          <Link
            href="/profile"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <AvatarImage src={avatarSignedUrl} name={profile?.full_name} size={32} />
            <span className="text-sm text-gray-700 font-medium">
              {profile?.full_name ?? user.email}
            </span>
          </Link>
          <LogoutButton />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
