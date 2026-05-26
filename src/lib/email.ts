import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// 커스텀 도메인 인증 전: onboarding@resend.dev 사용 (Resend 계정 이메일로만 수신 가능)
// 도메인 인증 후: RESEND_FROM_EMAIL=Cuepath <noreply@yourdomain.com> 환경변수 설정
const FROM = process.env.RESEND_FROM_EMAIL ?? 'Cuepath <onboarding@resend.dev>'

function fmtKST(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: 'long', day: 'numeric',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.log('[Email skip] RESEND_API_KEY 미설정:', subject, '→', to)
    return
  }
  // 커스텀 도메인 미인증 시: Resend 계정 이메일(RESEND_TEST_EMAIL)로만 발송 가능
  // RESEND_TEST_EMAIL 설정 시 실제 수신자 대신 해당 이메일로 리다이렉트
  const recipient = process.env.RESEND_TEST_EMAIL ?? to
  try {
    await resend.emails.send({ from: FROM, to: recipient, subject, html })
    if (process.env.RESEND_TEST_EMAIL) {
      console.log(`[Email test] 실제 수신자: ${to} → 테스트 이메일(${recipient})로 리다이렉트`)
    }
  } catch (err) {
    console.error('[Email 발송 실패]', err)
  }
}

// 예약 요청 → 컨설턴트에게
export async function sendSessionRequestedEmail({
  coachEmail, coachName, coacheeName, scheduledAt, durationMinutes, sessionLink,
}: {
  coachEmail: string
  coachName: string
  coacheeName: string
  scheduledAt: string
  durationMinutes: number
  sessionLink: string
}) {
  await send(
    coachEmail,
    `[Cuepath] 새 세션 요청이 도착했습니다`,
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="color:#0A66C2;">새 세션 요청</h2>
      <p>안녕하세요, <strong>${coachName}</strong>님.</p>
      <p><strong>${coacheeName}</strong>님이 세션을 요청했습니다.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0;">
        <tr><td style="padding:8px;border:1px solid #eee;color:#666;">예정 일시</td>
            <td style="padding:8px;border:1px solid #eee;font-weight:bold;">${fmtKST(scheduledAt)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee;color:#666;">세션 시간</td>
            <td style="padding:8px;border:1px solid #eee;">${durationMinutes}분</td></tr>
      </table>
      <a href="${sessionLink}" style="display:inline-block;background:#0A66C2;color:white;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:bold;">세션 확인하기</a>
      <p style="margin-top:24px;color:#999;font-size:12px;">Cuepath | 커리어 코칭 매칭 플랫폼</p>
    </div>
    `,
  )
}

// 예약 확정 → 코치이에게
export async function sendSessionConfirmedEmail({
  coacheeEmail, coacheeName, coachName, scheduledAt, durationMinutes, sessionLink,
}: {
  coacheeEmail: string
  coacheeName: string
  coachName: string
  scheduledAt: string
  durationMinutes: number
  sessionLink: string
}) {
  await send(
    coacheeEmail,
    `[Cuepath] 세션이 확정되었습니다`,
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="color:#0A66C2;">세션 확정</h2>
      <p>안녕하세요, <strong>${coacheeName}</strong>님.</p>
      <p><strong>${coachName}</strong> 컨설턴트가 세션을 확정했습니다.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0;">
        <tr><td style="padding:8px;border:1px solid #eee;color:#666;">예정 일시</td>
            <td style="padding:8px;border:1px solid #eee;font-weight:bold;">${fmtKST(scheduledAt)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee;color:#666;">세션 시간</td>
            <td style="padding:8px;border:1px solid #eee;">${durationMinutes}분</td></tr>
      </table>
      <p style="color:#666;font-size:14px;">예정 시간에 채팅방이 자동으로 열립니다.</p>
      <a href="${sessionLink}" style="display:inline-block;background:#0A66C2;color:white;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:bold;">세션 보기</a>
      <p style="margin-top:24px;color:#999;font-size:12px;">Cuepath | 커리어 코칭 매칭 플랫폼</p>
    </div>
    `,
  )
}

// 세션 거부 → 코치이에게
export async function sendSessionRejectedEmail({
  coacheeEmail, coacheeName, coachName,
}: {
  coacheeEmail: string
  coacheeName: string
  coachName: string
}) {
  await send(
    coacheeEmail,
    `[Cuepath] 세션 요청이 거부되었습니다`,
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="color:#b91c1c;">세션 요청 거부</h2>
      <p>안녕하세요, <strong>${coacheeName}</strong>님.</p>
      <p>죄송합니다. <strong>${coachName}</strong> 컨설턴트가 이번 세션 요청을 거부했습니다.</p>
      <p style="color:#666;font-size:14px;">결제금액 환불은 3~5 영업일 내 처리됩니다.</p>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/coaches" style="display:inline-block;background:#0A66C2;color:white;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:bold;">다른 컨설턴트 찾기</a>
      <p style="margin-top:24px;color:#999;font-size:12px;">Cuepath | 커리어 코칭 매칭 플랫폼</p>
    </div>
    `,
  )
}

// 세션 완료 후 리뷰 요청 → 코치이에게
export async function sendReviewRequestEmail({
  coacheeEmail, coacheeName, coachName, sessionId,
}: {
  coacheeEmail: string
  coacheeName: string
  coachName: string
  sessionId: string
}) {
  const reviewLink = `${process.env.NEXT_PUBLIC_SITE_URL}/sessions/${sessionId}/review`
  await send(
    coacheeEmail,
    `[Cuepath] ${coachName} 컨설턴트와의 세션은 어떠셨나요?`,
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="color:#0A66C2;">세션 후기를 남겨주세요</h2>
      <p>안녕하세요, <strong>${coacheeName}</strong>님.</p>
      <p><strong>${coachName}</strong> 컨설턴트와의 세션이 완료되었습니다.</p>
      <p style="color:#666;font-size:14px;">솔직한 후기는 다른 의뢰인에게 큰 도움이 됩니다.</p>
      <a href="${reviewLink}" style="display:inline-block;background:#0A66C2;color:white;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:bold;">후기 작성하기</a>
      <p style="margin-top:24px;color:#999;font-size:12px;">Cuepath | 커리어 코칭 매칭 플랫폼</p>
    </div>
    `,
  )
}
