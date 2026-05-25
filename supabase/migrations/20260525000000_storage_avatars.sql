-- ============================================================
-- avatars 스토리지 버킷 생성 및 RLS 정책
-- Supabase SQL Editor에서 수동 실행 필요
-- ============================================================

-- 버킷 생성 (이미 존재하면 무시)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  false,
  5242880,            -- 5MB
  ARRAY['image/webp'] -- API에서 WebP로 변환 후 업로드
)
ON CONFLICT (id) DO NOTHING;

-- 인증된 사용자가 자신의 아바타 서명 URL 조회 가능
CREATE POLICY "인증된 사용자 아바타 서명 URL 생성"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );
