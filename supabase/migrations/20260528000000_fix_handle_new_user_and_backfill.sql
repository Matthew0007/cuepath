-- ── handle_new_user 트리거 재정의 (role 포함, EXCEPTION 처리) ──────────
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

-- 트리거가 없을 경우에만 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 기존 사용자 full_name 백필 (null인 경우만) ────────────────────────
UPDATE profiles p
SET full_name = au.raw_user_meta_data->>'full_name'
FROM auth.users au
WHERE p.id = au.id
  AND p.full_name IS NULL
  AND (au.raw_user_meta_data->>'full_name') IS NOT NULL
  AND (au.raw_user_meta_data->>'full_name') <> '';
