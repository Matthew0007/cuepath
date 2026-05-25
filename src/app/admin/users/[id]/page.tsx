import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { giveWarning, giveSuspension, giveBan, liftPenalty } from './actions'

interface PageProps {
  params: Promise<{ id: string }>
}

const PENALTY_LABEL: Record<string, string> = { warning: '경고', suspended: '활동정지', banned: '영구정지' }
const PENALTY_COLOR: Record<string, string> = {
  warning:   'bg-yellow-50 text-yellow-700',
  suspended: 'bg-orange-50 text-orange-700',
  banned:    'bg-red-50 text-red-700',
}

function fmtKST(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params
  const db = createAdminClient()

  const { data: profile } = await db
    .from('profiles')
    .select('id, full_name, email, role, avatar_url, created_at, updated_at')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  // 컨설턴트 여부
  const { data: coach } = await db
    .from('coaches')
    .select('id, is_approved, approved_at, bio, domains, hourly_rate, rating, review_count')
    .eq('id', id)
    .maybeSingle()

  // 페널티 이력
  const { data: penalties } = await db
    .from('penalties')
    .select('id, level, reason, starts_at, expires_at, created_at')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  // 세션 이력 (의뢰인으로 참여)
  const { data: sessions } = await db
    .from('sessions')
    .select(`
      id, status, scheduled_at, duration_minutes, price, created_at,
      profiles!sessions_coach_id_fkey!inner(full_name)
    `)
    .eq('coachee_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  const warningCount = (penalties ?? []).filter((p) => p.level === 'warning').length
  const isBanned     = (penalties ?? []).some((p) => p.level === 'banned')
  const today = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Seoul' })

  const ROLE_LABEL: Record<string, string> = { coachee: '의뢰인', coach: '컨설턴트', admin: '관리자' }
  const ROLE_COLOR: Record<string, string> = {
    coachee: 'bg-gray-100 text-gray-600',
    coach:   'bg-blue-50 text-blue-700',
    admin:   'bg-purple-50 text-purple-700',
  }
  const SESSION_STATUS: Record<string, string> = {
    pending: '결제대기', requested: '승인대기', confirmed: '확정',
    completed: '완료', cancelled: '취소', refunded: '환불',
  }

  return (
    <div className="space-y-10">

      {/* 헤더 */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold">{profile.full_name ?? '(이름 없음)'}</h1>
            <span className={cn('text-xs px-2 py-1 rounded-full font-medium', ROLE_COLOR[profile.role] ?? 'bg-gray-100 text-gray-600')}>
              {ROLE_LABEL[profile.role] ?? profile.role}
            </span>
            {isBanned && <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-700 font-medium">영구정지</span>}
          </div>
          <p className="text-sm text-gray-500 mt-1">{profile.email}</p>
        </div>
        {coach && (
          <Link href={`/admin/coaches/${coach.id}`} className="text-sm text-blue-600 hover:underline border border-blue-200 px-3 py-1.5 rounded-lg">
            컨설턴트 상세 페이지 →
          </Link>
        )}
      </div>

      {/* 기본 정보 */}
      <section className="bg-white border rounded-xl p-6 space-y-2 text-sm">
        <h2 className="font-semibold text-base mb-3">기본 정보</h2>
        <div className="grid grid-cols-2 gap-y-2">
          <span className="text-gray-500">이메일</span><span>{profile.email}</span>
          <span className="text-gray-500">역할</span><span>{ROLE_LABEL[profile.role] ?? profile.role}</span>
          <span className="text-gray-500">경고 횟수</span>
          <span className={cn('font-medium', warningCount >= 3 ? 'text-red-600' : warningCount > 0 ? 'text-yellow-600' : '')}>
            {warningCount}회 {warningCount >= 3 && '→ 자동 영구정지'}
          </span>
          <span className="text-gray-500">가입일</span>
          <span>{new Date(profile.created_at).toLocaleDateString('ko-KR')}</span>
          {coach && (
            <>
              <span className="text-gray-500">컨설턴트 상태</span>
              <span>{coach.is_approved ? `승인됨 (${new Date(coach.approved_at!).toLocaleDateString('ko-KR')})` : '심사 중'}</span>
              <span className="text-gray-500">평점</span>
              <span>★ {coach.rating.toFixed(1)} ({coach.review_count}건)</span>
            </>
          )}
        </div>
      </section>

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
            <p className="text-xs text-gray-400">지정 기간 동안 서비스 이용 제한</p>
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
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(p.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3">
                      <form action={liftPenalty.bind(null, p.id, id)}>
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
                  {['예약 일시', '컨설턴트', '시간', '금액', '상태'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {(sessions ?? []).map((s) => {
                  const coachProfile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">{fmtKST(s.scheduled_at)}</td>
                      <td className="px-4 py-3">{coachProfile?.full_name ?? '-'}</td>
                      <td className="px-4 py-3">{s.duration_minutes}분</td>
                      <td className="px-4 py-3">{s.price.toLocaleString()}원</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {SESSION_STATUS[s.status] ?? s.status}
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
