import Link from 'next/link'
import { AvatarImage } from '@/components/ui/avatar-image'

interface LeftSidebarProps {
  userName: string
  avatarUrl: string | null
  role: string
  email?: string
}

const ROLE_LABEL: Record<string, string> = {
  coachee: '의뢰인',
  coach: '컨설턴트',
  admin: '관리자',
}

export function LeftSidebar({ userName, avatarUrl, role, email }: LeftSidebarProps) {
  const homeHref = role === 'coach' ? '/coach/dashboard' : '/dashboard'

  return (
    <aside className="hidden md:flex flex-col gap-3 w-[220px] shrink-0">
      {/* 프로필 카드 */}
      <div className="bg-white rounded-xl border border-black/10 overflow-hidden shadow-sm">
        {/* 배경 배너 */}
        <div className="h-14 bg-gradient-to-r from-[#0A66C2] to-[#004182]" />
        {/* 아바타 */}
        <div className="px-4 pb-4">
          <div className="-mt-7 mb-2">
            <AvatarImage src={avatarUrl} name={userName} size={56} className="ring-2 ring-white" />
          </div>
          <p className="font-semibold text-sm text-gray-900 leading-tight">{userName}</p>
          {email && <p className="text-xs text-gray-500 mt-0.5 truncate">{email}</p>}
          <span className="inline-block mt-1.5 text-[11px] px-2 py-0.5 rounded-full bg-[#EAF0F8] text-[#0A66C2] font-medium">
            {ROLE_LABEL[role] ?? role}
          </span>
        </div>

        <div className="border-t border-black/10 px-4 py-3 space-y-2">
          <Link href="/profile" className="block text-xs text-gray-600 hover:text-[#0A66C2] hover:underline">
            프로필 수정
          </Link>
          {role === 'coach' && (
            <Link href="/coach/schedule" className="block text-xs text-gray-600 hover:text-[#0A66C2] hover:underline">
              일정 관리
            </Link>
          )}
          {role === 'admin' && (
            <Link href="/admin" className="block text-xs text-gray-600 hover:text-[#0A66C2] hover:underline">
              관리자 콘솔
            </Link>
          )}
        </div>
      </div>

      {/* 빠른 링크 카드 */}
      <div className="bg-white rounded-xl border border-black/10 shadow-sm p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">빠른 이동</p>
        {role === 'coach' ? (
          <>
            <Link href="/coach/dashboard" className="block text-sm text-gray-700 hover:text-[#0A66C2] py-0.5">홈</Link>
            <Link href="/sessions" className="block text-sm text-gray-700 hover:text-[#0A66C2] py-0.5">세션 목록</Link>
            <Link href="/coach/schedule" className="block text-sm text-gray-700 hover:text-[#0A66C2] py-0.5">일정 설정</Link>
            <Link href="/coaches" className="block text-sm text-gray-700 hover:text-[#0A66C2] py-0.5">컨설턴트 목록</Link>
          </>
        ) : (
          <>
            <Link href="/dashboard" className="block text-sm text-gray-700 hover:text-[#0A66C2] py-0.5">홈</Link>
            <Link href="/coaches" className="block text-sm text-gray-700 hover:text-[#0A66C2] py-0.5">컨설턴트 찾기</Link>
            <Link href="/sessions" className="block text-sm text-gray-700 hover:text-[#0A66C2] py-0.5">내 세션</Link>
          </>
        )}
      </div>
    </aside>
  )
}
