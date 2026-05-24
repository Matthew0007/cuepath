-- ============================================================
-- Cuepath 초기 스키마
-- ============================================================

-- ── ENUM 타입 ─────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('coachee', 'coach', 'admin');
CREATE TYPE session_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');
CREATE TYPE penalty_level AS ENUM ('warning', 'suspended', 'banned');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'dismissed');

-- ── updated_at 자동 갱신 트리거 함수 ──────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 테이블 ────────────────────────────────────────────────

-- 1. profiles (auth.users 1:1)
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL,
  full_name   text,
  avatar_url  text,
  role        user_role NOT NULL DEFAULT 'coachee',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. coaches (profiles 1:1)
CREATE TABLE coaches (
  id            uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  bio           text,
  domains       text[] NOT NULL DEFAULT '{}',   -- 예: ARRAY['IT', '마케팅']
  hourly_rate   int NOT NULL DEFAULT 0,          -- 원 단위
  rating        numeric(3,2) NOT NULL DEFAULT 0,
  review_count  int NOT NULL DEFAULT 0,
  is_approved   boolean NOT NULL DEFAULT false,
  approved_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_coaches_updated_at
  BEFORE UPDATE ON coaches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_coaches_domains ON coaches USING GIN(domains);
CREATE INDEX idx_coaches_rating ON coaches(rating DESC);
CREATE INDEX idx_coaches_approved ON coaches(is_approved);

-- 3. sessions (코칭 예약)
CREATE TABLE sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id          uuid NOT NULL REFERENCES coaches(id),
  coachee_id        uuid NOT NULL REFERENCES profiles(id),
  status            session_status NOT NULL DEFAULT 'pending',
  duration_minutes  int NOT NULL DEFAULT 60,
  price             int NOT NULL,               -- 원 단위
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_sessions_coach ON sessions(coach_id);
CREATE INDEX idx_sessions_coachee ON sessions(coachee_id);
CREATE INDEX idx_sessions_status ON sessions(status);

-- 4. payments (토스페이먼츠)
CREATE TABLE payments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        uuid NOT NULL REFERENCES sessions(id),
  user_id           uuid NOT NULL REFERENCES profiles(id),
  amount            int NOT NULL,
  status            payment_status NOT NULL DEFAULT 'pending',
  toss_order_id     text UNIQUE NOT NULL,
  toss_payment_key  text,
  paid_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_session ON payments(session_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_toss_order ON payments(toss_order_id);

-- 5. chat_rooms
CREATE TABLE chat_rooms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL UNIQUE REFERENCES sessions(id),
  expires_at  timestamptz NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_rooms_session ON chat_rooms(session_id);
CREATE INDEX idx_chat_rooms_active ON chat_rooms(is_active) WHERE is_active = true;

-- 6. messages
CREATE TABLE messages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id        uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id      uuid NOT NULL REFERENCES profiles(id),
  content        text NOT NULL,
  attachment_url text,
  is_blocked     boolean NOT NULL DEFAULT false,
  block_reason   text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_room ON messages(room_id, created_at);

-- 7. reviews
CREATE TABLE reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL UNIQUE REFERENCES sessions(id),
  coachee_id  uuid NOT NULL REFERENCES profiles(id),
  coach_id    uuid NOT NULL REFERENCES coaches(id),
  rating      smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content     text,
  is_visible  boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_coach ON reviews(coach_id);

-- 8. penalties (차단 페널티)
CREATE TABLE penalties (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id),
  level       penalty_level NOT NULL,
  reason      text NOT NULL,
  expires_at  timestamptz,            -- warning/banned: NULL, suspended: +24h
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_penalties_user ON penalties(user_id, created_at DESC);

-- 9. reports (신고)
CREATE TABLE reports (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id       uuid NOT NULL REFERENCES profiles(id),
  reported_user_id  uuid NOT NULL REFERENCES profiles(id),
  message_id        uuid REFERENCES messages(id),
  reason            text NOT NULL,
  status            report_status NOT NULL DEFAULT 'pending',
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_status ON reports(status) WHERE status = 'pending';

-- ── RLS 활성화 ────────────────────────────────────────────

ALTER TABLE profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews    ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalties  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports    ENABLE ROW LEVEL SECURITY;

-- ── RLS 정책 ─────────────────────────────────────────────

-- profiles
CREATE POLICY "본인 프로필 조회" ON profiles FOR SELECT USING (true);
CREATE POLICY "본인 프로필 수정" ON profiles FOR UPDATE USING (auth.uid() = id);

-- coaches
CREATE POLICY "승인된 코치 공개 조회" ON coaches FOR SELECT USING (is_approved = true);
CREATE POLICY "코치 본인 조회" ON coaches FOR SELECT USING (auth.uid() = id);
CREATE POLICY "코치 본인 수정" ON coaches FOR UPDATE USING (auth.uid() = id);

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
CREATE POLICY "후기 공개 조회" ON reviews FOR SELECT USING (is_visible = true);
CREATE POLICY "코치이 후기 작성" ON reviews FOR INSERT
  WITH CHECK (auth.uid() = coachee_id);

-- penalties
CREATE POLICY "본인 페널티 조회" ON penalties FOR SELECT USING (auth.uid() = user_id);

-- reports
CREATE POLICY "본인 신고 조회" ON reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "신고 생성" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ── auth 트리거 (회원가입 시 profiles 자동 생성) ──────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
