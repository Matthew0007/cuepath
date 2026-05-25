import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NavButtons } from '@/components/ui/nav-buttons'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/admin/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b px-6 py-4 flex items-center gap-4 shadow-sm">
        <span className="font-semibold text-lg">Cuepath 관리자</span>
        <nav className="flex gap-4 text-sm text-gray-500">
          <a href="/admin/coaches" className="hover:text-gray-900">컨설턴트 승인</a>
          <a href="/admin/reports" className="hover:text-gray-900">신고 처리</a>
          <a href="/admin/users" className="hover:text-gray-900">사용자 관리</a>
        </nav>
        <div className="ml-auto">
          <NavButtons />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
