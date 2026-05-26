-- ─────────────────────────────────────────────
-- 인앱 알림 테이블
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type         text NOT NULL,  -- 'session_requested' | 'session_confirmed' | 'session_rejected' | 'review_requested'
  title        text NOT NULL,
  body         text,
  link         text,
  is_read      boolean DEFAULT false NOT NULL,
  created_at   timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON notifications(user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 서비스(admin client)가 알림 생성 가능
CREATE POLICY "service insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ─────────────────────────────────────────────
-- 즐겨찾기 테이블
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coach_favorites (
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  coach_id   uuid REFERENCES coaches(id)  ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, coach_id)
);

ALTER TABLE coach_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own favorites"
  ON coach_favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
