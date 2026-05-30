-- salary_tool_events: 연봉계산기 사용 상세 이벤트 수집
CREATE TABLE IF NOT EXISTS salary_tool_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id    TEXT,                    -- localStorage 기반 UUID (사용자당 1건 식별)
  user_id         UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  ip_hash         TEXT,                    -- IP + UA SHA-256 앞 16자 (중복 트래킹용)
  event_type      TEXT        NOT NULL CHECK (
                    event_type IN ('view', 'calculate', 'fill_target', 'fill_min')
                  ),
  current_company TEXT,                    -- 현재 회사명
  offer_company   TEXT,                    -- 대상 회사명
  current_base    BIGINT,                  -- 현재 기본급 (연, 원)
  current_bonus   BIGINT,                  -- 현재 성과급 (연, 원)
  offer_base      BIGINT,                  -- 대상 기본급 (연, 원)
  offer_bonus     BIGINT,                  -- 대상 성과급 (연, 원)
  target_pct      INTEGER,                 -- 목표 인상률 (%)
  min_pct         INTEGER,                 -- 최소 인상률 (%)
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE salary_tool_events ENABLE ROW LEVEL SECURITY;

-- 누구든 INSERT 가능 (비로그인 포함)
CREATE POLICY "Anyone can insert salary tool event"
  ON salary_tool_events
  FOR INSERT
  WITH CHECK (true);

-- 관리자만 SELECT 가능
CREATE POLICY "Admin can select salary tool events"
  ON salary_tool_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX idx_salary_events_anonymous_id ON salary_tool_events(anonymous_id);
CREATE INDEX idx_salary_events_event_type   ON salary_tool_events(event_type);
CREATE INDEX idx_salary_events_created_at   ON salary_tool_events(created_at);
CREATE INDEX idx_salary_events_user_id      ON salary_tool_events(user_id);
