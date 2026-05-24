import { useEffect, useRef } from 'react'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  is_blocked: boolean
}

interface MessageListProps {
  messages: Message[]
  currentUserId: string
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.map((msg) => {
        const isMine = msg.sender_id === currentUserId

        if (msg.is_blocked) {
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <span className="text-xs text-red-400 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                차단된 메시지
              </span>
            </div>
          )
        }

        return (
          <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                isMine
                  ? 'bg-gray-900 text-white rounded-br-sm'
                  : 'bg-white border text-gray-800 rounded-bl-sm'
              }`}
            >
              {msg.content}
              <div className={`text-[10px] mt-1 ${isMine ? 'text-gray-400' : 'text-gray-400'}`}>
                {new Date(msg.created_at).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
