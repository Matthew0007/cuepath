-- ============================================================
-- 캘린더·예약 스키마 추가
-- Supabase SQL Editor에서 순서대로 실행 (각 블록을 개별 실행)
-- ============================================================

-- 1. session_status 에 'requested' 추가 (결제 완료, 컨설턴트 승인 대기)
ALTER TYPE session_status ADD VALUE IF NOT EXISTS 'requested';

-- ============================================================
-- 위 ALTER TYPE 실행 후 아래를 별도로 실행
-- ============================================================

-- 2. 컨설턴트 가용 슬롯 테이블
CREATE TABLE IF NOT EXISTS coach_slots (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id   uuid NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  start_at   timestamptz NOT NULL,
  status     text NOT NULL DEFAULT 'available',  -- available | booked | blocked
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_coach_slot UNIQUE (coach_id, start_at)
);

CREATE INDEX IF NOT EXISTS idx_coach_slots_coach_start  ON coach_slots(coach_id, start_at);
CREATE INDEX IF NOT EXISTS idx_coach_slots_available    ON coach_slots(start_at) WHERE status = 'available';

ALTER TABLE coach_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "슬롯 전체 공개 조회"       ON coach_slots FOR SELECT USING (true);
CREATE POLICY "코치 본인 슬롯 삽입"       ON coach_slots FOR INSERT WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "코치 본인 슬롯 수정"       ON coach_slots FOR UPDATE USING (auth.uid() = coach_id);
CREATE POLICY "코치 본인 슬롯 삭제"       ON coach_slots FOR DELETE USING (auth.uid() = coach_id);

-- 3. sessions 에 슬롯 연결 및 예약 시간 컬럼 추가
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS slot_id      uuid REFERENCES coach_slots(id) ON DELETE SET NULL;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

-- 4. penalties 에 활동정지 시작일 추가
ALTER TABLE penalties ADD COLUMN IF NOT EXISTS starts_at timestamptz;

-- 5. 관리자 전용 RLS 정책 (coach_slots 서비스 역할로 관리 — 실제 쿼리는 admin client 사용)
-- service role 키는 RLS 무시하므로 별도 정책 불필요
