# Wibble 콘텐츠 API 계약

프론트(Next.js)는 아래 REST 엔드포인트만 호출합니다. 서버 주소는 `WIBBLE_API_URL`로 지정합니다.
응답 검증 스키마는 [`src/lib/api/schemas.ts`](../src/lib/api/schemas.ts)에 있고, 이 문서와 함께 관리합니다.

- 모든 요청은 `GET`, 응답은 `application/json`
- `WIBBLE_API_TOKEN`이 있으면 `Authorization: Bearer <토큰>` 헤더를 붙입니다
- 없는 테스트/결과는 **404**로 응답해 주세요 (프론트가 "찾을 수 없음" 화면을 보여줍니다)
- 그 밖의 4xx/5xx·타임아웃(기본 8초)은 오류 화면 + "다시 시도"로 처리됩니다
- `slug`, 결과 `id`는 URL에 그대로 들어갑니다: 영문·숫자·`-`·`_`, 1~64자

## 엔드포인트

| 메서드 · 경로 | 쓰는 곳 | 응답 |
|---|---|---|
| `GET /categories` | 카테고리 칩 | `{ items: Category[] }` |
| `GET /tests` | 홈·전체 테스트·검색 | `{ items: TestSummary[] }` |
| `GET /tests/{slug}` | 테스트 화면 | `TestDetail` (없으면 404) |
| `GET /tests/{slug}/results/{resultId}` | 결과 화면 | `TestResult` (없으면 404) |
| `GET /tests/{slug}/recommendations?limit=4` | "이런 테스트는 어때요?" | `{ items: TestSummary[] }` |

### `GET /tests` 쿼리

| 파라미터 | 값 | 설명 |
|---|---|---|
| `sort` | `new` \| `popular` \| `all-time` | 최신순 / 이번 주 인기순(이번 주 참여 수) / 역대 인기순(누적 참여 수) |
| `category` | 카테고리 slug | 해당 카테고리만 |
| `featured` | `true` | 홈 배너 "오늘의 테스트". 보낸 순서대로 최대 5장 슬라이드로 보여줍니다 |
| `q` | 문자열 | 제목·설명 검색 |
| `limit` | 숫자 | 최대 개수 |

## 타입

필수가 아닌 값은 `null`이거나 빠져도 됩니다. 꾸밈용 값(색·이모지 등)이 잘못 오면 기본값으로 대체하고,
필수 값(slug·title·gameUrl 등)이 잘못 오면 오류로 처리합니다.

```ts
type Category = {
  slug: string;            // "personality"
  name: string;            // "성격"
  icon?: CategoryIcon | null;  // 카테고리 카드의 3D 아이콘. 없거나 모르는 키면 emoji → 별 아이콘
  emoji?: string | null;
};

// 프론트에 내장된 3D 아이콘 키 (src/lib/category-icons.ts, Fluent Emoji 3D)
type CategoryIcon =
  | "heart" | "crystal-ball" | "sun" | "ghost" | "paw" | "star" | "fire" | "balance"
  | "game" | "music" | "travel" | "dessert" | "coffee" | "brain" | "clover" | "sparkles";

type TestSummary = {
  slug: string;            // "animal" → /t/animal
  title: string;
  description?: string;
  emoji?: string | null;            // 썸네일 이미지가 없을 때 보여줄 이모지
  thumbnailUrl?: string | null;     // 세로 3:5 정도 권장(포스터 160×280~288×330, 배너는 가로로 잘림). 있으면 이모지 대신 사용
  thumbnailColor?: "sky" | "pink" | "lemon" | "mint" | "lilac" | "peach" | null; // 이모지 배경색
  theme?: "default" | "horror";     // horror면 어두운 썸네일 + 공포 배지 + 시작 전 경고
  playCount?: number;               // 참여 수 (2.4만처럼 표시)
  isNew?: boolean;                  // NEW 배지
  categories?: string[];            // 카테고리 slug 목록
  // ↓ 포스터 카드·홈 배너용 (없어도 됨)
  posterTitle?: string | null;      // 포스터 제목. "\n"으로 줄 나눔 지정. 예: "비 오는 밤의\n편의점". 없으면 title
  titleFont?: TitleFont | null;     // 포스터·배너 제목 글꼴. 없거나 모르는 키면 기본 글꼴(SUIT 굵게)
  genres?: string[];                // 제목 아래 장르 줄. ["공포", "나폴리탄"] → "공포 · 나폴리탄"
  shadeColor?: string | null;       // 포스터 아래쪽 그림자 색 "#rrggbb". 이미지 썸네일이면 꼭 넣어 주세요
                                    // (없으면 썸네일 색에 맞춘 기본값, 이미지면 #1a2030)
};

// 프론트에 내장된 제목 글꼴 키 (src/lib/title-fonts.ts)
type TitleFont =
  | "watermelon-salad" | "orbit" | "jua" | "song-myung" | "bagel-fat-one"
  | "gowun-dodum" | "gowun-batang" | "black-han-sans" | "black-and-white-picture";

type TestDetail = TestSummary & {
  gameUrl: string;                  // 따로 호스팅된 게임 주소 (https). iframe으로 띄움
  durationMinutes?: number | null;  // "약 2분"
  shareImageUrl?: string | null;    // 공유 카드 이미지 1200×630. 없으면 썸네일 → 기본 이미지
  warnings?: { emoji?: string | null; label: string }[]; // 공포 경고 칩. 예: {emoji:"😱", label:"깜짝 놀라는 장면"}
};

type TestResult = {
  id: string;                       // 게임이 보내는 resultId와 같아야 함 → /t/{slug}/result/{id}
  title: string;                    // "끝까지 살아남는 생존자"
  summary?: string;
  intro?: string | null;            // 제목 위 문구. 없으면 "{테스트 제목} 결과"
  emoji?: string | null;
  imageUrl?: string | null;         // 정사각형. 있으면 이모지 대신 사용 + 공유 이미지로도 사용
  hashtags?: string[];              // ["침착함", "촉이좋음"] ('#'은 붙여도 되고 안 붙여도 됨)
  goodMatch?: { emoji?: string | null; label: string } | null; // 잘 맞는 유형
  badMatch?: { emoji?: string | null; label: string } | null;  // 안 맞는 유형
};
```

### 예시: `GET /tests/dawn-visitor`

```json
{
  "slug": "dawn-visitor",
  "title": "새벽 3시의 방문자",
  "description": "문 너머의 누군가에게 어떻게 반응하느냐로 알아보는 나의 생존 유형.",
  "emoji": "🕯️",
  "theme": "horror",
  "playCount": 31000,
  "isNew": true,
  "categories": ["horror"],
  "gameUrl": "https://games.wibble.guru/dawn-visitor/",
  "durationMinutes": 2,
  "shareImageUrl": "https://cdn.wibble.guru/share/dawn-visitor.png",
  "warnings": [
    { "emoji": "😱", "label": "깜짝 놀라는 장면" },
    { "emoji": "🔊", "label": "효과음" }
  ]
}
```

## 캐시와 갱신

프론트는 응답을 캐시합니다 (목록·상세 1시간, 결과 1일, 검색 1분 단위). 콘텐츠를 바꾼 뒤 아래 웹훅을 호출하면 즉시 갱신됩니다.

```http
POST {사이트}/api/revalidate
Authorization: Bearer <REVALIDATE_SECRET>
Content-Type: application/json

{ "testSlug": "dawn-visitor" }                    // 테스트 상세·결과·추천 + 목록
{ "testSlug": "dawn-visitor", "resultId": "survivor" } // 위 + 특정 결과
{ "scope": "lists" }                                // 목록·카테고리 전체
```

응답: `{ "revalidated": ["tests", "test:dawn-visitor"] }`

## 게임 연동 (iframe)

게임은 `gameUrl`에서 따로 호스팅되고, `postMessage`로 결과를 알려줍니다 ([`src/lib/game-bridge.ts`](../src/lib/game-bridge.ts)).

| 방향 | 메시지 |
|---|---|
| 게임 → 사이트 | `{ source: "psytest-game", type: "ready" }` — `init`을 받을 때까지 300ms마다 반복 |
| 사이트 → 게임 | `{ source: "psytest-host", type: "init", slug, theme }` — 이 메시지의 `event.origin`이 사이트 주소 |
| 게임 → 사이트 | `{ source: "psytest-game", type: "result", resultId }` — `init`에서 받은 origin으로만 전송 |

사이트는 `gameUrl`과 같은 origin에서, 해당 iframe이 보낸 메시지만 받습니다. `result`를 받으면 `/t/{slug}/result/{resultId}`로 이동합니다.

게임 서버 설정:
- iframe 허용: `Content-Security-Policy: frame-ancestors https://<사이트 도메인>` (`X-Frame-Options`는 빼 주세요)
- 게임 화면은 모바일 세로 화면과 PC 16:9(전체화면 포함) 모두에서 보기 좋게 반응형으로 만들어 주세요
- 공포 테스트는 사이트가 시작 전에 경고를 띄우므로, 게임은 바로 시작해도 됩니다
