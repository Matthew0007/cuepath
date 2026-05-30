# 연봉 비교·협상 계산기 — Claude Code 배포 지시서

## 전달 파일
- `salary_negotiator.html` — 완성된 단일 파일 (HTML + CSS + JS 통합, 외부 의존성 없음)

---

## 지시

아래 순서대로 진행해줘.

### 1단계: 프로젝트 구조 파악
현재 프로젝트의 구조를 확인해서 어떤 스택인지 판단해줘.
- package.json, next.config.*, vite.config.*, server.js, index.html 등을 확인
- 판단 결과를 먼저 알려주고 그에 맞는 방식으로 아래 2단계를 진행해

---

### 2단계: 스택별 구현

#### Next.js / React 프로젝트인 경우
1. `salary_negotiator.html` 파일 내용을 읽어서 구조를 파악해
2. `pages/salary.tsx` 또는 `app/salary/page.tsx` 를 새로 생성해 (프로젝트 구조에 맞게 선택)
3. `'use client'` 선언 후, `useEffect` 안에 HTML의 `<script>` 블록 전체를 그대로 넣어 실행해
   - vanilla JS가 DOM을 직접 조작하는 구조이므로 React state로 변환하지 말고 그대로 유지
4. `<style>` 블록은 `styles/salary.module.css` 로 분리해서 저장하고 import해
   - CSS 변수(`:root`)는 파일 상단에 유지
5. `<body>` 안 마크업은 컴포넌트 return에 JSX로 변환 (className, htmlFor 등 JSX 규칙 적용)
6. Pretendard 폰트를 `<link>` 또는 `next/font`로 추가해
   - CDN: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css`
7. `/salary` 경로로 접근해서 정상 동작하는지 확인해

#### 순수 HTML 정적 서버 (nginx / Apache / GitHub Pages / Vercel static)인 경우
1. `salary_negotiator.html` 을 배포 루트 또는 `public/` 폴더로 복사해
2. 기존 사이트에 네비게이션 링크가 있다면 해당 파일로 연결하는 링크를 추가해
3. Vercel이라면 `vercel deploy --prod` 실행
4. GitHub Pages라면 Settings > Pages > Source 설정 확인 후 push

#### Express / Node.js 서버인 경우
1. `salary_negotiator.html` 을 `public/` 폴더에 복사해
2. 기존 서버 파일에 아래 라우트를 추가해:
   ```js
   app.get('/salary', (req, res) => {
     res.sendFile(path.join(__dirname, 'public', 'salary_negotiator.html'));
   });
   ```
3. 서버를 재시작하고 `/salary` 경로로 접근해서 확인해

#### Vite / Vue / Svelte 등 기타 프레임워크인 경우
1. `public/` 폴더에 `salary_negotiator.html` 을 복사해
2. 프레임워크 라우터에 외부 HTML을 iframe 또는 별도 라우트로 연결해
   - 또는 `<script>` 와 `<style>` 을 분리해서 해당 프레임워크 컴포넌트로 변환해줘

---

## 파일 특성 (참고)

| 항목 | 내용 |
|---|---|
| 외부 의존성 | 없음 (CDN 불필요, 순수 vanilla JS) |
| 폰트 | Pretendard (없으면 시스템 폰트로 fallback) |
| 반응형 | 680px 이하 단열 전환 |
| SSR 주의 | JS가 DOM 직접 조작하므로 반드시 client-side에서만 실행 |

