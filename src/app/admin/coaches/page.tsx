import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { approveCoach, rejectCoach } from '../actions'
import { ExternalLink, FileText } from 'lucide-react'

export default async function AdminCoachesPage() {
  const db = createAdminClient()

  const { data: pending } = await db
    .from('coaches')
    .select(`
      id, bio, domains, hourly_rate, created_at,
      linkedin_url, other_profile_url, resume_path,
      profiles!inner(full_name, email)
    `)
    .eq('is_approved', false)
    .order('created_at', { ascending: true })

  const { data: approved } = await db
    .from('coaches')
    .select('id')
    .eq('is_approved', true)

  // 이력서 signed URL 일괄 생성
  const resumeUrls: Record<string, string> = {}
  for (const coach of pending ?? []) {
    if (coach.resume_path) {
      const { data } = await db.storage
        .from('coach-resumes')
        .createSignedUrl(coach.resume_path, 3600)
      if (data?.signedUrl) resumeUrls[coach.id] = data.signedUrl
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">컨설턴트 승인 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          대기 {pending?.length ?? 0}명 · 승인 {approved?.length ?? 0}명
        </p>
      </div>

      {pending && pending.length > 0 ? (
        <div className="space-y-4">
          {pending.map((coach) => {
            const profile = Array.isArray(coach.profiles) ? coach.profiles[0] : coach.profiles
            const resumeUrl = resumeUrls[coach.id]

            return (
              <div key={coach.id} className="bg-white rounded-xl border p-6 space-y-4">
                {/* 헤더 */}
                <div className="flex items-start justify-between">
                  <div>
                    <Link href={`/admin/coaches/${coach.id}`} className="font-medium hover:underline">
                      {profile?.full_name ?? '-'}
                    </Link>
                    <p className="text-sm text-gray-500">{profile?.email}</p>
                  </div>
                  <p className="text-sm font-medium">{coach.hourly_rate.toLocaleString()}원</p>
                </div>

                {/* 도메인 */}
                <div className="flex flex-wrap gap-1">
                  {coach.domains.map((d) => (
                    <span key={d} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{d}</span>
                  ))}
                </div>

                {/* 소개 */}
                {coach.bio && (
                  <p className="text-sm text-gray-600 line-clamp-3">{coach.bio}</p>
                )}

                {/* ── 심사 자료 ── */}
                {(coach.linkedin_url || coach.other_profile_url || resumeUrl) && (
                  <div className="border-t border-dashed border-gray-200 pt-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">심사 자료</p>
                    <div className="flex flex-wrap gap-2">
                      {coach.linkedin_url && (
                        <a
                          href={coach.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs bg-[#EAF0F8] text-[#0A66C2] px-3 py-1.5 rounded-full hover:bg-[#0A66C2] hover:text-white transition-colors font-medium"
                        >
                          <ExternalLink className="w-3 h-3" />
                          LinkedIn 프로필
                        </a>
                      )}
                      {coach.other_profile_url && (
                        <a
                          href={coach.other_profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors font-medium"
                        >
                          <ExternalLink className="w-3 h-3" />
                          기타 프로필
                        </a>
                      )}
                      {resumeUrl && (
                        <a
                          href={resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors font-medium"
                        >
                          <FileText className="w-3 h-3" />
                          이력서 PDF
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400">
                  신청일: {new Date(coach.created_at).toLocaleDateString('ko-KR')}
                </p>

                <div className="flex gap-2 pt-1">
                  <form action={approveCoach.bind(null, coach.id)}>
                    <Button type="submit" size="sm">승인</Button>
                  </form>
                  <form action={rejectCoach.bind(null, coach.id)}>
                    <Button type="submit" size="sm" variant="destructive">거부</Button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p>대기 중인 컨설턴트 신청이 없습니다.</p>
        </div>
      )}
    </div>
  )
}
