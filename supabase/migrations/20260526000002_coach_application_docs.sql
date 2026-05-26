-- ============================================================
-- 컨설턴트 신청 첨부자료 컬럼 추가
-- ============================================================

ALTER TABLE coaches
  ADD COLUMN IF NOT EXISTS linkedin_url       text,
  ADD COLUMN IF NOT EXISTS other_profile_url  text,
  ADD COLUMN IF NOT EXISTS resume_path        text;   -- coach-resumes 버킷 내 경로

-- ============================================================
-- 이력서 PDF 전용 private 버킷 생성
-- 관리자만 조회 (정책 없음 = service role 전용)
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'coach-resumes',
  'coach-resumes',
  false,
  10485760,                    -- 10MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 버킷에 대한 RLS 정책을 명시하지 않으면 service role만 접근 가능
-- (관리자 콘솔은 createAdminClient로만 signed URL 생성)
