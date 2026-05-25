'use client'

import { useState, useActionState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { saveAvailabilityRules } from '@/app/(main)/coach/schedule/availability-actions'
import { approveSession, rejectSession } from '@/app/(main)/coach/schedule/actions'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const DAY_FULL   = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

interface AvailabilityRule {
  id: string
  day_of_week: number
  time_hhmm: string
}

interface SessionItem {
  id: string
  scheduled_at: string
  status: string
  duration_minutes: number
  price: number
  coacheeName: string
}

interface Props {
  availability: AvailabilityRule[]
  sessions: SessionItem[]
}

// ── 30분 블록 목록 생성 ──────────────────────────────────────
function makeSlots(startHour: number, endHour: number): string[] {
  const out: string[] = []
  for (let h = startHour; h < endHour; h++) {
    out.push(`${String(h).padStart(2, '0')}:00`)
    out.push(`${String(h).padStart(2, '0')}:30`)
  }
  return out
}
const SLOTS_DEFAULT = makeSlots(7, 22)   // 07:00 ~ 21:30
const SLOTS_ALL     = makeSlots(0, 24)   // 00:00 ~ 23:30

// ── 키 변환 헬퍼 ─────────────────────────────────────────────
function makeKey(dow: number, time: string) { return `${dow}:${time}` }
function parseKey(key: string): { dow: number; time: string } {
  const i = key.indexOf(':')
  return { dow: parseInt(key.slice(0, i)), time: key.slice(i + 1) }
}
function availabilityKey(av: AvailabilityRule[]): string {
  return av.map((a) => `${a.day_of_week}:${a.time_hhmm}`).sort().join(',')
}

// ── KST helpers ──────────────────────────────────────────────
function isoToKSTDateStr(iso: string): string {
  return new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}
function isoToKSTTime(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}
function dateStrDOW(dateStr: string) { return new Date(`${dateStr}T12:00:00+09:00`).getUTCDay() }
function todayKST() { return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10) }
function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate() }
function firstDOW(y: number, m: number) {
  return new Date(`${y}-${String(m).padStart(2, '0')}-01T12:00:00+09:00`).getUTCDay()
}

// ── 달력 날짜 상태 계산 ───────────────────────────────────────
type DateStatus = 'unavailable' | 'available' | 'partial' | 'full'

function computeDateStatuses(
  rules: Set<string>,
  sessions: SessionItem[],
  year: number,
  month: number,
): Map<string, DateStatus> {
  const availByDow = new Map<number, number>()
  for (const k of rules) {
    const { dow } = parseKey(k)
    availByDow.set(dow, (availByDow.get(dow) ?? 0) + 1)
  }
  const sessionsByDate = new Map<string, number>()
  for (const s of sessions) {
    if (!s.scheduled_at) continue
    const d = isoToKSTDateStr(s.scheduled_at)
    sessionsByDate.set(d, (sessionsByDate.get(d) ?? 0) + 1)
  }
  const map = new Map<string, DateStatus>()
  for (let d = 1; d <= daysInMonth(year, month); d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dow = dateStrDOW(dateStr)
    const total = availByDow.get(dow) ?? 0
    if (total === 0) { map.set(dateStr, 'unavailable'); continue }
    const booked = sessionsByDate.get(dateStr) ?? 0
    map.set(dateStr, booked === 0 ? 'available' : booked < total ? 'partial' : 'full')
  }
  return map
}

// ── 주간 그리드 ────────────────────────────────────────────────
function WeeklyGrid({
  localRules,
  onToggle,
  onToggleDay,
}: {
  localRules: Set<string>
  onToggle: (key: string) => void
  onToggleDay: (dow: number) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const slots = showAll ? SLOTS_ALL : SLOTS_DEFAULT

  return (
    <div className="border rounded-xl overflow-hidden bg-white select-none">
      {/* 헤더 — 요일 (클릭 시 요일 전체 토글) */}
      <div className="sticky top-0 z-10 bg-white border-b grid" style={{ gridTemplateColumns: '3rem repeat(7, 1fr)' }}>
        <div className="border-r" />
        {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
          const count = Array.from(localRules).filter((k) => k.startsWith(`${dow}:`)).length
          return (
            <button
              key={dow}
              type="button"
              title={`${DAY_FULL[dow]} 전체 선택/해제`}
              onClick={() => onToggleDay(dow)}
              className={cn(
                'py-2 text-center transition-colors hover:bg-blue-50 border-r last:border-r-0',
                count > 0 ? 'bg-blue-50' : '',
              )}
            >
              <span className={cn('text-xs font-bold', count > 0 ? 'text-blue-600' : 'text-gray-500')}>
                {DAY_LABELS[dow]}
              </span>
              {count > 0 && (
                <span className="block text-[10px] text-blue-400 leading-tight">{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* 셀 그리드 */}
      <div className="overflow-y-auto" style={{ maxHeight: 440 }}>
        {slots.map((time) => {
          const isHour = time.endsWith(':00')
          return (
            <div
              key={time}
              className={cn(
                'grid',
                isHour ? 'border-t border-gray-200' : 'border-t border-dashed border-gray-100',
              )}
              style={{ gridTemplateColumns: '3rem repeat(7, 1fr)' }}
            >
              {/* 시간 레이블 */}
              <div className="border-r flex items-center justify-end pr-1.5">
                {isHour && <span className="text-[10px] text-gray-400 leading-none">{time}</span>}
              </div>
              {/* 요일 셀 */}
              {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
                const key = makeKey(dow, time)
                const sel = localRules.has(key)
                return (
                  <button
                    key={dow}
                    type="button"
                    title={`${DAY_FULL[dow]} ${time}`}
                    onClick={() => onToggle(key)}
                    className={cn(
                      'h-[26px] w-full border-r last:border-r-0 transition-colors',
                      sel
                        ? 'bg-blue-400 hover:bg-blue-500'
                        : 'hover:bg-blue-50',
                    )}
                  />
                )
              })}
            </div>
          )
        })}
      </div>

      {/* 전체/간략 토글 */}
      <div className="border-t bg-gray-50 text-center py-1.5">
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="text-xs text-gray-400 hover:text-gray-700"
        >
          {showAll ? '▲ 07:00–22:00만 보기' : '▼ 전체 시간 보기 (00:00–24:00)'}
        </button>
      </div>
    </div>
  )
}

// ── 월 캘린더 ─────────────────────────────────────────────────
function MonthCalendar({
  year, month, statuses, selectedDate, onSelectDate,
}: {
  year: number
  month: number
  statuses: Map<string, DateStatus>
  selectedDate: string | null
  onSelectDate: (d: string) => void
}) {
  const today = todayKST()
  const cells: (number | null)[] = []
  const fd = firstDOW(year, month)
  for (let i = 0; i < fd; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth(year, month); d++) cells.push(d)

  return (
    <div>
      <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-1 font-medium">
        {DAY_LABELS.map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const status = statuses.get(dateStr) ?? 'unavailable'
          const isPast = dateStr < today
          const isSelected = dateStr === selectedDate
          const isToday = dateStr === today
          const clickable = status !== 'unavailable' && !isPast
          return (
            <button
              key={dateStr}
              disabled={!clickable}
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                'h-9 w-full rounded-lg text-sm font-medium transition-colors flex items-center justify-center',
                (isPast || status === 'unavailable') && 'text-gray-300 cursor-not-allowed',
                isSelected && 'bg-blue-600 text-white',
                !isSelected && !isPast && status === 'available' && 'bg-green-50 text-green-800 hover:bg-green-100',
                !isSelected && !isPast && status === 'partial'   && 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100',
                !isSelected && !isPast && status === 'full'      && 'bg-red-50 text-red-700 hover:bg-red-100',
                isToday && !isSelected && 'ring-2 ring-blue-400',
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
      <div className="flex gap-3 mt-3 text-xs text-gray-400 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block" />예약 가능</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 inline-block" />일부 예약</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block" />전체 예약</span>
      </div>
    </div>
  )
}

// ── 날짜 상세 ─────────────────────────────────────────────────
function DateDetail({
  dateStr, rules, sessions,
}: {
  dateStr: string
  rules: Set<string>
  sessions: SessionItem[]
}) {
  const dow = dateStrDOW(dateStr)
  const dayTimes = Array.from(rules)
    .filter((k) => parseKey(k).dow === dow)
    .map((k) => parseKey(k).time)
    .sort()

  const sessionsByTime = new Map<string, SessionItem>()
  for (const s of sessions) {
    if (!s.scheduled_at) continue
    if (isoToKSTDateStr(s.scheduled_at) === dateStr)
      sessionsByTime.set(isoToKSTTime(s.scheduled_at), s)
  }

  const STATUS_LABEL: Record<string, string> = { pending: '결제 완료', requested: '승인 대기', confirmed: '확정' }
  const STATUS_COLOR: Record<string, string> = { pending: 'text-blue-600', requested: 'text-yellow-600', confirmed: 'text-green-600' }

  const label = new Date(`${dateStr}T12:00:00+09:00`).toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'short',
  })

  return (
    <div className="bg-gray-50 border rounded-xl p-4 space-y-2 mt-3">
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      {dayTimes.length === 0 ? (
        <p className="text-xs text-gray-400">이 날은 가용 시간이 없습니다.</p>
      ) : (
        <div className="space-y-1">
          {dayTimes.map((t) => {
            const session = sessionsByTime.get(t)
            return (
              <div key={t} className="flex items-center gap-2 text-sm">
                <span className="font-mono font-medium w-12 text-xs">{t}</span>
                {session ? (
                  <span className={cn('text-xs', STATUS_COLOR[session.status] ?? 'text-gray-500')}>
                    {session.coacheeName} · {session.duration_minutes}분 · {STATUS_LABEL[session.status] ?? session.status}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">예약 가능</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export function ScheduleManager({ availability, sessions }: Props) {
  // 가용성 로컬 상태 (그리드 편집용)
  const [localRules, setLocalRules] = useState<Set<string>>(
    () => new Set(availability.map((a) => makeKey(a.day_of_week, a.time_hhmm)))
  )
  const [saveState, saveAction, savePending] = useActionState(saveAvailabilityRules, {})

  // props 변경(저장 후 revalidate) 시 로컬 상태 동기화
  const avKey = availabilityKey(availability)
  const prevAvKey = useRef(avKey)
  useEffect(() => {
    if (prevAvKey.current !== avKey) {
      prevAvKey.current = avKey
      setLocalRules(new Set(availability.map((a) => makeKey(a.day_of_week, a.time_hhmm))))
    }
  }, [avKey, availability])

  // isDirty 계산
  const savedKey = useMemo(() => avKey, [avKey])
  const currentKey = useMemo(
    () => Array.from(localRules).sort().join(','),
    [localRules],
  )
  const isDirty = currentKey !== savedKey

  // 셀 토글
  const handleToggle = useCallback((key: string) => {
    setLocalRules((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }, [])

  // 요일 전체 토글
  const handleToggleDay = useCallback((dow: number) => {
    setLocalRules((prev) => {
      const dayKeys = SLOTS_ALL.map((t) => makeKey(dow, t))
      const allSelected = dayKeys.every((k) => prev.has(k))
      const next = new Set(prev)
      allSelected ? dayKeys.forEach((k) => next.delete(k)) : dayKeys.forEach((k) => next.add(k))
      return next
    })
  }, [])

  // 저장용 JSON 직렬화
  const rulesJson = useMemo(
    () => JSON.stringify(
      Array.from(localRules).map((k) => {
        const { dow, time } = parseKey(k)
        return { day_of_week: dow, time_hhmm: time }
      })
    ),
    [localRules],
  )

  // 달력 상태
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const statuses = useMemo(
    () => computeDateStatuses(localRules, sessions, calYear, calMonth),
    [localRules, sessions, calYear, calMonth],
  )

  function prevMonth() {
    setCalMonth((m) => { if (m === 1) { setCalYear((y) => y - 1); return 12 } return m - 1 })
    setSelectedDate(null)
  }
  function nextMonth() {
    setCalMonth((m) => { if (m === 12) { setCalYear((y) => y + 1); return 1 } return m + 1 })
    setSelectedDate(null)
  }

  const requestedSessions = sessions.filter((s) => s.status === 'requested')

  return (
    <div className="space-y-10">

      {/* ── 1. 예약 요청 대기 ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          예약 요청 대기
          {requestedSessions.length > 0 && (
            <span className="ml-2 text-sm font-normal text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
              {requestedSessions.length}건
            </span>
          )}
        </h2>

        {requestedSessions.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center border rounded-xl bg-white">
            대기 중인 예약 요청이 없습니다.
          </p>
        ) : (
          <div className="space-y-3">
            {requestedSessions.map((s) => (
              <div key={s.id} className="bg-white border rounded-xl p-5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-medium">{s.coacheeName}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(s.scheduled_at).toLocaleString('ko-KR', {
                      timeZone: 'Asia/Seoul',
                      month: 'long', day: 'numeric', weekday: 'short',
                      hour: '2-digit', minute: '2-digit', hour12: false,
                    })} · {s.duration_minutes}분
                  </p>
                  <p className="text-sm font-medium">{s.price.toLocaleString()}원</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <form action={approveSession.bind(null, s.id)}>
                    <Button type="submit" size="sm">승인</Button>
                  </form>
                  <form action={rejectSession.bind(null, s.id)}>
                    <Button type="submit" size="sm" variant="destructive">거절</Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 2. 가용 일정 그리드 ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold">가용 일정 설정</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              셀을 클릭해 30분 단위로 가용 시간을 선택하세요. 요일 헤더 클릭 시 전체 선택/해제됩니다.
            </p>
          </div>
          <form action={saveAction}>
            <input type="hidden" name="rules" value={rulesJson} />
            <Button
              type="submit"
              disabled={savePending || !isDirty}
              size="sm"
              className={cn(isDirty ? 'bg-blue-600 hover:bg-blue-700' : '')}
            >
              {savePending ? '저장 중...' : isDirty ? '변경사항 저장' : '저장됨'}
            </Button>
          </form>
        </div>

        {saveState.error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">{saveState.error}</p>
        )}

        <div className="overflow-x-auto">
          <div className="min-w-[420px]">
            <WeeklyGrid
              localRules={localRules}
              onToggle={handleToggle}
              onToggleDay={handleToggleDay}
            />
          </div>
        </div>

        <p className="text-xs text-gray-400">
          현재 선택된 블록 수: {localRules.size}개 ({localRules.size * 30}분)
        </p>
      </section>

      {/* ── 3. 캘린더 ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">내 캘린더</h2>
        <div className="bg-white border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 text-sm">
              ‹ 이전
            </button>
            <p className="font-semibold text-sm">{calYear}년 {calMonth}월</p>
            <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 text-sm">
              다음 ›
            </button>
          </div>

          <MonthCalendar
            year={calYear}
            month={calMonth}
            statuses={statuses}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          {selectedDate && (
            <DateDetail
              dateStr={selectedDate}
              rules={localRules}
              sessions={sessions}
            />
          )}
        </div>
      </section>
    </div>
  )
}
