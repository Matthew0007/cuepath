import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_EVENTS = ['view', 'calculate', 'fill_target', 'fill_min'] as const

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      event_type?: string
      anonymous_id?: string
      current_company?: string
      offer_company?: string
      current_base?: number
      current_bonus?: number
      offer_base?: number
      offer_bonus?: number
      target_pct?: number
      min_pct?: number
    }

    if (!body.event_type || !VALID_EVENTS.includes(body.event_type as typeof VALID_EVENTS[number])) {
      return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // IP + User-Agent 기반 해시 (중복 트래킹 보조)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'
    const ua = (request.headers.get('user-agent') || '').slice(0, 100)
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(`${ip}:${ua}`)
    )
    const ipHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 16)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('salary_tool_events').insert({
      anonymous_id:    body.anonymous_id    ?? null,
      user_id:         user?.id             ?? null,
      ip_hash:         ipHash,
      event_type:      body.event_type,
      current_company: body.current_company ?? null,
      offer_company:   body.offer_company   ?? null,
      current_base:    body.current_base    ?? null,
      current_bonus:   body.current_bonus   ?? null,
      offer_base:      body.offer_base      ?? null,
      offer_bonus:     body.offer_bonus     ?? null,
      target_pct:      body.target_pct      ?? null,
      min_pct:         body.min_pct         ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
