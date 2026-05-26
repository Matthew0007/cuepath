# Cuepath — 커리어 코칭 매칭 플랫폼

## 프로젝트 개요
채팅 기반 1:1 커리어 코칭 매칭 마켓플레이스.
Matthew(이광진)가 1차 검증한 코치와 취업·이직 준비자를 연결한다.
결제 후 시간 제한 채팅방이 열리고, 외부 연락처 교환은 4층 차단 시스템으로 막는다.

서비스명 Cuepath (가칭, 확정 시 이 파일 업데이트)
개발자 Matthew (이광진)
시작일 2026.05.24
현재 단계 Sprint 6 진행 중 — LinkedIn 스타일 UI/UX 리디자인 완료

---

## 기술 스택
- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Supabase (PostgreSQL + Realtime + Auth + Storage)
- Vercel (배포, cuepath.vercel.app)
- 토스페이먼츠 (결제)
- shadcn/ui (UI 컴포넌트)
- Claude API Haiku (메시지 차단 3층 + CS AI)
- Google Vision API (이미지 OCR 4층)

---

## 디렉토리 구조
```
src/
├── app/
│   ├── (auth)/login, signup
│   ├── (main)/coaches, dashboard, coach/dashboard, booking, sessions, coach/schedule, profile
│   ├── chat/[roomId]/
│   ├── admin/
│   │   ├── coaches/          ← 컨설턴트 승인 목록
│   │   ├── coaches/[id]/     ← 컨설턴트 상세·페널티·슬롯 관리
│   │   ├── users/            ← 전체 회원 목록
│   │   ├── users/[id]/       ← 회원 상세·페널티 부여
│   │   ├── reports/          ← 신고 처리
│   │   └── login/
│   └── api/
│       ├── chat/filter/      ← 메시지 차단 API
│       ├── payment/webhook/  ← 결제 웹훅
│       ├── payment/confirm/
│       ├── profile/avatar/   ← 프로필 사진 업로드 (sharp WebP 변환)
│       └── room/expire/      ← 채팅방 만료 + 채팅방 자동 오픈 cron
├── components/
│   ├── booking/BookingForm.tsx    ← 달력 기반 예약 UI
│   ├── chat/
│   ├── coach/ScheduleManager.tsx ← 주간 그리드 가용성 설정
│   ├── layout/
│   │   ├── AppNav.tsx             ← LinkedIn 스타일 상단 네비게이션 (role-aware, client)
│   │   └── LeftSidebar.tsx        ← 좌측 프로필 카드 + 빠른 링크
│   ├── review/
│   └── ui/
│       ├── avatar-image.tsx       ← 프로필 사진 컴포넌트 (fallback: 이니셜 파란 원)
│       └── shadcn/ui
├── lib/
│   ├── supabase/client.ts, server.ts, admin.ts
│   ├── filter/patterns.ts    ← 정규식·사전 차단 (1·2층)
│   ├── filter/llm.ts         ← Claude API 의도 분류 (3층)
│   ├── ocr/vision.ts         ← Google Vision OCR (4층)
│   ├── constants.ts          ← SESSION_OPTIONS, PLATFORM_FEE
│   └── payment/toss.ts
├── types/database.ts, app.ts
└── proxy.ts
```

---

## 핵심 기능 (MVP 6가지)
1. 회원가입·로그인 (이메일 인증, SMS는 정식 출시 후)
2. 코치 프로필·검색 (도메인·가격·평점 필터)
3. 결제·예약 (토스페이먼츠 단건 결제)
4. 채팅방 (Supabase Realtime, 시간 만료, 첨부파일)
5. 외부 연락처 차단 4층 + 페널티
6. 후기·평점 + 관리자 콘솔

---

## 차단 4층 구조
1층 정규식 패턴 — 전화번호, 이메일, SNS 핸들, 외부 URL
2층 우회 사전 — 한글 숫자(공일공), 띄어쓰기 정규화, 동음이의 표현
3층 LLM 분류 — 의심도 0.3 이상만 Claude Haiku 호출 (비용 통제)
4층 OCR — 첨부 이미지 Google Vision → 1·2층 재실행

차단 적발 시
- 1차 경고 + 메시지 차단
- 2차 24시간 정지
- 3차 영구 정지 + 채팅방 블라인드

---

## DB 주요 테이블
profiles, coaches, sessions, payments, chat_rooms, messages, reviews, penalties, reports, coach_slots, coach_availability

### coach_availability (2026-05-25 추가)
- 컨설턴트 반복 가용성 패턴 저장 (day_of_week 0~6, time_hhmm 'HH:MM' KST)
- UNIQUE(coach_id, day_of_week, time_hhmm)
- 예약 시 coach_slots는 on-demand 생성 (컨설턴트가 미리 개별 등록 불필요)

---

## 환경변수 목록 (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=
ANTHROPIC_API_KEY=
GOOGLE_CLOUD_API_KEY=
CRON_SECRET=
NEXT_PUBLIC_SITE_URL=https://cuepath.vercel.app
```

---

## 코딩 컨벤션
- TypeScript strict 모드
- 서버 컴포넌트 우선, 클라이언트 컴포넌트는 'use client' 필요 시만
- DB 변경은 supabase/migrations/ 에 SQL 파일로 기록
- 환경변수는 .env.local (Git 커밋 절대 금지)
- 함수형 컴포넌트만 사용
- props 타입은 interface로 정의
- 비즈니스 로직은 lib/ 에 분리
- 한글 주석 허용

---

## 보안 원칙
- SUPABASE_SERVICE_ROLE_KEY 서버 전용, 브라우저 절대 노출 금지
- 모든 테이블 RLS(Row Level Security) 적용
- 결제 웹훅은 토스페이먼츠 시크릿 키로 서명 검증
- 첨부파일은 Storage private 버킷 + 서명 URL

---

## Sprint 현황
| Sprint | 상태 | 목표 |
|---|---|---|
| 1 | 완료 | 회원가입·로그인·역할 분리·Vercel 배포 |
| 2 | 완료 | 코치 프로필·검색·승인 플로우 |
| 3 | 완료 | 결제·예약·채팅방 생성 |
| 4 | 완료 | 채팅 Realtime·차단 4층·시간 만료 |
| 5 | 완료 | 후기·관리자 콘솔·베타 오픈 |
| 6 | 진행 중 | 캘린더 기반 예약·회원 관리·UI 개선 |

---

## 세션 요금 및 정산 구조
| 구분 | 30분 | 50분 |
|---|---|---|
| 사용자 결제 금액 | 40,000원 | 70,000원 |
| 컨설턴트 수령 | 25,000원 | 55,000원 |
| 플랫폼 수수료 | 15,000원 (고정) | 15,000원 (고정) |

- 컨설턴트 화면에는 수령 금액 정보를 표시하지 않음 (추후 정산 기능 개발 시 도입)
- 정산 기능은 별도 Sprint에서 개발 예정: 컨설턴트별 월간 정산 내역, 계좌 등록, 자동 송금 연동
- 현재는 플랫폼이 토스페이먼츠로 전액 수령 후 수동 정산 처리

## 세션 예약 플로우 (캘린더 기반, 2026-05-25 도입)
- 결제 즉시 채팅 오픈 방식 → 컨설턴트 캘린더 기반 예약 방식으로 변경
- 세션 상태 흐름: pending → requested → confirmed → completed
- 채팅방은 confirmed 세션의 scheduled_at 도달 시 Vercel Cron이 자동 오픈
- coach_availability: 요일+시간 반복 패턴 저장 (30분 단위 주간 그리드 UI)
- coach_slots: 실제 예약 발생 시 on-demand 생성 (컨설턴트 사전 등록 불필요)

## 페널티 시스템
- 경고(warning): 누적 카운트, 3회 시 자동 영구정지
- 활동정지(suspended): 시작일~종료일 지정, 컨설턴트의 경우 해당 기간 슬롯 전체 차단
- 영구정지(banned): 관리자만 해제 가능
- 부여 대상: 컨설턴트(`/admin/coaches/[id]`) 및 일반 회원(`/admin/users/[id]`) 모두 가능

## 관리자 기능
- `/admin/coaches` — 컨설턴트 신청 승인/거부
- `/admin/coaches/[id]` — 컨설턴트 상세: 페널티 부여·이력, 슬롯 차단/해제, 세션 이력
- `/admin/users` — 전체 회원 목록 (역할·페널티·세션 수 요약)
- `/admin/users/[id]` — 회원 상세: 페널티 부여·이력, 세션 이력, 컨설턴트 상세 링크
- `/admin/reports` — 신고 처리

---

## UI/UX 설계 원칙 (2026-05-26 LinkedIn 스타일 리디자인)

### 디자인 시스템
- Primary Blue: #0A66C2 (LinkedIn blue), Dark: #004182, Light BG: #EAF0F8
- Page Background: #F3F2EF (warm gray)
- White cards: `bg-white rounded-xl border border-black/10 shadow-sm`
- Buttons: rounded-full (LinkedIn 스타일 pill 버튼)
- Avatar fallback: 이니셜 + 파란 그라디언트 원 (👤 이모지 제거)

### 레이아웃 구조
- max-w-[1128px] 중앙 정렬 (LinkedIn과 동일)
- 3컬럼: LeftSidebar(220px) + Main(flex-1) + [RightSidebar 추후 추가]
- Mobile: 사이드바 숨김 + 하단 네비게이션 바
- Sticky top nav: AppNav (role-aware, client component)

### 역할별 UI 분리
| 역할 | 홈 | 네비게이션 |
|---|---|---|
| 의뢰인(coachee) | /dashboard | 홈·컨설턴트·세션·프로필 |
| 컨설턴트(coach) | /coach/dashboard | 홈·세션·일정·프로필 |
| 관리자(admin) | /admin | 별도 레이아웃 유지 |

- /dashboard 접근 시 coach role은 /coach/dashboard로 자동 redirect
- /coach/dashboard 접근 시 coachee role은 /dashboard로 자동 redirect
- AppNav: role 파라미터로 링크 세트 결정 (coachLinks vs coacheeLinks)

---

## 의사결정 기록
- 채팅 인프라 자체 구축 (Supabase Realtime) — SendBird 등 SaaS 미사용 (비용 0)
- SMS 본인인증 MVP 제외 — 이메일 인증으로 시작, 정식 출시 시 추가
- CS 직원 없음 — Claude API 기반 AI 자동응대
- 마케팅 예산 0 — Matthew LinkedIn·Instagram IP 트래픽 활용
- 무료 도메인 (.vercel.app) — 결제 도입 시점에 .com 구매 (연 1.5만원)
- GitHub Pages 미사용 — 정적 사이트만 지원, Vercel로 대체
- 미들웨어 세션 검증은 getUser() 사용 — getSession()은 JWT 서버 검증 안 함 (보안 취약)
- DB 타입은 supabase gen types typescript --local > src/types/database.ts 로 자동생성, 수동 작성 금지
- Next.js 16에서 middleware.ts → proxy.ts, export function middleware → proxy 로 변경됨
- profiles 테이블 실제 컬럼 7개: id, email(NOT NULL), full_name(nullable), avatar_url, role, created_at, updated_at — name 컬럼 없음, full_name 사용할 것
- handle_new_user 트리거는 Claude Code 자동 생성 불가 — Supabase SQL Editor에서 수동 실행 필요. insert 컬럼: (id, email, full_name, role) 4개, EXCEPTION 처리 포함할 것
- 상단 네비게이션 바: sticky top-0 z-50 shadow-sm 고정 방식 (2026-05-25 적용)
- 컨설턴트 캘린더: 개별 날짜 슬롯 등록 방식 → coach_availability 반복 패턴 방식으로 전환 (2026-05-25)
- 가용 일정 UI: 30분 단위 주간 그리드 (요일×시간 셀 클릭 토글), 저장 버튼으로 일괄 저장
- avatars 스토리지 버킷: Supabase SQL Editor에서 20260525000000_storage_avatars.sql 수동 실행 필요
- coach_availability SQL: 20260525000002_availability_schema.sql Supabase SQL Editor 수동 실행 필요
- Vercel Hobby 플랜: cron 매분 실행 불가 → vercel.json에서 cron 제거, 외부 cron-job.org 사용 권장
- UI 전면 리디자인 (2026-05-26): LinkedIn 스타일, #0A66C2 파란 배경, #F3F2EF warm gray, 3컬럼 레이아웃
- AppNav는 client component (usePathname 사용) — layout.tsx는 server component 유지
- reviews 테이블: content 컬럼 사용 (comment 없음)
- 모든 작업 main 브랜치 직접 push 허용 (2026-05-26 Matthew 결정)

---

## Matthew 작업 스타일
- 한국어로 소통
- 코드 설명은 간결하게, 결정 사유 포함
- 에러는 전체 로그 붙여넣기 (일부 생략 금지)
- 매 세션 종료 시 변경사항 요약 + 다음 세션 이어야 할 작업 1개 명시
- 이해 안 가는 코드는 설명 요청

---

## 세션 종료 시 요청 템플릿
```
오늘 작업 요약해줘.
CLAUDE.md에 추가할 의사결정이나 변경 사항 있으면 알려줘.
다음 세션에서 이어야 할 작업 1개 짚어줘.
```
