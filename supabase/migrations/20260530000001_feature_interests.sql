-- feature_interests: 방문자·사용자의 기능별 관심 클릭 데이터 수집
CREATE TABLE IF NOT EXISTS feature_interests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  feature      TEXT        NOT NULL CHECK (feature IN ('salary_calculator', 'career_consulting')),
  user_id      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  anonymous_id TEXT,
  referrer     TEXT,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE feature_interests ENABLE ROW LEVEL SECURITY;

-- 누구든 INSERT 가능 (비로그인 포함)
CREATE POLICY "Anyone can insert feature interest"
  ON feature_interests
  FOR INSERT
  WITH CHECK (true);

-- 관리자만 SELECT 가능
CREATE POLICY "Admin can select feature interests"
  ON feature_interests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX idx_feature_interests_feature    ON feature_interests(feature);
CREATE INDEX idx_feature_interests_created_at ON feature_interests(created_at);
CREATE INDEX idx_feature_interests_user_id    ON feature_interests(user_id);
