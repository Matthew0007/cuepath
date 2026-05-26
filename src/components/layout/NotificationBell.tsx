'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

interface NotificationBellProps {
  initialUnreadCount: number
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

export function NotificationBell({ initialUnreadCount }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleOpen() {
    if (open) { setOpen(false); return }
    setOpen(true)
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)

      // 읽음 처리
      if (data.unreadCount > 0) {
        await fetch('/api/notifications', { method: 'POST' })
        setUnreadCount(0)
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative flex flex-col items-center justify-center gap-0.5 px-3 h-14 text-gray-500 hover:text-[#0A66C2] transition-colors"
        aria-label="알림"
      >
        <Bell className="w-5 h-5" />
        <span className="text-[10px] hidden md:block">알림</span>
        {unreadCount > 0 && (
          <span className="absolute top-2 right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl border border-black/10 shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between">
            <p className="font-semibold text-sm text-gray-900">알림</p>
            {notifications.length > 0 && (
              <span className="text-xs text-gray-400">{notifications.length}개</span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-black/5">
            {loading ? (
              <div className="py-8 text-center text-sm text-gray-400">불러오는 중...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">알림이 없습니다</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'px-4 py-3 hover:bg-gray-50 transition-colors',
                    !n.is_read && 'bg-[#EAF0F8]/40',
                  )}
                >
                  {n.link ? (
                    <Link href={n.link} onClick={() => setOpen(false)}>
                      <NotificationItem n={n} />
                    </Link>
                  ) : (
                    <NotificationItem n={n} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationItem({ n }: { n: Notification }) {
  return (
    <>
      <p className="text-sm font-medium text-gray-900 leading-snug">{n.title}</p>
      {n.body && <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.body}</p>}
      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
    </>
  )
}
