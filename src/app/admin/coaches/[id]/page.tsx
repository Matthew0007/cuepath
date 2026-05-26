import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { ExternalLink, FileText } from 'lucide-react'
import {
  giveWarning,
  giveSuspension,
  giveBan,
  liftPenalty,
  toggleSlotBlock,
} from './actions'

interface PageProps {
  params: Promise<{ id: string }>
}

const PENALTY_LABEL: Record<string, string> = {
  warning: '경고',
  suspended: '활동정지',
  banned: '영구정지',
}
const PENALTY_COLOR: Record<string, string> = {
  warning: 'bg-yellow-50 text-yellow-700',
  suspended: 'bg-orange-50 text-orange-700',
  banned: 'bg-red-50 text-red-700',
}
const SLOT_COLOR: Record<string, string> = {
  available: 'bg-green-50 text-green-700',
  booked: 'bg-blue-50 text-blue-700',
  blocked: 'bg-red-50 text-red-700',
}
const SLOT_LABEL: Record<string, string> = {
  available: '예약 가능',
  booked: '예약됨',
  blocked: '차단됨',
}

function fmtKST(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: 'short', day: 'numeric',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

export default async function AdminCoachDetailPage({ params }: PageProps) {
  const { id } = await params
  const db = createAdminClient()

  // 코치 + 프로필
  const { data: coach } = await db
    .from('coaches')
    .select(`
      id, bio, domains, hourly_rate, rating, review_count, is_approved, approved_at, created_at,
      linkedin_url, other_profile_url, resume_path,
      profiles!inner(full_name, email, role, created_at)
    `)
    .eq('id', id)
    .single()

  // 이력서 signed URL
  let resumeSignedUrl: string | null = null
  if (coach?.resume_path) {
    const { data: signed } = await db.storage
      .from('coach-resumes')
      .createSignedUrl(coach.resume_path, 3600)
    resumeSignedUrl = signed?.signedUrl ?? null
  }

  if (!coach) notFound()

  const profile = Array.isArray(coach.profiles) ? coach.profiles[0] : coach.profiles

  // 슬롯 (최근 7일 ~ 미래)
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: slots } = await db
    .from('coach_slots')
    .select('id, start_at, status')
    .eq('coach_id', id)
    .gte('start_at', from)
    .order('start_at', { ascending: true })

  // 예약 세션
  const { data: sessions } = await db
    .from('sessions')
    .select(`
      id, status, scheduled_at, duration_minutes, price, created_at,
      profiles!sessions_coachee_id_fkey!inner(full_name, email)
    `)
    .eq('coach_id', id)
    .order('scheduled_at', { ascending: false })
    .limit(20)

  // 페널티 이력
  const { data: penalties } = await db
    .from('penalties')
    .select('id, level, reason, starts_at, expires_at, created_at')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  const warningCount = (penalties ?? []).filter((p) => p.level === 'warning').length
  const isBanned = (penalties ?? []).some((p) => p.level === 'banned')

  // 슬롯 날짜별 그룹핑
  const slotsByDate = (slots ?? []).reduce<Record<string, typeof slots>>((acc, slot) => {
    if (!slot) return acc
    const key = new Date(slot.start_at).toLocaleDateString('ko-KR', {
      timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'short',
    })
    ;(acc[key] ??= []).push(slot)
    return acc
  }, {})

  const today = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Seoul' })

  return (
    <div className="space-y-10">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{profile?.full_name ?? '-'}</h1>
          <p className="text-sm text-gray-500 mt-1">{profile?.email}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className={cn(
            'text-xs px-2 py-1 rounded-full font-medium',
            coach.is_approved ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700',
          )}>
            {coach.is_approved ? '승인 완료' : '심사 중'}
          </span>
          {isBanned && <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-700 font-medium">영구정지</span>}
        </div>
      </div>

      {/* 기본 정보 */}
      <section className="bg-white border rounded-xl p-6 space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-y-2">
          <span className="text-gray-500">도메인</span><span>{coach.domains.join(', ')}</span>
          <span className="text-gray-500">평점</span><span>★ {coach.rating.toFixed(1)} ({coach.review_count}개)</span>
          <span className="text-gray-500">경고 횟수</span>
          <span className={cn('font-medium', warningCount >= 3 ? 'text-red-600' : warningCount > 0 ? 'text-yellow-600' : '')}>
            {warningCount}회 {warningCount >= 3 && '→ 자동 영구정지'}
          </span>
          <span className="text-gray-500">신청일</span><span>{new Date(coach.created_at).toLocaleDateString('ko-KR')}</span>
          {coach.approved_at && <><span className="text-gray-500">승인일</span><span>{new Date(coach.approved_at).toLocaleDateString('ko-KR')}</span></>}
        </div>
        {coach.bio && <p className="mt-3 text-gray-600 border-t pt-3">{coach.bio}</p>}
      </section>

      {/* 심사 자료 */}
      {(coach.linkedin_url || coach.other_profile_url || resumeSignedUrl) && (
        <section className="bg-white border rounded-xl p-6 space-y-3">
          <h2 className="font-semibold text-base">심사 자료</h2>
          <p className="text-xs text-gray-400">신청자가 제출한 자료입니다. 외부 링크는 새 탭에서 열립니다.</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {coach.linkedin_url && (
              <a
                href={coach.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm bg-[#EAF0F8] text-[#0A66C2] px-4 py-2 rounded-full hover:bg-[#0A66C2] hover:text-white transition-colors font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                LinkedIn 프로필
              </a>
            )}
            {coach.other_profile_url && (
              <a
                href={coach.other_profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                기타 프로필
              </a>
            )}
            {resumeSignedUrl && (
              <a
                href={resumeSignedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm bg-green-50 text-green-700 px-4 py-2 rounded-full hover:bg-green-100 transition-colors font-medium"
              >
                <FileText className="w-4 h-4" />
                이력서 PDF 열기
              </a>
            )}
          </div>
          {!coach.linkedin_url && !coach.other_profile_url && !resumeSignedUrl && (
            <p className="text-sm text-gray-400">제출된 자료가 없습니다.</p>
          )}
        </section>
      )}

      {/* 페널티 부여 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">페널티 부여</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 경고 */}
          <div className="bg-white border rounded-xl p-5 space-y-3">
            <p className="font-medium text-yellow-700">경고 부여</p>
            <p className="text-xs text-gray-400">현재 {warningCount}회 · 3회 누적 시 자동 영구정지</p>
            <form action={giveWarning.bind(null, id)} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="w-reason">사유</Label>
                <Input id="w-reason" name="reason" placeholder="경고 사유 입력" required />
              </div>
              <Button type="submit" size="sm" className="w-full bg-yellow-500 hover:bg-yellow-600">경고 부여</Button>
            </form>
          </div>

          {/* 활동정지 */}
          <div className="bg-white border rounded-xl p-5 space-y-3">
            <p className="font-medium text-orange-700">활동정지</p>
            <p className="text-xs text-gray-400">해당 기간 내 가용 슬롯이 모두 차단됩니다.</p>
            <form action={giveSuspension.bind(null, id)} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="s-starts">시작일</Label>
                <Input id="s-starts" name="starts_at" type="date" min={today} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="s-expires">종료일</Label>
                <Input id="s-expires" name="expires_at" type="date" min={today} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="s-reason">사유</Label>
                <Input id="s-reason" name="reason" placeholder="활동정지 사유" required />
              </div>
              <Button type="submit" size="sm" className="w-full bg-orange-500 hover:bg-orange-600">활동정지 부여</Button>
            </form>
          </div>

          {/* 영구정지 */}
          <div className="bg-white border rounded-xl p-5 space-y-3">
            <p className="font-medium text-red-700">영구정지</p>
            <p className="text-xs text-gray-400">관리자만 해제 가능합니다.</p>
            <form action={giveBan.bind(null, id)} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="b-reason">사유</Label>
                <Input id="b-reason" name="reason" placeholder="영구정지 사유 입력" required />
              </div>
              <Button type="submit" size="sm" variant="destructive" className="w-full">영구정지 부여</Button>
            </form>
          </div>
        </div>
      </section>

      {/* 페널티 이력 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">페널티 이력</h2>
        {(penalties ?? []).length === 0 ? (
          <p className="text-sm text-gray-400">페널티 이력이 없습니다.</p>
        ) : (
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['종류', '사유', '기간', '부여일', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {(penalties ?? []).map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', PENALTY_COLOR[p.level] ?? '')}>
                        {PENALTY_LABEL[p.level] ?? p.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{p.reason}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {p.starts_at ? `${fmtKST(p.starts_at)} ~ ${fmtKST(p.expires_at)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(p.created_at).toLocaleDateString('ko-KR')}</td>
                    <td className="px-4 py-3">
                      <form action={liftPenalty.bind(null, p.id)}>
                        <button type="submit" className="text-xs text-blue-500 hover:underline">해제</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 캘린더 슬롯 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">캘린더 슬롯 관리</h2>
        <p className="text-sm text-gray-500">최근 7일 ~ 미래 슬롯 표시. 관리자가 개별 슬롯을 차단/해제할 수 있습니다.</p>

        {Object.keys(slotsByDate).length === 0 ? (
          <p className="text-sm text-gray-400">등록된 슬롯이 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(slotsByDate).map(([date, dateSlots]) => (
              <div key={date}>
                <p className="text-sm text-gray-500 mb-2">{date}</p>
                <div className="flex flex-wrap gap-2">
                  {(dateSlots ?? []).map((slot) => {
                    if (!slot) return null
                    const time = new Date(slot.start_at).toLocaleTimeString('ko-KR', {
                      timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false,
                    })
                    return (
                      <form key={slot.id} action={toggleSlotBlock.bind(null, slot.id, slot.status)}>
                        <button
                          type="submit"
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                            SLOT_COLOR[slot.status] ?? 'bg-gray-100 text-gray-600',
                          )}
                          title={`${SLOT_LABEL[slot.status]} · 클릭하여 ${slot.status === 'blocked' ? '해제' : '차단'}`}
                        >
                          {time} <span className="opacity-60">({SLOT_LABEL[slot.status]})</span>
                        </button>
                      </form>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 세션 이력 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">세션 이력 (최근 20건)</h2>
        {(sessions ?? []).length === 0 ? (
          <p className="text-sm text-gray-400">세션 이력이 없습니다.</p>
        ) : (
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['예약 일시', '의뢰인', '시간', '금액', '상태'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {(sessions ?? []).map((s) => {
                  const coachee = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">{fmtKST(s.scheduled_at)}</td>
                      <td className="px-4 py-3">{coachee?.full_name ?? '-'}</td>
                      <td className="px-4 py-3">{s.duration_minutes}분</td>
                      <td className="px-4 py-3">{s.price.toLocaleString()}원</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
