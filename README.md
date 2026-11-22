# Wibble

가볍게 즐기는 1분 심리테스트. Next.js 16 (App Router, Cache Components) + Tailwind v4 + pnpm.
테스트 화면에서 **따로 호스팅된 게임을 iframe으로** 띄우고, 게임이 끝나면 결과 페이지로 이동해 카카오톡·인스타 스토리로 공유합니다.
모바일 우선이고, 768px 이상에서 PC 레이아웃(16:9 게임 + 전체화면)으로 넓어집니다.

## 시작하기

```bash
pnpm install
cp .env.example .env.local   # WIBBLE_API_URL 등 채우기
pnpm dev
```

앱 안에 목업 데이터는 없습니다. 모든 콘텐츠는 `WIBBLE_API_URL`의 서버에서 가져오며,
서버가 구현할 엔드포인트와 응답 형식은 **[docs/api.md](docs/api.md)** 에 정리되어 있습니다.

> `pnpm build`는 홈 화면을 서버 데이터로 미리 만들기 때문에 **빌드할 때 API에 접근할 수 있어야** 합니다.
> 테스트·결과 페이지는 빌드에 포함되지 않고, 첫 방문 때 만들어져 캐시됩니다 (서버에 새 테스트를 추가해도 재배포 없이 바로 열림).

## 환경 변수

| 이름 | 필수 | 설명 |
|---|---|---|
| `WIBBLE_API_URL` | ✓ | 콘텐츠 API 주소 |
| `WIBBLE_API_TOKEN` | | API가 인증을 요구할 때 Bearer 토큰 |
| `WIBBLE_API_TIMEOUT_MS` | | 요청 타임아웃 (기본 8000) |
| `WIBBLE_IMAGE_HOSTS` | | 썸네일 이미지가 API와 다른 도메인이면 쉼표로 나열 |
| `REVALIDATE_SECRET` | ✓(운영) | 캐시 무효화 웹훅 인증값 |
| `NEXT_PUBLIC_SITE_URL` | ✓(운영) | 배포 도메인 — 공유 링크·OG 이미지 절대 주소 |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | | 카카오 JavaScript 키 (Kakao Developers에 도메인 등록 필요) |

## 화면

| 경로 | 내용 |
|---|---|
| `/` | 오늘의 테스트 · 카테고리 · 새로 나온 테스트 · 이번 주 인기 TOP |
| `/tests?category=&sort=new\|popular` | 전체/인기 테스트 목록 |
| `/search?q=` | 검색 |
| `/t/[slug]` | 테스트 플레이 (모바일 전체 높이 / PC 16:9 · 처음부터 · 전체화면). 공포 테스트는 시작 전 경고 |
| `/t/[slug]/result/[resultId]` | 결과 카드(공포 테마는 어두운 톤) · 공유 · 추천 |
| `POST /api/revalidate` | 콘텐츠 변경 시 캐시 즉시 갱신 (docs/api.md) |

## 구조

```
src/
  lib/api/
    schemas.ts     서버 응답 계약 (zod). 필수 값은 엄격, 꾸밈 값은 기본값으로 대체
    client.ts      fetch + 인증 헤더 + 타임아웃 + 응답 검증, 오류 종류 구분
    queries.ts     페이지가 쓰는 데이터 함수 ("use cache" + cacheLife + cacheTag)
  lib/game-bridge.ts  iframe 게임 ↔ 사이트 postMessage 규약
  app/(site)/      PC 상단 내비 + 푸터가 붙는 일반 화면
    (browse)/      홈·목록·검색 (모바일 상단바 + 하단 탭바)
    t/             테스트·결과 화면
  app/not-found.tsx 404 (내비·푸터 없이 단독 화면, Figma "07 404")
  components/
    GamePlayer.tsx 게임 iframe · 16:9 · 전체화면 · 처음부터 · 공포 경고
    TestBits.tsx   썸네일 · 카드 · 랭킹 행 · 배지
    ResultCard.tsx 결과 카드 (기본 / 공포)
    ShareButtons.tsx 카카오톡 · 인스타 스토리 · 링크 복사
```

데이터를 다른 곳(DB, CMS 등)에서 가져오고 싶다면 `src/lib/api/queries.ts`의 함수 안쪽만 바꾸면 됩니다.
페이지는 이 함수들과 `schemas.ts`의 타입에만 의존합니다.

## 디자인

- Figma: Wibble 화면·컴포넌트·공포 테마 예시
- 토큰(색·둥글기·폰트)은 `src/app/globals.css`의 `@theme`에 Figma 스타일 가이드와 같은 값으로 정의
- 폰트: SUIT Variable (`src/app/fonts`, SIL OFL)
- 참고용 HTML 원본: `design/`

## 기타

- `figma-plugins/suit-font-swap/` — Gumi Romance를 제외한 폰트를 SUIT Variable로 바꾸는 Figma 플러그인
