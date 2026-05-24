'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'

interface MessageInputProps {
  roomId: string
  onSent: (message: {
    id: string
    content: string
    sender_id: string
    created_at: string
    is_blocked: boolean
  }) => void
  disabled?: boolean
}

export function MessageInput({ roomId, onSent, disabled }: MessageInputProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || sending || disabled) return

    setSending(true)
    setWarning(null)

    const res = await fetch('/api/chat/filter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, content: trimmed }),
    })

    const data = await res.json()
    setSending(false)

    if (data.blocked) {
      const levelMsg: Record<string, string> = {
        warning: '⚠️ 외부 연락처 교환은 금지됩니다. (1차 경고)',
        suspended: '🚫 24시간 메시지 전송이 정지됩니다. (2차)',
        banned: '🚫 계정이 영구 정지됩니다. (3차)',
      }
      setWarning(levelMsg[data.penaltyLevel] ?? '메시지가 차단되었습니다.')
      setText('')
      return
    }

    if (data.message) {
      onSent(data.message)
      setText('')
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t bg-white px-4 py-3 space-y-2">
      {warning && (
        <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{warning}</p>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? '채팅방이 만료되었습니다' : '메시지 입력 (Enter 전송, Shift+Enter 줄바꿈)'}
          disabled={disabled || sending}
          rows={1}
          className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-400"
          style={{ maxHeight: '120px', overflowY: 'auto' }}
        />
        <Button
          onClick={handleSend}
          disabled={!text.trim() || sending || disabled}
          size="sm"
          className="shrink-0"
        >
          {sending ? '...' : '전송'}
        </Button>
      </div>
    </div>
  )
}
