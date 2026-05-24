import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { revalidatePath } from 'next/cache'

async function updateReportStatus(reportId: string, status: 'reviewed' | 'dismissed') {
  'use server'
  const supabase = createAdminClient()
  await supabase.from('reports').update({ status }).eq('id', reportId)
  revalidatePath('/admin/reports')
}

export default async function AdminReportsPage() {
  const supabase = createAdminClient()

  const { data: reports } = await supabase
    .from('reports')
    .select(`
      id,
      reason,
      status,
      created_at,
      reporter:profiles!reports_reporter_id_fkey(full_name, email),
      reported:profiles!reports_reported_user_id_fkey(full_name, email),
      messages(content)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  const pending = reports?.filter((r) => r.status === 'pending') ?? []
  const resolved = reports?.filter((r) => r.status !== 'pending') ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">신고 처리</h1>
        <p className="text-sm text-gray-500 mt-1">
          대기 {pending.length}건 · 처리 완료 {resolved.length}건
        </p>
      </div>

      {pending.length === 0 && (
        <p className="text-center py-10 text-gray-400">처리 대기 신고가 없습니다.</p>
      )}

      <div className="space-y-4">
        {reports?.map((report) => {
          const reporter = Array.isArray(report.reporter) ? report.reporter[0] : report.reporter
          const reported = Array.isArray(report.reported) ? report.reported[0] : report.reported
          const message = Array.isArray(report.messages) ? report.messages[0] : report.messages

          return (
            <div key={report.id} className={`bg-white rounded-xl border p-5 space-y-3 ${report.status !== 'pending' ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      report.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                      report.status === 'reviewed' ? 'bg-green-50 text-green-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {report.status === 'pending' ? '대기' : report.status === 'reviewed' ? '검토 완료' : '기각'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(report.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-sm">
                    <span className="text-gray-500">신고자:</span> {reporter?.full_name} ({reporter?.email})
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">피신고자:</span> {reported?.full_name} ({reported?.email})
                  </p>
                  <p className="text-sm font-medium">{report.reason}</p>
                  {message?.content && (
                    <p className="text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                      "{message.content}"
                    </p>
                  )}
                </div>

                {report.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <form action={updateReportStatus.bind(null, report.id, 'reviewed')}>
                      <Button type="submit" size="sm">처리 완료</Button>
                    </form>
                    <form action={updateReportStatus.bind(null, report.id, 'dismissed')}>
                      <Button type="submit" size="sm" variant="ghost">기각</Button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
