import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatRoom } from '@/components/chat/ChatRoom'

interface ChatPageProps {
  params: Promise<{ roomId: string }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { roomId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 채팅방 + 세션 + 참여자 정보
  const { data: room } = await supabase
    .from('chat_rooms')
    .select(`
      id,
      expires_at,
      is_active,
      sessions!inner(
        coach_id,
        coachee_id,
        coaches!inner(
          profiles!inner(full_name)
        ),
        profiles!sessions_coachee_id_fkey!inner(full_name)
      )
    `)
    .eq('id', roomId)
    .single()

  if (!room) notFound()

  const session = Array.isArray(room.sessions) ? room.sessions[0] : room.sessions
  const isCoach = user.id === session.coach_id
  const isParticipant = user.id === session.coach_id || user.id === session.coachee_id
  if (!isParticipant) notFound()

  // 상대방 이름
  const otherUserName = isCoach
    ? ((Array.isArray(session.profiles) ? session.profiles[0] : session.profiles)?.full_name ?? '의뢰인')
    : ((Array.isArray(session.coaches?.profiles) ? session.coaches.profiles[0] : session.coaches?.profiles)?.full_name ?? '컨설턴트')

  // 초기 메시지 로드 (최근 100개)
  const { data: initialMessages } = await supabase
    .from('messages')
    .select('id, content, sender_id, created_at, is_blocked')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(100)

  return (
    <ChatRoom
      roomId={roomId}
      currentUserId={user.id}
      otherUserName={otherUserName}
      expiresAt={room.expires_at}
      initialMessages={initialMessages ?? []}
    />
  )
}
