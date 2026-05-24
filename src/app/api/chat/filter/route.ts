import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { filterText, filterImage } from '@/lib/filter'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const body = await request.json()
  const { roomId, content, imageBase64 } = body as {
    roomId: string
    content?: string
    imageBase64?: string
  }

  if (!roomId) return NextResponse.json({ error: 'roomId 필요' }, { status: 400 })
  if (!content && !imageBase64) return NextResponse.json({ error: '내용 필요' }, { status: 400 })

  // 채팅방 유효성 + 만료 확인
  const { data: room } = await supabase
    .from('chat_rooms')
    .select('id, is_active, expires_at')
    .eq('id', roomId)
    .single()

  if (!room?.is_active || new Date(room.expires_at) <= new Date()) {
    return NextResponse.json({ error: '만료된 채팅방입니다' }, { status: 410 })
  }

  // 현재 페널티 확인 (정지·영구차단)
  const admin = createAdminClient()
  const { data: activePenalty } = await admin
    .from('penalties')
    .select('level, expires_at')
    .eq('user_id', user.id)
    .in('level', ['suspended', 'banned'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (activePenalty) {
    const isBanned = activePenalty.level === 'banned'
    const isSuspended =
      activePenalty.level === 'suspended' &&
      activePenalty.expires_at &&
      new Date(activePenalty.expires_at) > new Date()

    if (isBanned || isSuspended) {
      return NextResponse.json({ error: '메시지 전송이 제한된 계정입니다' }, { status: 403 })
    }
  }

  // 필터 실행
  let filterResult: { blocked: boolean; reason?: string } = { blocked: false }

  if (imageBase64) {
    filterResult = await filterImage(imageBase64)
  } else if (content) {
    filterResult = await filterText(content)
  }

  // 페널티 누적 처리
  if (filterResult.blocked) {
    const { data: penalties } = await admin
      .from('penalties')
      .select('id')
      .eq('user_id', user.id)

    const count = penalties?.length ?? 0
    const level = count === 0 ? 'warning' : count === 1 ? 'suspended' : 'banned'
    const expiresAt =
      level === 'suspended'
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : undefined

    await admin.from('penalties').insert({
      user_id: user.id,
      level,
      reason: filterResult.reason ?? '연락처 교환 시도',
      expires_at: expiresAt ?? null,
    })

    // 차단된 메시지도 DB에 저장 (블라인드 처리)
    await admin.from('messages').insert({
      room_id: roomId,
      sender_id: user.id,
      content: content ?? '[이미지]',
      is_blocked: true,
      block_reason: filterResult.reason,
    })

    return NextResponse.json({
      blocked: true,
      penaltyLevel: level,
      reason: filterResult.reason,
    })
  }

  // 필터 통과 → 메시지 저장
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      sender_id: user.id,
      content: content ?? '[이미지]',
      is_blocked: false,
    })
    .select('id, content, sender_id, created_at, is_blocked')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ blocked: false, message })
}
