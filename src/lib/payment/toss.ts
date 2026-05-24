const TOSS_API_BASE = 'https://api.tosspayments.com/v1'

function authHeader() {
  const encoded = Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString('base64')
  return `Basic ${encoded}`
}

export async function confirmPayment(params: {
  paymentKey: string
  orderId: string
  amount: number
}) {
  const res = await fetch(`${TOSS_API_BASE}/payments/confirm`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
    // 결제 확인은 캐시 금지
    cache: 'no-store',
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? '결제 승인 실패')
  return data
}

export async function cancelPayment(params: {
  paymentKey: string
  cancelReason: string
}) {
  const res = await fetch(
    `${TOSS_API_BASE}/payments/${params.paymentKey}/cancel`,
    {
      method: 'POST',
      headers: {
        Authorization: authHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cancelReason: params.cancelReason }),
      cache: 'no-store',
    }
  )

  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? '결제 취소 실패')
  return data
}
