'use client'

import { useState } from 'react'
import { loadTossPayments } from '@tosspayments/tosspayments-sdk'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SESSION_OPTIONS } from '@/lib/constants'
import { createSessionForPayment } from '@/app/(main)/booking/actions'

interface AvailabilityRule {
  day_of_week: number
  time_hhmm: string
}

interface BookingFormProps {
  coachId: string
  coachName: string
  availability: AvailabilityRule[]
  bookedDatetimes: string[] // UTC ISO strings of already-booked sessions
  userId: string
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

// ── KST helpers ──────────────────────────────────────────────
function isoToKSTDateStr(iso: string): string {
  return new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}
function isoToKSTTime(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}
function dateStrDOW(dateStr: string): number {
  return new Date(`${dateStr}T12:00:00+09:00`).getUTCDay()
}
function todayKST(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}
function firstDOW(year: number, month: number): number {
  return new Date(`${year}-${String(month).padStart(2, '0')}-01T12:00:00+09:00`).getUTCDay()
}

type DateStatus = 'unavailable' | 'available' | 'partial' | 'full'

function computeDateStatuses(
  availability: AvailabilityRule[],
  bookedDatetimes: string[],
  year: number,
  month: number,
): Map<string, DateStatus> {
  const map = new Map<string, DateStatus>()

  const availByDow = new Map<number, number>()
  for (const a of availability) {
    availByDow.set(a.day_of_week, (availByDow.get(a.day_of_week) ?? 0) + 1)
  }

  const bookedByDate = new Map<string, number>()
  for (const iso of bookedDatetimes) {
    const d = isoToKSTDateStr(iso)
    bookedByDate.set(d, (bookedByDate.get(d) ?? 0) + 1)
  }

  const days = daysInMonth(year, month)
  for (let d = 1; d <= days; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dow = dateStrDOW(dateStr)
    const totalSlots = availByDow.get(dow) ?? 0
    if (totalSlots === 0) { map.set(dateStr, 'unavailable'); continue }
    const booked = bookedByDate.get(dateStr) ?? 0
    if (booked === 0) map.set(dateStr, 'available')
    else if (booked < totalSlots) map.set(dateStr, 'partial')
    else map.set(dateStr, 'full')
  }

  return map
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
          const isToday = dateStr === today
          const isSelected = dateStr === selectedDate
          const isClickable = status !== 'full' && status !== 'unavailable' && !isPast

          return (
            <button
              key={dateStr}
              disabled={!isClickable}
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                'h-9 w-full rounded-lg text-sm font-medium transition-colors flex items-center justify-center',
                (isPast || status === 'unavailable') && 'text-gray-300 cursor-not-allowed',
                status === 'full' && !isPast && 'text-gray-400 bg-gray-100 cursor-not-allowed',
                isSelected && 'bg-blue-600 text-white',
                !isSelected && !isPast && status === 'available' && 'bg-green-50 text-green-800 hover:bg-green-100',
                !isSelected && !isPast && status === 'partial' && 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100',
                isToday && !isSelected && 'ring-2 ring-blue-400',
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
      <div className="flex gap-3 mt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block" />예약 가능</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 inline-block" />일부 마감</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block" />마감</span>
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export function BookingForm({ coachId, coachName, availability, bookedDatetimes, userId }: BookingFormProps) {
  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const statuses = computeDateStatuses(availability, bookedDatetimes, calYear, calMonth)

  // 선택된 날짜의 가용 시간 목록
  const availableTimesForDate = selectedDate
    ? (() => {
        const dow = dateStrDOW(selectedDate)
        const bookedTimesOnDate = new Set(
          bookedDatetimes
            .filter((iso) => isoToKSTDateStr(iso) === selectedDate)
            .map((iso) => isoToKSTTime(iso))
        )
        return availability
          .filter((a) => a.day_of_week === dow)
          .map((a) => ({ time: a.time_hhmm, booked: bookedTimesOnDate.has(a.time_hhmm) }))
          .sort((a, b) => a.time.localeCompare(b.time))
      })()
    : []

  function handleDateSelect(date: string) {
    setSelectedDate(date)
    setSelectedTime(null)
    setSelectedDuration(null)
  }

  function prevMonth() {
    if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12) }
    else setCalMonth(m => m - 1)
    setSelectedDate(null); setSelectedTime(null)
  }
  function nextMonth() {
    if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1) }
    else setCalMonth(m => m + 1)
    setSelectedDate(null); setSelectedTime(null)
  }

  const option = SESSION_OPTIONS.find((o) => o.duration === selectedDuration)

  async function handlePay() {
    if (!selectedDate || !selectedTime || !option) return
    setLoading(true)
    setError(null)

    try {
      const result = await createSessionForPayment(
        coachId,
        selectedDate,
        selectedTime,
        option.duration,
        option.userPrice,
      )
      if ('error' in result) { setError(result.error); return }

      const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!)
      const payment = tossPayments.payment({ customerKey: userId })
      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: result.amount },
        orderId: result.orderId,
        orderName: `${coachName} 컨설팅 (${option.duration}분)`,
        successUrl: `${window.location.origin}/booking/success`,
        failUrl: `${window.location.origin}/booking/fail`,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (!msg.includes('PAY_PROCESS_CANCELED')) setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (availability.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center">
        <p className="text-gray-400 text-sm">컨설턴트가 아직 가용 일정을 등록하지 않았습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* 달력 */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
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
          onSelectDate={handleDateSelect}
        />
      </div>

      {/* 날짜 선택 후 시간 목록 */}
      {selectedDate && (
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <h2 className="font-medium text-sm">
            {new Date(`${selectedDate}T12:00:00+09:00`).toLocaleDateString('ko-KR', {
              timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'short',
            })} — 시간 선택
          </h2>
          {availableTimesForDate.length === 0 ? (
            <p className="text-sm text-gray-400">이 날짜의 시간이 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableTimesForDate.map(({ time, booked }) => (
                <button
                  key={time}
                  type="button"
                  disabled={booked}
                  onClick={() => { setSelectedTime(time); setSelectedDuration(null) }}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm border transition-colors',
                    booked && 'border-gray-100 bg-gray-100 text-gray-300 cursor-not-allowed',
                    !booked && selectedTime === time && 'border-gray-900 bg-gray-900 text-white',
                    !booked && selectedTime !== time && 'border-gray-200 hover:border-gray-500',
                  )}
                >
                  {time}
                  {booked && <span className="ml-1 text-xs">마감</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 상담 시간 선택 */}
      {selectedTime && (
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <h2 className="font-medium text-sm">상담 시간 선택</h2>
          <div className="grid grid-cols-2 gap-3">
            {SESSION_OPTIONS.map((o) => (
              <button
                key={o.duration}
                type="button"
                onClick={() => setSelectedDuration(o.duration)}
                className={cn(
                  'rounded-xl border p-4 text-left transition-colors',
                  selectedDuration === o.duration
                    ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                    : 'border-gray-200 hover:border-gray-500',
                )}
              >
                <p className="font-semibold">{o.duration}분</p>
                <p className="text-sm text-gray-500 mt-0.5">{o.userPrice.toLocaleString()}원</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 예약 요약 */}
      {selectedDate && selectedTime && option && (
        <div className="bg-white rounded-xl border divide-y text-sm">
          <div className="px-5 py-3 flex justify-between">
            <span className="text-gray-500">컨설턴트</span>
            <span className="font-medium">{coachName}</span>
          </div>
          <div className="px-5 py-3 flex justify-between">
            <span className="text-gray-500">예약 일시</span>
            <span>
              {new Date(`${selectedDate}T${selectedTime}:00+09:00`).toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
                month: 'long', day: 'numeric', weekday: 'short',
                hour: '2-digit', minute: '2-digit', hour12: false,
              })}
            </span>
          </div>
          <div className="px-5 py-3 flex justify-between">
            <span className="text-gray-500">상담 시간</span>
            <span>{option.duration}분</span>
          </div>
          <div className="px-5 py-3 flex justify-between font-medium">
            <span>결제 금액</span>
            <span className="text-lg font-semibold">{option.userPrice.toLocaleString()}원</span>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">{error}</p>}

      <p className="text-xs text-gray-400">
        결제 완료 후 컨설턴트가 승인하면 예약이 확정됩니다. 예약 확정 시 예약 시간에 채팅방이 열립니다.
      </p>

      <Button
        onClick={handlePay}
        disabled={!selectedDate || !selectedTime || !option || loading}
        className="w-full"
        size="lg"
      >
        {loading ? '처리 중...' : option ? `${option.userPrice.toLocaleString()}원 결제하기` : '날짜·시간·상담 시간을 선택하세요'}
      </Button>
    </div>
  )
}
