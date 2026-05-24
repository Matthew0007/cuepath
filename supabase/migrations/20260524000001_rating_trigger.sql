-- reviews INSERT/UPDATE 시 coaches.rating·review_count 자동 갱신
CREATE OR REPLACE FUNCTION update_coach_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coaches
  SET
    rating = (
      SELECT COALESCE(ROUND(AVG(rating::numeric), 2), 0)
      FROM reviews
      WHERE coach_id = NEW.coach_id AND is_visible = true
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE coach_id = NEW.coach_id AND is_visible = true
    )
  WHERE id = NEW.coach_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_coach_rating
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_coach_rating();

-- 관리자 전용 RLS 정책 추가
-- reports: 관리자 전체 조회
CREATE POLICY "관리자 신고 전체 조회" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "관리자 신고 상태 수정" ON reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- penalties: 관리자 전체 조회
CREATE POLICY "관리자 페널티 전체 조회" ON penalties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- reviews: 관리자 블라인드 처리
CREATE POLICY "관리자 후기 수정" ON reviews
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
