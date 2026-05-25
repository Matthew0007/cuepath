import { NavButtons } from '@/components/ui/nav-buttons'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50">
      <div className="absolute top-4 right-4">
        <NavButtons />
      </div>
      {children}
    </div>
  )
}
