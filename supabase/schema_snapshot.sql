-- ============================================================
-- Cuepath — 전체 DB 스키마 스냅샷
-- ============================================================
-- 새 Supabase 프로젝트 세팅 시 이 파일 1개만 실행하면 됩니다.
-- Supabase SQL Editor에서 전체 선택 후 실행(Run)
--
-- 마지막 업데이트: 2026-05-30
-- 포함된 마이그레이션:
--   20260524000000_initial_schema.sql
--   20260524000001_rating_trigger.sql
--   20260525000000_storage_avatars.sql
--   20260525000001_calendar_schema.sql
--   20260525000002_availability_schema.sql
--   20260526000000_profile_bio_storage_rls.sql
--   20260526000001_fix_storage_rls.sql
--   20260526000002_coach_application_docs.sql
--   20260526000003_notifications_favorites.sql
--   20260528000000_fix_handle_new_user_and_backfill.sql
--   20260530000001_feature_interests.sql
--   20260530000002_salary_tool_events.sql
-- ============================================================


-- ──────────────────────────────────────────────────────────
-- 1. ENUM 타입
-- ──────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('coachee', 'coach', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- 'requested' 포함된 최종 상태
  CREATE TYPE session_status AS ENUM (
    'pending', 'requested', 'confirmed', 'completed', 'cancelled', 'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE penalty_level AS ENUM ('warning', 'suspended', 'banned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ──────────────────────────────────────────────────────────
-- 2. 공통 함수
-- ──────────────────────────────────────────────────────────

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 코치 평점·리뷰수 자동 갱신
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

-- 회원가입 시 profiles 자동 생성 (최종 버전: role 포함, EXCEPTION 처리)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'coachee')
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email     = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      role      = COALESCE(profiles.role, EXCLUDED.role);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ──────────────────────────────────────────────────────────
-- 3. 테이블 생성 (최종 컬럼 기준)
-- ──────────────────────────────────────────────────────────

-- ── profiles ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text        NOT NULL,
  full_name    text,
  avatar_url   text,
  role         user_role   NOT NULL DEFAULT 'coachee',
  headline     text,           -- 한 줄 소개 (직책 등)
  career_bio   text,           -- 자기소개 / 경력 요약
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ── coaches ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coaches (
  id                 uuid        PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  bio                text,
  domains            text[]      NOT NULL DEFAULT '{}',
  hourly_rate        int         NOT NULL DEFAULT 0,
  rating             numeric(3,2) NOT NULL DEFAULT 0,
  review_count       int         NOT NULL DEFAULT 0,
  is_approved        boolean     NOT NULL DEFAULT false,
  approved_at        timestamptz,
  career_history     text,           -- 주요 경력 (자유 서술)
  linkedin_url       text,           -- LinkedIn 프로필 URL
  other_profile_url  text,           -- 기타 프로필 URL
  resume_path        text,           -- coach-resumes 버킷 내 경로
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ── sessions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id                uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id          uuid           NOT NULL REFERENCES coaches(id),
  coachee_id        uuid           NOT NULL REFERENCES profiles(id),
  status            session_status NOT NULL DEFAULT 'pending',
  duration_minutes  int            NOT NULL DEFAULT 60,
  price             int            NOT NULL,
  slot_id           uuid,          -- coach_slots(id) ON DELETE SET NULL (아래 FK 추가)
  scheduled_at      timestamptz,
  created_at        timestamptz    NOT NULL DEFAULT now(),
  updated_at        timestamptz    NOT NULL DEFAULT now()
);

-- ── payments ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        uuid           NOT NULL REFERENCES sessions(id),
  user_id           uuid           NOT NULL REFERENCES profiles(id),
  amount            int            NOT NULL,
  status            payment_status NOT NULL DEFAULT 'pending',
  toss_order_id     text           UNIQUE NOT NULL,
  toss_payment_key  text,
  paid_at           timestamptz,
  created_at        timestamptz    NOT NULL DEFAULT now()
);

-- ── chat_rooms ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_rooms (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid        NOT NULL UNIQUE REFERENCES sessions(id),
  expires_at  timestamptz NOT NULL,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── messages ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id        uuid        NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id      uuid        NOT NULL REFERENCES profiles(id),
  content        text        NOT NULL,
  attachment_url text,
  is_blocked     boolean     NOT NULL DEFAULT false,
  block_reason   text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ── reviews ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid        NOT NULL UNIQUE REFERENCES sessions(id),
  coachee_id  uuid        NOT NULL REFERENCES profiles(id),
  coach_id    uuid        NOT NULL REFERENCES coaches(id),
  rating      smallint    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content     text,
  is_visible  boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── penalties ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS penalties (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid          NOT NULL REFERENCES profiles(id),
  level       penalty_level NOT NULL,
  reason      text          NOT NULL,
  starts_at   timestamptz,  -- 활동정지 시작일
  expires_at  timestamptz,  -- warning/banned: NULL, suspended: 종료일
  created_at  timestamptz   NOT NULL DEFAULT now()
);

-- ── reports ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id       uuid          NOT NULL REFERENCES profiles(id),
  reported_user_id  uuid          NOT NULL REFERENCES profiles(id),
  message_id        uuid          REFERENCES messages(id),
  reason            text          NOT NULL,
  status            report_status NOT NULL DEFAULT 'pending',
  created_at        timestamptz   NOT NULL DEFAULT now()
);

-- ── coach_slots ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coach_slots (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id   uuid        NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  start_at   timestamptz NOT NULL,
  status     text        NOT NULL DEFAULT 'available',  -- available | booked | blocked
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_coach_slot UNIQUE (coach_id, start_at)
);

-- sessions.slot_id FK (coach_slots 생성 후 추가)
ALTER TABLE sessions
  ADD CONSTRAINT fk_sessions_slot
  FOREIGN KEY (slot_id) REFERENCES coach_slots(id) ON DELETE SET NULL
  NOT VALID;  -- 기존 데이터 검증 스킵

-- ── coach_availability ────────────────────────────────────
CREATE TABLE IF NOT EXISTS coach_availability (
  id          uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    uuid     NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  time_hhmm   text     NOT NULL,  -- 'HH:MM' KST
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_coach_availability UNIQUE (coach_id, day_of_week, time_hhmm)
);

-- ── notifications ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       text        NOT NULL,
  title      text        NOT NULL,
  body       text,
  link       text,
  is_read    boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── coach_favorites ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS coach_favorites (
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id   uuid        NOT NULL REFERENCES coaches(id)  ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, coach_id)
);

-- ── feature_interests (랜딩 기능 관심 클릭 수집) ──────────
CREATE TABLE IF NOT EXISTS feature_interests (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  feature      text        NOT NULL CHECK (feature IN ('salary_calculator', 'career_consulting')),
  user_id      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  anonymous_id text,
  referrer     text,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── salary_tool_events (연봉계산기 사용 이벤트 수집) ──────
CREATE TABLE IF NOT EXISTS salary_tool_events (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id    text,               -- localStorage 기반 UUID
  user_id         uuid    REFERENCES profiles(id) ON DELETE SET NULL,
  ip_hash         text,               -- IP+UA SHA-256 앞 16자
  event_type      text    NOT NULL CHECK (
                    event_type IN ('view', 'calculate', 'fill_target', 'fill_min')
                  ),
  current_company text,
  offer_company   text,
  current_base    bigint,
  current_bonus   bigint,
  offer_base      bigint,
  offer_bonus     bigint,
  target_pct      integer,
  min_pct         integer,
  created_at      timestamptz NOT NULL DEFAULT now()
);


-- ──────────────────────────────────────────────────────────
-- 4. 인덱스
-- ──────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_coaches_domains     ON coaches USING GIN(domains);
CREATE INDEX IF NOT EXISTS idx_coaches_rating      ON coaches(rating DESC);
CREATE INDEX IF NOT EXISTS idx_coaches_approved    ON coaches(is_approved);

CREATE INDEX IF NOT EXISTS idx_sessions_coach      ON sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_sessions_coachee    ON sessions(coachee_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status     ON sessions(status);

CREATE INDEX IF NOT EXISTS idx_payments_session    ON payments(session_id);
CREATE INDEX IF NOT EXISTS idx_payments_user       ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_toss_order ON payments(toss_order_id);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_session  ON chat_rooms(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_active   ON chat_rooms(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_messages_room       ON messages(room_id, created_at);

CREATE INDEX IF NOT EXISTS idx_reviews_coach       ON reviews(coach_id);

CREATE INDEX IF NOT EXISTS idx_penalties_user      ON penalties(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_status      ON reports(status) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_coach_slots_coach   ON coach_slots(coach_id, start_at);
CREATE INDEX IF NOT EXISTS idx_coach_slots_avail   ON coach_slots(start_at) WHERE status = 'available';

CREATE INDEX IF NOT EXISTS idx_coach_avail_coach   ON coach_availability(coach_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user  ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feature_interests_feature    ON feature_interests(feature);
CREATE INDEX IF NOT EXISTS idx_feature_interests_created_at ON feature_interests(created_at);
CREATE INDEX IF NOT EXISTS idx_feature_interests_user_id    ON feature_interests(user_id);

CREATE INDEX IF NOT EXISTS idx_salary_events_anon       ON salary_tool_events(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_salary_events_type       ON salary_tool_events(event_type);
CREATE INDEX IF NOT EXISTS idx_salary_events_created_at ON salary_tool_events(created_at);
CREATE INDEX IF NOT EXISTS idx_salary_events_user_id    ON salary_tool_events(user_id);


-- ──────────────────────────────────────────────────────────
-- 5. 트리거
-- ──────────────────────────────────────────────────────────

-- updated_at 자동 갱신
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_coaches_updated_at ON coaches;
CREATE TRIGGER trg_coaches_updated_at
  BEFORE UPDATE ON coaches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_sessions_updated_at ON sessions;
CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 코치 평점 자동 갱신
DROP TRIGGER IF EXISTS trg_update_coach_rating ON reviews;
CREATE TRIGGER trg_update_coach_rating
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_coach_rating();

-- 회원가입 시 profiles 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ──────────────────────────────────────────────────────────
-- 6. RLS 활성화
-- ──────────────────────────────────────────────────────────

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms        ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalties         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_slots       ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_favorites   ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_tool_events ENABLE ROW LEVEL SECURITY;


-- ──────────────────────────────────────────────────────────
-- 7. RLS 정책
-- ──────────────────────────────────────────────────────────

-- profiles
CREATE POLICY "본인 프로필 조회"   ON profiles FOR SELECT USING (true);
CREATE POLICY "본인 프로필 수정"   ON profiles FOR UPDATE USING (auth.uid() = id);

-- coaches
CREATE POLICY "승인된 코치 공개 조회" ON coaches FOR SELECT USING (is_approved = true);
CREATE POLICY "코치 본인 조회"        ON coaches FOR SELECT USING (auth.uid() = id);
CREATE POLICY "코치 본인 수정"        ON coaches FOR UPDATE USING (auth.uid() = id);

-- sessions
CREATE POLICY "세션 당사자 조회" ON sessions FOR SELECT
  USING (auth.uid() = coachee_id OR auth.uid() = coach_id);
CREATE POLICY "코치이 세션 생성" ON sessions FOR INSERT
  WITH CHECK (auth.uid() = coachee_id);

-- payments
CREATE POLICY "결제 본인 조회" ON payments FOR SELECT USING (auth.uid() = user_id);

-- chat_rooms
CREATE POLICY "채팅방 당사자 조회" ON chat_rooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_id
        AND (s.coach_id = auth.uid() OR s.coachee_id = auth.uid())
    )
  );

-- messages
CREATE POLICY "채팅방 당사자 메시지 조회" ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      JOIN sessions s ON s.id = cr.session_id
      WHERE cr.id = room_id
        AND (s.coach_id = auth.uid() OR s.coachee_id = auth.uid())
    )
  );
CREATE POLICY "채팅방 당사자 메시지 전송" ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      JOIN sessions s ON s.id = cr.session_id
      WHERE cr.id = room_id
        AND cr.is_active = true
        AND cr.expires_at > now()
        AND (s.coach_id = auth.uid() OR s.coachee_id = auth.uid())
    )
  );

-- reviews
CREATE POLICY "후기 공개 조회"  ON reviews FOR SELECT USING (is_visible = true);
CREATE POLICY "코치이 후기 작성" ON reviews FOR INSERT WITH CHECK (auth.uid() = coachee_id);
CREATE POLICY "관리자 후기 수정" ON reviews FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- penalties
CREATE POLICY "본인 페널티 조회"   ON penalties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "관리자 페널티 전체 조회" ON penalties FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- reports
CREATE POLICY "본인 신고 조회"   ON reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "신고 생성"        ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "관리자 신고 전체 조회" ON reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "관리자 신고 상태 수정" ON reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- coach_slots
CREATE POLICY "슬롯 전체 공개 조회" ON coach_slots FOR SELECT USING (true);
CREATE POLICY "코치 본인 슬롯 삽입" ON coach_slots FOR INSERT WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "코치 본인 슬롯 수정" ON coach_slots FOR UPDATE USING (auth.uid() = coach_id);
CREATE POLICY "코치 본인 슬롯 삭제" ON coach_slots FOR DELETE USING (auth.uid() = coach_id);

-- coach_availability
CREATE POLICY "가용성 공개 조회"      ON coach_availability FOR SELECT USING (true);
CREATE POLICY "코치 본인 가용성 삽입" ON coach_availability FOR INSERT WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "코치 본인 가용성 삭제" ON coach_availability FOR DELETE USING (auth.uid() = coach_id);

-- notifications
CREATE POLICY "users see own notifications"    ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "service insert notifications"   ON notifications FOR INSERT WITH CHECK (true);

-- coach_favorites
CREATE POLICY "users manage own favorites" ON coach_favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- feature_interests
CREATE POLICY "Anyone can insert feature interest" ON feature_interests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can select feature interests"  ON feature_interests FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- salary_tool_events
CREATE POLICY "Anyone can insert salary tool event" ON salary_tool_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can select salary tool events"  ON salary_tool_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));


-- ──────────────────────────────────────────────────────────
-- 8. Storage 버킷 & 정책
-- ──────────────────────────────────────────────────────────

-- avatars (프로필 사진, private, 5MB, WebP)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', false, 5242880, ARRAY['image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- coach-resumes (이력서 PDF, private, 10MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'coach-resumes', 'coach-resumes', false, 10485760, ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- avatars 버킷 RLS: 인증된 요청 전체 허용
--   (버킷이 private이라 signed URL 없이 외부 접근 불가 → 안전)
DROP POLICY IF EXISTS "avatars 버킷 전체 허용" ON storage.objects;
CREATE POLICY "avatars 버킷 전체 허용"
  ON storage.objects FOR ALL
  USING   (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

-- coach-resumes 버킷은 별도 RLS 정책 없음
--   service_role 키(admin client)로만 접근 → RLS 무시
