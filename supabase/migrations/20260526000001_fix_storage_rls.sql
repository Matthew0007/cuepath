-- ============================================================
-- Storage RLS 정책 전면 교체
-- avatars 버킷은 private(비공개)이고 모든 업로드가 서버 API를
-- 통해서만 이루어지므로, 버킷 범위 기준 허용으로 단순화
-- ============================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "인증된 사용자 아바타 서명 URL 생성"  ON storage.objects;
DROP POLICY IF EXISTS "인증된 사용자 아바타 업로드"         ON storage.objects;
DROP POLICY IF EXISTS "인증된 사용자 아바타 업데이트"       ON storage.objects;

-- 단일 정책: avatars 버킷에 대해 전체 허용
-- (버킷이 private이라 signed URL 없이 읽을 수 없으므로 안전)
CREATE POLICY "avatars 버킷 전체 허용"
  ON storage.objects FOR ALL
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');
