-- ============================================================
-- 1. Storage 업로드 RLS 정책 추가 (avatars 버킷 INSERT/UPDATE)
-- ============================================================

-- 인증된 사용자가 avatars 버킷에 업로드 가능
CREATE POLICY "인증된 사용자 아바타 업로드"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

-- 인증된 사용자가 자신의 아바타 덮어쓰기 가능
CREATE POLICY "인증된 사용자 아바타 업데이트"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

-- ============================================================
-- 2. profiles 테이블에 이력·약력 컬럼 추가
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS headline    text,       -- 한 줄 소개 (현직, 직책 등)
  ADD COLUMN IF NOT EXISTS career_bio  text;       -- 자기소개 / 경력 요약

-- ============================================================
-- 3. coaches 테이블에 career_history 컬럼 추가 (컨설턴트 전용)
-- ============================================================

ALTER TABLE coaches
  ADD COLUMN IF NOT EXISTS career_history text;    -- 주요 경력 (자유 서술)
