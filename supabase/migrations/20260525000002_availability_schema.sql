-- coach_availability: 컨설턴트 반복 가용성 (요일+시간 패턴)
-- Supabase SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS coach_availability (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    uuid NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=일,1=월,...,6=토
  time_hhmm   text NOT NULL,  -- 'HH:MM' KST 기준
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_coach_availability UNIQUE (coach_id, day_of_week, time_hhmm)
);

CREATE INDEX IF NOT EXISTS idx_coach_avail_coach ON coach_availability(coach_id);

ALTER TABLE coach_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "가용성 공개 조회"
  ON coach_availability FOR SELECT USING (true);
CREATE POLICY "코치 본인 가용성 삽입"
  ON coach_availability FOR INSERT WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "코치 본인 가용성 삭제"
  ON coach_availability FOR DELETE USING (auth.uid() = coach_id);
