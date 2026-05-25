# Cuepath 운영 가이드 (SOP)

> 대상: Cuepath 플랫폼 관리자  
> 최종 수정: 2026-05-25  
> 서비스 URL: https://cuepath.vercel.app

---

## 목차

1. [시스템 개요](#1-시스템-개요)
2. [초기 환경 설정](#2-초기-환경-설정)
3. [관리자 계정 생성](#3-관리자-계정-생성)
4. [관리자 콘솔 사용법](#4-관리자-콘솔-사용법)
5. [차단 시스템 구조](#5-차단-시스템-구조)
6. [결제 및 세션 흐름](#6-결제-및-세션-흐름)
7. [데이터베이스 구조](#7-데이터베이스-구조)
8. [장애 대응 절차](#8-장애-대응-절차)
9. [환경변수 목록](#9-환경변수-목록)
10. [정기 운영 체크리스트](#10-정기-운영-체크리스트)

---

## 1. 시스템 개요

Cuepath는 **1:1 커리어 코칭 매칭 마켓플레이스**입니다. 의뢰인(coachee)이 컨설턴트를 선택해 결제하면 지정된 일시에 채팅 세션이 열립니다.

### 주요 흐름

```
회원가입 → 컨설턴트 신청 → 관리자 승인
→ 컨설턴트가 가용 일정 설정
→ 의뢰인이 날짜·시간 선택 후 결제
→ 컨설턴트 승인 → 예약 확정
→ 예약 시간에 채팅방 자동 오픈 (Vercel Cron)
→ 세션 완료 → 후기 작성
```

### 기술 스택

| 구성 요소 | 사용 기술 |
|---|---|
| 프론트엔드 | Next.js 16 (App Router) + TypeScript + Tailwind CSS |
| 백엔드 / DB | Supabase (PostgreSQL + Realtime + Auth + Storage) |
| 배포 | Vercel |
| 결제 | 토스페이먼츠 |
| 메시지 차단 3층 | Claude Haiku API (claude-haiku-4-5-20251001) |
| 이미지 OCR 차단 4층 | Google Vision API |

### 페이지 구조

| 경로 | 설명 | 접근 권한 |
|---|---|---|
| `/` | 랜딩 페이지 | 전체 공개 |
| `/login` | 일반 사용자 로그인 | 비로그인만 |
| `/signup` | 회원가입 | 비로그인만 |
| `/dashboard` | 내 대시보드 | 로그인 필요 |
| `/coaches` | 컨설턴트 목록 | 로그인 필요 |
| `/coaches/apply` | 컨설턴트 신청 | 로그인 필요 |
| `/booking/[coachId]` | 예약 및 결제 (달력 UI) | 로그인 필요 |
| `/sessions` | 내 세션 목록 | 로그인 필요 |
| `/chat/[roomId]` | 채팅방 | 세션 당사자만 |
| `/coach/schedule` | 컨설턴트 가용 일정 관리 | 승인된 컨설턴트만 |
| `/profile` | 회원정보 수정 (사진 포함) | 로그인 필요 |
| `/admin/login` | 관리자 전용 로그인 | 전체 공개 |
| `/admin/coaches` | 컨설턴트 승인 관리 | admin 역할만 |
| `/admin/coaches/[id]` | 컨설턴트 상세·페널티·슬롯 관리 | admin 역할만 |
| `/admin/users` | 전체 회원 목록 | admin 역할만 |
| `/admin/users/[id]` | 회원 상세·페널티 부여 | admin 역할만 |
| `/admin/reports` | 신고 처리 | admin 역할만 |

---

## 2. 초기 환경 설정

### 2-1. Supabase 프로젝트 설정

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. 프로젝트 선택 (Project ID: `nvzvxwggbreutitngyyx`)
3. **SQL Editor → New Query** 에서 마이그레이션 파일 순서대로 실행:

   | 파일 | 내용 |
   |---|---|
   | `20260524000000_initial_schema.sql` | 기본 스키마 (profiles, coaches, sessions 등) |
   | `20260524000001_rating_trigger.sql` | 후기 평점 자동 계산 트리거 |
   | `20260525000000_storage_avatars.sql` | avatars 스토리지 버킷 생성 |
   | `20260525000001_calendar_schema.sql` | coach_slots, 세션 컬럼 추가 |
   | `20260525000002_availability_schema.sql` | coach_availability 테이블 |

4. `handle_new_user` 트리거 수동 실행 (신규 가입자 자동 프로필 생성):

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'coachee'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 2-2. Vercel 배포 설정

Vercel 프로젝트 **Settings → Environment Variables** 에서 아래 변수 등록:

```
NEXT_PUBLIC_SUPABASE_URL         (Supabase → Settings → API)
NEXT_PUBLIC_SUPABASE_ANON_KEY    (Supabase → Settings → API)
SUPABASE_SERVICE_ROLE_KEY        (Supabase → Settings → API)
TOSS_CLIENT_KEY                  (토스페이먼츠 개발자센터)
TOSS_SECRET_KEY                  (토스페이먼츠 개발자센터)
ANTHROPIC_API_KEY                (Anthropic Console)
GOOGLE_CLOUD_API_KEY             (Google Cloud Console → Vision API)
CRON_SECRET                      (랜덤 문자열, 직접 생성)
NEXT_PUBLIC_SITE_URL             https://cuepath.vercel.app
```

### 2-3. Vercel Cron 설정

`vercel.json` 에 이미 설정되어 있습니다:

```json
{
  "crons": [{ "path": "/api/room/expire", "schedule": "* * * * *" }]
}
```

> 이 Cron은 1분마다 두 가지 작업을 수행합니다:
> 1. 만료된 채팅방 비활성화 → 세션 completed 처리
> 2. confirmed 세션 중 scheduled_at에 도달한 경우 채팅방 자동 오픈

---

## 3. 관리자 계정 생성

관리자 계정은 일반 회원가입 후 Supabase SQL Editor에서 역할을 직접 변경해야 합니다.

### 절차

1. `/signup` 에서 관리자로 쓸 이메일로 회원가입
2. Supabase SQL Editor에서 아래 쿼리 실행:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = '관리자_이메일@example.com';
```

3. 변경 확인:

```sql
SELECT id, email, role FROM profiles WHERE role = 'admin';
```

4. `/admin/login` 에서 로그인 테스트

> **주의:** `role = 'admin'`이 아닌 계정은 `/admin/login`에서 로그인해도 에러가 표시되고 로그아웃됩니다.

---

## 4. 관리자 콘솔 사용법

### 접근 방법

1. **`/admin/login`** 으로 이동 (일반 로그인 페이지 `/login` 과 별개)
2. 관리자 이메일 + 비밀번호 입력
3. 로그인 성공 시 `/admin/coaches` 대시보드로 이동

---

### 4-1. 컨설턴트 승인 관리 (`/admin/coaches`)

컨설턴트 신청 현황을 확인하고 승인 또는 거부합니다.

#### 화면 구성

- **대기 N명 · 승인 N명** 카운트 표시
- 각 신청 카드: 이름(클릭 시 상세 페이지), 이메일, 시간당 금액, 활동 도메인, 자기소개, 신청일

#### 승인 처리

| 버튼 | 동작 |
|---|---|
| **승인** | `coaches.is_approved = true`, `approved_at` 기록. 해당 컨설턴트가 목록에 노출됨 |
| **거부** | `coaches` 행 삭제. 사용자는 재신청 가능 |

#### 승인 기준 (권장)

- LinkedIn 또는 이력서로 경력 확인 (오프라인)
- 커리어 전문성 보유 여부
- 자기소개가 구체적이고 성의 있을 것
- 최소 3년 이상 실무 경험

---

### 4-2. 컨설턴트 상세 관리 (`/admin/coaches/[id]`)

컨설턴트 개인 페이지에서 페널티 부여, 슬롯 관리, 세션 이력을 확인합니다.

#### 페널티 부여

| 종류 | 동작 |
|---|---|
| **경고** | 경고 횟수 누적. 3회 시 자동 영구정지 |
| **활동정지** | 시작일~종료일 지정. 해당 기간의 available 슬롯 전체 차단 |
| **영구정지** | 즉시 처리. 관리자만 해제 가능 |

#### 캘린더 슬롯 관리

- 최근 7일 ~ 미래 슬롯 표시
- 슬롯 클릭 시 available ↔ blocked 토글
- 활동정지 부여 시 해당 기간 슬롯 자동 차단

---

### 4-3. 전체 회원 관리 (`/admin/users`)

가입한 모든 회원의 목록과 현황을 확인합니다.

#### 표시 정보

| 컬럼 | 설명 |
|---|---|
| 이름 | 클릭 시 상세 페이지 이동 |
| 이메일 | 가입 이메일 |
| 역할 | 의뢰인 / 컨설턴트 / 관리자 (컨설턴트는 승인 상태도 표시) |
| 세션 | 의뢰인으로 참여한 세션 수 |
| 제재 현황 | 가장 심각한 페널티 수준과 총 건수 |
| 가입일 | 계정 생성일 |

---

### 4-4. 회원 상세 및 페널티 부여 (`/admin/users/[id]`)

개별 회원에 대한 상세 정보 확인 및 페널티 부여가 가능합니다.

#### 화면 구성

- **기본 정보**: 이름, 이메일, 역할, 경고 횟수, 가입일
  - 컨설턴트인 경우 승인 상태, 평점 표시 및 컨설턴트 상세 페이지 링크
- **페널티 부여**: 경고 / 활동정지 / 영구정지 폼
- **페널티 이력**: 과거 페널티 목록, 각 항목별 해제 버튼
- **세션 이력**: 의뢰인으로 참여한 최근 20건

#### 페널티 부여 기준

| 상황 | 권장 조치 |
|---|---|
| 외부 연락처 교환 시도 (1차) | 경고 |
| 외부 연락처 교환 시도 (2차) | 활동정지 3~7일 |
| 외부 연락처 교환 시도 (3차) | 영구정지 |
| 허위 후기 / 사기 의심 | 즉시 활동정지 후 조사 |
| 성희롱·혐오 발언 | 즉시 영구정지 |
| 경고 3회 누적 | 시스템이 자동으로 영구정지 처리 |

> 컨설턴트에게 페널티를 부여하려면 **`/admin/users/[id]`** 또는 **`/admin/coaches/[id]`** 어느 쪽에서든 가능합니다. 컨설턴트의 슬롯 차단은 `/admin/coaches/[id]` 에서만 처리할 수 있습니다.

---

### 4-5. 신고 처리 (`/admin/reports`)

사용자 신고를 검토하고 조치합니다.

#### 신고 상태

| 상태 | 의미 |
|---|---|
| `pending` (대기) | 아직 처리하지 않은 신고 |
| `reviewed` (검토 완료) | 제재 조치 등 처리 완료 |
| `dismissed` (기각) | 근거 없음으로 기각 |

#### 처리 절차

1. 신고 내용과 문제 메시지 내용 확인
2. 차단 시스템이 이미 메시지를 막았는지 확인 (`is_blocked` 여부)
3. 심각도에 따라 판단:
   - 경미한 경우 → **기각** 또는 경고
   - 반복 위반 → `/admin/users/[id]` 에서 페널티 부여
   - 명백한 위반 → **처리 완료** 후 영구 정지

---

## 5. 차단 시스템 구조

외부 연락처 교환 방지를 위한 4단계 필터링:

### 1층 — 정규식 패턴 탐지

| 탐지 대상 | 예시 |
|---|---|
| 전화번호 | `010-1234-5678`, `010 1234 5678` |
| 이메일 | `user@gmail.com` |
| SNS 연락처 | `카카오톡: xxx`, `@username`, `인스타: xxx` |
| 외부 URL | `https://...`, `www....` |

### 2층 — 한글 우회 표현 정규화 후 재탐지

| 우회 표현 | 정규화 결과 |
|---|---|
| `공일공` | `010` |
| `일이삼사` | `1234` |
| `O1O` | `010` (O→0, I→1) |
| 자음/모음 삽입 (`ㅋ`, `ㅎ`) | 제거 후 재검사 |

### 3층 — Claude Haiku LLM 의도 분류

- 1·2층을 통과했지만 의심 키워드(`연락처`, `번호 알려줘`, `개인톡`, `디엠` 등)가 감지된 경우
- Claude Haiku에 0.0~1.0 점수를 요청
- **0.3 이상** → 차단
- API 비용 절감을 위해 의심도 0.4 이상인 경우에만 호출

### 4층 — Google Vision OCR (이미지)

- 첨부 이미지에서 텍스트 추출
- 추출된 텍스트를 1·2층 패턴으로 재검사
- 이미지로 연락처를 우회하는 시도 차단

### 차단 시 처리 흐름

```
메시지 전송
  → 1·2층 패턴 검사
    → 통과: 3층 의심도 확인 (필요 시 LLM 호출)
      → 통과: 메시지 저장 (is_blocked = false)
      → 차단: 메시지 저장 (is_blocked = true), 페널티 기록
    → 차단: 즉시 차단, 페널티 기록
```

### 페널티 자동 누적 기준

| 횟수 | 조치 |
|---|---|
| 1차 | 경고 + 메시지 차단 |
| 2차 | 24시간 이용 정지 |
| 3차 | 영구 정지 + 채팅방 블라인드 |

---

## 6. 결제 및 세션 흐름

### 세션 요금

| 구분 | 30분 | 50분 |
|---|---|---|
| 사용자 결제 금액 | 40,000원 | 70,000원 |
| 플랫폼 수수료 | 15,000원 | 15,000원 |
| 컨설턴트 수령 | 25,000원 | 55,000원 |

> 컨설턴트 화면에는 수령 금액이 표시되지 않습니다. 정산 기능은 추후 개발 예정입니다.

### 전체 예약·결제 흐름

```
1. 의뢰인이 컨설턴트 프로필에서 [예약하기] 클릭 → /booking/[coachId]
2. 달력에서 날짜 클릭 → 가용 시간 목록 표시
3. 시간 선택 → 상담 시간 선택 (30분 / 50분)
4. 토스페이먼츠 결제창 오픈
5. 결제 성공 → /booking/success → /api/payment/confirm 호출
6. 서버: 금액 검증 → 토스페이먼츠 최종 승인
   → sessions.status = 'requested', payments.status = 'paid'
   → coach_slots 슬롯 'booked' 처리
7. 컨설턴트가 /coach/schedule 에서 예약 승인 → sessions.status = 'confirmed'
8. scheduled_at 도달 시 Vercel Cron이 채팅방 자동 오픈
9. 의뢰인·컨설턴트 모두 /chat/[roomId] 에서 채팅
10. 채팅방 만료 시 sessions.status = 'completed'
11. 의뢰인이 후기 작성 가능
```

### 세션 상태 값

| 상태 | 의미 |
|---|---|
| `pending` | 결제 대기 중 (세션 생성됨, 결제 미완료) |
| `requested` | 결제 완료, 컨설턴트 승인 대기 중 |
| `confirmed` | 컨설턴트 승인 완료, 예약 확정 |
| `completed` | 세션 종료 (채팅방 만료) |
| `cancelled` | 컨설턴트 거절 또는 취소됨 |
| `refunded` | 환불 완료 |

### 컨설턴트 가용 일정 시스템

컨설턴트는 `/coach/schedule` 에서 반복 가용 일정을 설정합니다:
- **주간 그리드**: 요일(열) × 30분 단위 시간(행) 셀 클릭으로 선택
- **저장**: "변경사항 저장" 클릭 시 `coach_availability` 테이블에 일괄 저장
- **달력 확인**: 하단 달력에서 날짜 클릭 시 해당 날 시간별 예약 현황 확인

예약 시 슬롯 처리:
- 의뢰인이 날짜+시간 선택 시 `coach_slots`에 on-demand 생성
- 결제 확정 후 슬롯 상태: available → booked
- 컨설턴트 거절 시: booked → available 복원

### 결제 실패 또는 환불 처리

Supabase SQL Editor에서 직접 처리:

```sql
-- 환불 처리
UPDATE payments SET status = 'refunded' WHERE toss_order_id = '주문번호';
UPDATE sessions SET status = 'refunded' WHERE id = '세션_UUID';
-- 슬롯 복원
UPDATE coach_slots SET status = 'available' WHERE id = '슬롯_UUID';
```

> 실제 금액 환불은 **토스페이먼츠 개발자센터** 또는 **파트너 센터** 에서 별도 처리가 필요합니다.

---

## 7. 데이터베이스 구조

### 주요 테이블

| 테이블 | 설명 | 주요 컬럼 |
|---|---|---|
| `profiles` | 모든 사용자 | `id`, `email`, `full_name`, `role`, `avatar_url` |
| `coaches` | 컨설턴트 정보 | `id`, `bio`, `domains`, `hourly_rate`, `rating`, `is_approved` |
| `coach_availability` | 컨설턴트 반복 가용 패턴 | `coach_id`, `day_of_week`(0~6), `time_hhmm`('HH:MM') |
| `coach_slots` | 실제 예약 슬롯 인스턴스 | `coach_id`, `start_at`, `status`(available/booked/blocked) |
| `sessions` | 코칭 세션 | `coach_id`, `coachee_id`, `status`, `price`, `duration_minutes`, `scheduled_at`, `slot_id` |
| `payments` | 결제 정보 | `session_id`, `amount`, `status`, `toss_order_id`, `toss_payment_key` |
| `chat_rooms` | 채팅방 | `session_id`, `expires_at`, `is_active` |
| `messages` | 채팅 메시지 | `room_id`, `sender_id`, `content`, `is_blocked`, `block_reason` |
| `reviews` | 후기 | `session_id`, `coach_id`, `coachee_id`, `rating`, `content` |
| `penalties` | 페널티 기록 | `user_id`, `level`, `reason`, `starts_at`, `expires_at` |
| `reports` | 신고 | `reporter_id`, `reported_user_id`, `message_id`, `reason`, `status` |

### 역할(role) 값

| 값 | 의미 |
|---|---|
| `coachee` | 일반 의뢰인 (기본값) |
| `coach` | 승인된 컨설턴트 |
| `admin` | 관리자 |

### 페널티 level 값

| 값 | 의미 | 특이사항 |
|---|---|---|
| `warning` | 경고 | 3회 누적 시 자동 banned |
| `suspended` | 활동정지 | starts_at ~ expires_at 기간 |
| `banned` | 영구정지 | 관리자만 해제 가능 |

### 자주 쓰는 조회 쿼리

```sql
-- 대기 중인 컨설턴트 신청 조회
SELECT c.id, p.full_name, p.email, c.domains, c.hourly_rate, c.created_at
FROM coaches c
JOIN profiles p ON p.id = c.id
WHERE c.is_approved = false
ORDER BY c.created_at;

-- 제재 중인 사용자 전체
SELECT p.email, pen.level, pen.reason, pen.starts_at, pen.expires_at
FROM penalties pen
JOIN profiles p ON p.id = pen.user_id
ORDER BY pen.created_at DESC;

-- 차단된 메시지 최근 50건
SELECT m.content, m.block_reason, m.created_at, p.email
FROM messages m
JOIN profiles p ON p.id = m.sender_id
WHERE m.is_blocked = true
ORDER BY m.created_at DESC
LIMIT 50;

-- 완료된 세션 수 및 매출 합계
SELECT COUNT(*) AS session_count, SUM(price) AS total_revenue
FROM sessions
WHERE status = 'completed';

-- 승인 대기 중인 예약 (컨설턴트별)
SELECT s.id, p_coach.full_name AS coach, p_coachee.full_name AS coachee,
       s.scheduled_at, s.duration_minutes, s.price
FROM sessions s
JOIN profiles p_coach   ON p_coach.id   = s.coach_id
JOIN profiles p_coachee ON p_coachee.id = s.coachee_id
WHERE s.status = 'requested'
ORDER BY s.created_at;
```

---

## 8. 장애 대응 절차

### 8-1. 채팅방이 만료되지 않는 경우

**원인:** Vercel Cron이 실행되지 않음 또는 `CRON_SECRET` 불일치

**확인:**
1. Vercel 대시보드 → **Logs** → `room/expire` 요청 확인
2. 환경변수 `CRON_SECRET` 이 설정값과 일치하는지 확인

**수동 실행:**

```sql
UPDATE chat_rooms SET is_active = false
WHERE expires_at < now() AND is_active = true;

UPDATE sessions SET status = 'completed'
WHERE status = 'confirmed'
  AND id IN (SELECT session_id FROM chat_rooms WHERE is_active = false);
```

---

### 8-2. 예약 시간이 됐는데 채팅방이 안 열리는 경우

**원인:** Vercel Cron 미실행 또는 세션이 confirmed 상태가 아닌 경우

**확인 및 수동 처리:**

```sql
-- 세션 상태 확인
SELECT id, status, scheduled_at FROM sessions WHERE id = '세션_UUID';

-- 수동으로 채팅방 생성 (세션이 confirmed 상태인 경우만)
INSERT INTO chat_rooms (session_id, expires_at)
SELECT id, scheduled_at + (duration_minutes * interval '1 minute')
FROM sessions
WHERE id = '세션_UUID' AND status = 'confirmed';
```

---

### 8-3. 결제는 됐는데 예약이 requested로 안 바뀐 경우

**원인:** `/api/payment/confirm` 호출 실패

**확인 및 수동 처리:**

```sql
-- payments 상태 확인
SELECT * FROM payments WHERE toss_order_id = '주문번호';

-- 수동 처리
UPDATE payments SET status = 'paid', toss_payment_key = '토스_키', paid_at = now()
WHERE toss_order_id = '주문번호';

UPDATE sessions SET status = 'requested' WHERE id = '세션_UUID';

UPDATE coach_slots SET status = 'booked'
WHERE id = (SELECT slot_id FROM sessions WHERE id = '세션_UUID');
```

---

### 8-4. 컨설턴트 신청 시 FK 오류 발생

**원인:** `handle_new_user` 트리거가 실행되지 않아 `profiles` 행이 없는 경우

**해결:**

```sql
INSERT INTO profiles (id, email, full_name, role)
SELECT id, email, raw_user_meta_data->>'full_name', 'coachee'
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;
```

---

### 8-5. 관리자 로그인이 안 되는 경우

```sql
-- role 확인
SELECT id, email, role FROM profiles WHERE email = '관리자_이메일';

-- role 변경
UPDATE profiles SET role = 'admin' WHERE email = '관리자_이메일';
```

---

### 8-6. 프로필 사진 업로드 시 "bucket not found" 오류

**원인:** `avatars` 스토리지 버킷이 생성되지 않은 경우

**해결:** Supabase SQL Editor에서 `supabase/migrations/20260525000000_storage_avatars.sql` 실행

---

### 8-7. 메시지 차단이 안 되는 경우

**확인 순서:**
1. `ANTHROPIC_API_KEY` 환경변수 등록 여부 (Vercel)
2. Vercel **Functions 로그** 에서 `/api/chat/filter` 에러 확인
3. `GOOGLE_CLOUD_API_KEY` 등록 여부 (이미지 OCR 차단용)

---

## 9. 환경변수 목록

| 변수명 | 용도 | 획득처 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 관리자 키 (절대 브라우저 노출 금지) | Supabase → Settings → API |
| `TOSS_CLIENT_KEY` | 토스페이먼츠 클라이언트 키 | 토스페이먼츠 개발자센터 |
| `TOSS_SECRET_KEY` | 토스페이먼츠 시크릿 키 (서버 전용) | 토스페이먼츠 개발자센터 |
| `ANTHROPIC_API_KEY` | Claude Haiku 메시지 차단 (3층) | Anthropic Console |
| `GOOGLE_CLOUD_API_KEY` | 이미지 OCR 차단 (4층) | Google Cloud Console |
| `CRON_SECRET` | Vercel Cron 인증 토큰 | 직접 생성 (랜덤 32자 이상) |
| `NEXT_PUBLIC_SITE_URL` | 서비스 도메인 | `https://cuepath.vercel.app` |

> `.env.local` 파일은 Git에 절대 커밋하지 않습니다.

---

## 10. 정기 운영 체크리스트

### 매일

- [ ] `/admin/coaches` 에서 신규 컨설턴트 신청 확인 및 처리 (목표: 24시간 내 처리)
- [ ] `/admin/users` 에서 신규 페널티 대상자 확인
- [ ] `/admin/reports` 에서 신규 신고 확인
- [ ] Vercel 대시보드 Logs에서 에러 급증 여부 확인

### 매주

- [ ] 차단된 메시지 패턴 검토 → 새로운 우회 수법 발견 시 `src/lib/filter/patterns.ts` 업데이트
- [ ] 완료된 세션 수와 후기 작성률 확인
- [ ] 만료 안 된 채팅방 없는지 확인:
  ```sql
  SELECT COUNT(*) FROM chat_rooms WHERE expires_at < now() AND is_active = true;
  ```
- [ ] 활동정지 기간 만료 사용자 처리 여부 확인:
  ```sql
  SELECT p.email, pen.level, pen.expires_at
  FROM penalties pen JOIN profiles p ON p.id = pen.user_id
  WHERE pen.level = 'suspended' AND pen.expires_at < now();
  ```

### 매월

- [ ] Anthropic API 사용량 및 비용 확인 (Claude Console)
- [ ] Google Cloud API 사용량 확인
- [ ] 토스페이먼츠 정산 내역 확인 및 컨설턴트 수동 정산 처리
- [ ] Supabase DB 용량 확인
- [ ] `banned` 상태 사용자 중 이의신청 처리 여부 확인

---

## 부록: 코드 기여 가이드

> 운영자가 아닌 개발자를 위한 섹션

### 브랜치 전략

```
main (배포 브랜치)
└── feature/기능명
└── fix/버그명
```

- `main` 직접 push 금지
- `feature` 브랜치 → PR → 머지

### DB 스키마 변경

1. `supabase/migrations/YYYYMMDD000000_설명.sql` 파일 생성
2. Supabase SQL Editor에서 수동 실행 후 파일 커밋
3. 타입 자동 재생성:
   ```bash
   npx supabase gen types typescript --project-id nvzvxwggbreutitngyyx > src/types/database.ts
   ```

### 로컬 개발 실행

```bash
npm install
cp .env.example .env.local  # 환경변수 채우기
npm run dev
```
