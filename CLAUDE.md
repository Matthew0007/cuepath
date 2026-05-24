# Cuepath — 커리어 코칭 매칭 플랫폼

## 프로젝트 개요
채팅 기반 1:1 커리어 코칭 매칭 마켓플레이스.
Matthew(이광진)가 1차 검증한 코치와 취업·이직 준비자를 연결한다.
결제 후 시간 제한 채팅방이 열리고, 외부 연락처 교환은 4층 차단 시스템으로 막는다.

서비스명 Cuepath (가칭, 확정 시 이 파일 업데이트)
개발자 Matthew (이광진)
시작일 2026.05.24
현재 단계 Sprint 1 — 기반 세팅

---

## 기술 스택
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
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
│   ├── (main)/coaches, dashboard, booking
│   ├── chat/[roomId]/
│   ├── admin/
│   └── api/
│       ├── chat/filter/      ← 메시지 차단 API
│       ├── payment/webhook/  ← 결제 웹훅
│       ├── payment/confirm/
│       └── room/expire/      ← 채팅방 만료 cron
├── components/
│   ├── chat/
│   ├── coach/
│   ├── review/
│   └── ui/                   ← shadcn/ui
├── lib/
│   ├── supabase/client.ts, server.ts, middleware.ts
│   ├── filter/patterns.ts    ← 정규식·사전 차단 (1·2층)
│   ├── filter/llm.ts         ← Claude API 의도 분류 (3층)
│   ├── ocr/vision.ts         ← Google Vision OCR (4층)
│   └── payment/toss.ts
├── types/database.ts, app.ts
└── middleware.ts
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
profiles, coaches, sessions, payments, chat_rooms, messages, reviews, penalties, reports
상세 스키마 → 04_DB_Schema.md 참조

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
NEXT_PUBLIC_SITE_URL=https://cuepath.vercel.app
```

---

## 코딩 컨벤션
- TypeScript strict 모드
- 서버 컴포넌트 우선, 클라이언트 컴포넌트는 'use client' 필요 시만
- DB 변경은 supabase/migrations/ 에 SQL 파일로 기록
- 환경변수는 .env.local (Git 커밋 절대 금지)
- main 브랜치 직접 push 금지 → feature 브랜치 → PR → 머지
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
| 1 | 진행 중 | 회원가입·로그인·역할 분리·Vercel 배포 |
| 2 | 예정 | 코치 프로필·검색·승인 플로우 |
| 3 | 예정 | 결제·예약·채팅방 생성 |
| 4 | 예정 | 채팅 Realtime·차단 4층·시간 만료 |
| 5 | 예정 | 후기·관리자 콘솔·베타 오픈 |

---

## 의사결정 기록
- 채팅 인프라 자체 구축 (Supabase Realtime) — SendBird 등 SaaS 미사용 (비용 0)
- SMS 본인인증 MVP 제외 — 이메일 인증으로 시작, 정식 출시 시 추가
- CS 직원 없음 — Claude API 기반 AI 자동응대
- 마케팅 예산 0 — Matthew LinkedIn·Instagram IP 트래픽 활용
- 무료 도메인 (.vercel.app) — 결제 도입 시점에 .com 구매 (연 1.5만원)
- GitHub Pages 미사용 — 정적 사이트만 지원, Vercel로 대체

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
