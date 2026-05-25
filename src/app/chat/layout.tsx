import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NavButtons } from '@/components/ui/nav-buttons'

interface ChatLayoutProps {
  children: React.ReactNode
}

export default async function ChatLayout({ children }: ChatLayoutProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b px-4 py-3 shrink-0 flex items-center gap-3">
        <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">← 대시보드</a>
        <span className="font-semibold">Cuepath</span>
        <div className="ml-auto">
          <NavButtons />
        </div>
      </header>
      {children}
    </div>
  )
}
