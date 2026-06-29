# 일산비치짐 키오스크 · 관리자 대시보드

해파랑 웰니스파크(일산해수욕장 · The Deck) **무인 키오스크 체크인 앱**과 **실시간/누적 이용객 관리자 웹**.
가로 태블릿(16:10)을 풀스크린 브라우저로 띄워 무인 운영하며, 입력 정보로 카카오 알림톡을 자동 발송합니다.

- **키오스크** `/` — 5단계 체크인 (① 언어 선택 → ② 안전 동의서·서명 → ③ 정보 입력 → ④ 이용 안내·이번 주 클래스 → ⑤ 카카오톡 자동 발송 완료)
- **관리자** `/admin` — 현재 이용객(실시간) · 오늘/주/월/전체 누적 · 시간대 차트 · 성별/언어 분포 · 최근 체크인

스택: **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase(Postgres)**, 카카오 알림톡은 Solapi 어댑터.

---

## 1. 빠른 시작 (로컬)

```powershell
npm install
Copy-Item .env.example .env.local   # 값 채우기 (아래 2번 참고)
npm run dev
```

- 키오스크: http://localhost:3000
- 관리자: http://localhost:3000/admin

> Supabase 키가 없어도 키오스크 UI(1~4단계)는 동작하지만, 체크인 저장/관리자 통계에는 Supabase가 필요합니다.

## 2. 환경변수 (`.env.local`)

`.env.example` 참고. 필수 항목:

| 변수 | 설명 |
|---|---|
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role 키 (서버 전용, **절대 노출 금지**) |
| `ADMIN_PASSWORD` | 관리자 웹 로그인 비밀번호 |
| `ADMIN_SECRET` | 세션 쿠키 서명용 랜덤 문자열 |

선택 항목(카카오 알림톡·외부 링크·운영 옵션)은 `.env.example`의 주석 참고.

## 3. Supabase 준비

1. https://supabase.com 에서 프로젝트 생성
2. **SQL Editor** 에 [`supabase/schema.sql`](supabase/schema.sql) 전체를 붙여넣고 **Run**
3. **Settings → API** 에서 `Project URL`, `service_role` 키를 복사해 `.env.local` 에 입력

> `visits` 테이블은 RLS가 켜져 있고 정책이 없어, service_role 키(서버)로만 접근됩니다. 익명 키로는 데이터에 접근할 수 없습니다.

## 4. 카카오 알림톡 (5단계 자동 발송)

알림톡은 비즈채널 개설 · 발신프로필 · 템플릿 승인이 선행되어야 합니다. 준비 전에는 자동으로 **콘솔 로그(미연동)** 로 대체되어 체크인은 정상 동작합니다.

준비되면 `.env.local` 에:

```
NOTIFY_PROVIDER=solapi
SOLAPI_API_KEY=...
SOLAPI_API_SECRET=...
SOLAPI_SENDER=01012345678      # 사전 등록 발신번호
KAKAO_PF_ID=...                # 발신프로필 키(pfId)
KAKAO_TEMPLATE_ID=...          # 승인된 템플릿 ID
```

### 솔라피 준비 순서
1. [solapi.com](https://solapi.com) 가입 → **API Key / Secret** 발급 (`SOLAPI_API_KEY`, `SOLAPI_API_SECRET`)
2. **발신번호 등록**(현장 연락처) → `SOLAPI_SENDER`
3. **카카오 비즈니스 채널 연동** → 발신프로필키 `pfId` 확보 → `KAKAO_PF_ID`
4. **알림톡 템플릿 등록 → 카카오 검수 승인** → 템플릿 ID `KA...` → `KAKAO_TEMPLATE_ID`

### 등록할 알림톡 템플릿 (검수용 예시)
> 정보성(체크인 확인) 메시지로 작성해야 승인이 쉽습니다. 변수명은 코드와 **정확히 일치**해야 합니다.

```
[일산비치짐] 체크인 완료 안내

#{이름}님, 일산비치짐 체크인이 완료되었습니다.
오늘도 안전하게 운동하세요 🌊

▶ 기구 사용법: #{가이드}
▶ 클래스 예약: #{예약}
▶ 홈페이지: #{홈페이지}
▶ 이용 후기: #{설문}
```
- 사용 변수: `#{이름}` `#{가이드}` `#{예약}` `#{홈페이지}` `#{설문}` — 코드([`src/lib/notify.ts`](src/lib/notify.ts) `buildMessage`)가 보내는 키와 동일.
- 링크는 본문 변수 대신 **웹링크 버튼**으로 넣어도 됩니다(가독성↑). 그 경우 본문에서 해당 URL 변수를 빼고 버튼 URL에 매핑하세요.
- 변수 개수/이름을 바꾸면 `buildMessage`의 `variables` 객체도 같이 맞춰야 합니다.

### 동작 메모
- 알림톡 발송 실패(미설치·차단 등) 시 `disableSms:false`로 **템플릿 내용이 SMS로 자동 대체발송**됩니다.
- 키 미설정 시 `console` 폴백 — 체크인은 정상 저장되고 발송만 서버 로그로 남습니다(관리자 대시보드에 "미연동"으로 표시).
- 솔라피 대신 다른 대행사를 쓸 경우 `src/lib/notify.ts` 의 어댑터만 교체하면 됩니다.

## 5. '현재 이용객' 산정 (자동 마감)

무인 운영이라 별도 퇴장(체크아웃) 없이 **시간 기반으로 자동 마감**합니다. 한 체크인은 다음을 모두 만족할 때 '이용 중'으로 집계됩니다(KST 기준):

- 오늘 운영 시작(09:00) 이후 체크인
- 현재 시각이 운영 종료(20:00) 이전
- 체크인 후 `MAX_STAY_MINUTES`(기본 240분) 이내

설정값은 [`src/lib/config.ts`](src/lib/config.ts)(`OPERATION`)에서 조정합니다.

## 6. 배포 (Vercel 권장)

1. GitHub에 푸시 후 Vercel에서 Import
2. Vercel **Environment Variables** 에 위 환경변수 입력 (`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD` 등)
3. 배포 후
   - 키오스크: `https://<도메인>/` → 태블릿 브라우저에서 전체화면(키오스크 모드)로 띄움
   - 관리자: `https://<도메인>/admin`

### 태블릿 키오스크 모드 팁
- 화면 자동 꺼짐 해제, 가로 고정, 전체화면(Chrome: "홈 화면에 추가" 또는 키오스크 런처 앱) 권장
- 90초 무동작 시 자동으로 첫 화면 복귀, 체크인 완료 30초 후 자동 복귀

## 7. 운영 데이터 커스터마이징

| 항목 | 파일 |
|---|---|
| 운영 기간/시간/정원/요금 | `src/lib/config.ts` → `OPERATION` |
| 프로그램(HYROX/CROSSFIT/RUNNER/SEA) | `src/lib/config.ts` → `PROGRAMS` |
| 이번 주 클래스 | `src/lib/config.ts` → `WEEKLY_CLASSES` |
| 외부 링크(홈페이지/예약/설문/가이드) | `.env.local` 또는 `config.ts` → `LINKS` |
| 다국어 문구(국문/영문) | `src/lib/i18n.ts` |
| 브랜드 컬러/폰트 | `src/app/globals.css` |

## 8. 폴더 구조

```
src/
  app/
    page.tsx                 # 키오스크 (/)
    admin/page.tsx           # 관리자 (/admin)
    api/
      checkin/route.ts       # 체크인 저장 + 알림 발송
      admin/login/route.ts   # 관리자 로그인/로그아웃
      admin/stats/route.ts   # 대시보드 통계 (인증 필요)
  components/
    kiosk/                   # 키오스크 5단계 UI, 서명패드, QR
    admin/                   # 로그인 + 대시보드
    Logo.tsx
  lib/
    config.ts i18n.ts time.ts types.ts
    supabase.ts visits.ts notify.ts adminAuth.ts
supabase/schema.sql          # DB 스키마
```
