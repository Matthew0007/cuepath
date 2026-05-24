'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  is_blocked: boolean
}

interface ChatRoomProps {
  roomId: string
  currentUserId: string
  otherUserName: string
  expiresAt: string
  initialMessages: Message[]
}

function useCountdown(expiresAt: string) {
  const getRemaining = useCallback(() => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    return Math.max(0, Math.floor(diff / 1000))
  }, [expiresAt])

  const [remaining, setRemaining] = useState(getRemaining)

  useEffect(() => {
    if (remaining === 0) return
    const id = setInterval(() => setRemaining(getRemaining()), 1000)
    return () => clearInterval(id)
  }, [remaining, getRemaining])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  return { remaining, label: `${minutes}:${seconds.toString().padStart(2, '0')}` }
}

export function ChatRoom({
  roomId,
  currentUserId,
  otherUserName,
  expiresAt,
  initialMessages,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const { remaining, label } = useCountdown(expiresAt)
  const isExpired = remaining === 0

  useEffect(() => {
    const supabase = createClient()

    // Realtime 구독: 새 메시지 수신
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          // 내가 보낸 메시지는 onSent 콜백으로 이미 추가됨 → 중복 방지
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  function handleSent(message: Message) {
    setMessages((prev) => [...prev, message])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* 헤더 */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0">
        <div>
          <p className="font-medium">{otherUserName}</p>
          <p className="text-xs text-gray-400">코칭 세션</p>
        </div>
        <div className={`text-sm font-mono font-medium ${remaining <= 300 ? 'text-red-500' : 'text-gray-700'}`}>
          {isExpired ? '세션 종료' : `남은 시간 ${label}`}
        </div>
      </div>

      {isExpired && (
        <div className="bg-yellow-50 border-b border-yellow-100 px-4 py-2 text-center text-sm text-yellow-700">
          세션이 종료되었습니다. 메시지를 더 이상 보낼 수 없습니다.
        </div>
      )}

      <MessageList messages={messages} currentUserId={currentUserId} />
      <MessageInput roomId={roomId} onSent={handleSent} disabled={isExpired} />
    </div>
  )
}
