# Wibble API 연동

프론트(Next.js)는 Wibble API 서버를 호출합니다. 서버 주소는 `WIBBLE_API_URL`(`https://api.wibble.guru`)로 지정합니다.

- Swagger: https://api.wibble.guru/swagger-ui/index.html (스펙 JSON: `/v3/api-docs`)
- 서버 응답 검증·변환: [`src/lib/api/wibble.ts`](../src/lib/api/wibble.ts) → 화면용 형식 [`src/lib/api/schemas.ts`](../src/lib/api/schemas.ts)
- 조회는 모두 Next 서버에서 호출하고 캐시합니다. 브라우저에서 API를 바로 부르면 CORS로 막히므로,
  방문·실행 기록도 사이트의 `POST /api/tests/{slug}/{views|starts}`를 거쳐 전달합니다.
- `WIBBLE_API_TOKEN`이 있으면 `Authorization: Bearer <토큰>` 헤더를 붙입니다
- 없는 테스트는 **404** → "찾을 수 없음" 화면. 그 밖의 4xx/5xx·타임아웃(기본 8초)은 오류 화면 + "다시 시도"

## 쓰는 엔드포인트

| 서버 API | 쓰는 곳 |
|---|---|
| `GET /api/psychology-categories` | 카테고리 칩 |
| `GET /api/psychology-tests?sort=latest` | 홈 "오늘의 테스트" 배너, 전체 테스트(최신순) |
| `GET /api/psychology-tests?sort=popular&period=weekly` | 홈 이번 주 인기, 전체 테스트(인기순) |
| `GET /api/psychology-tests?sort=popular&period=all_time` | 홈 역대 인기 |
| `GET /api/psychology-tests?category={slug}` | 카테고리별 목록 |
| `GET /api/psychology-tests/{slug}` | 테스트 화면 (404면 찾을 수 없음) |
| `POST /api/psychology-tests/{slug}/views` `{ entryId }` | 테스트 화면이 열릴 때 (진입마다 새 UUID) |
| `POST /api/psychology-tests/{slug}/starts` `{ entryId, playId }` | 게임 iframe을 띄울 때 (공포 테스트는 경고에 동의한 뒤, "처음부터"마다 새 playId) |

서버에 아직 없어서 프론트가 대신하는 것:

| 기능 | 지금 동작 |
|---|---|
| 검색 | 최신 목록 100개를 받아 제목·설명·카테고리 이름으로 거름 |
| 추천 ("이런 테스트는 어때요?") | 최신 목록에서 같은 카테고리를 먼저, 현재 테스트 제외 |
| 결과 페이지 `/t/{slug}/result/{playId}?r=…` | 결과를 서버에 저장하지 않음. 게임이 보낸 결과 내용을 쿼리에 싣고, 경로에는 이번 판의 `playId`(`starts`에 보낸 값)만 넣음 — 아래 "게임 연동" |
| 홈 배너(featured) | 최신순 5개 |

## 서버 응답 → 화면 값

| 화면 값 | 서버 값 / 대체 |
|---|---|
| `slug`, `title`, `description`, `thumbnailUrl` | 그대로 |
| `gameUrl` | 그대로. `null`이면 테스트 화면에 "게임을 준비하고 있어요" |
| `categories`, `genres` | `categories`(없으면 `category`)의 slug / 이름 |
| `theme` | 카테고리에 `horror`가 있으면 공포 테마(어두운 썸네일 + 시작 전 경고) |
| `isNew` | `publishedAt`이 14일 이내 |
| `thumbnailColor` | slug로 정해지는 고정 색 |
| 카테고리 아이콘·이모지 | `wibble.ts`의 `CATEGORY_LOOKS` (horror 👻, mystery 🔍). 모르는 카테고리는 기본 아이콘 |
| `playCount` | 서버에 없음 → 0, 화면에서 참여 수를 숨김 |
| `posterTitle`, `titleFont`, `shadeColor`, `durationMinutes`, `shareImageUrl`, `warnings` | 서버에 없음 → 기본값 |

서버가 이 값들을 내려주기 시작하면 `wibble.ts`의 `ApiTestSchema`와 `toTestSummary`/`toTestDetail`에 추가하면 됩니다.

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

게임은 `gameUrl`에서 따로 호스팅됩니다. 결과를 사이트 결과 페이지로 넘기려면 `postMessage`로 알려줍니다 ([`src/lib/game-bridge.ts`](../src/lib/game-bridge.ts)).

| 방향 | 메시지 |
|---|---|
| 게임 → 사이트 | `{ source: "psytest-game", type: "ready" }` — `init`을 받을 때까지 300ms마다 반복 |
| 사이트 → 게임 | `{ source: "psytest-host", type: "init", slug, theme }` — 이 메시지의 `event.origin`이 사이트 주소 |
| 게임 → 사이트 | `{ source: "psytest-game", type: "result", resultId, result? }` — `init`에서 받은 origin으로만 전송 |

사이트는 `gameUrl`과 같은 origin에서, 해당 iframe이 보낸 메시지만 받습니다.

결과는 서버에 저장하지 않습니다. `result`를 받으면 이번 판의 `playId`(실행 기록 `starts`에 보낸 UUID, "처음부터"마다 새로 발급)를 공유용 id로 써서 아래 주소로 이동합니다. 결과 페이지는 이 쿼리만으로 그려집니다.

```
/t/{slug}/result/{playId}?r={resultId}&title=…&summary=…&tag=…&tag=…
```

`result`에 담을 수 있는 값 (모두 선택, [`src/lib/shared-result.ts`](../src/lib/shared-result.ts)):

| 필드 | 쿼리 | 최대 길이 | 화면 |
|---|---|---|---|
| `title` | `title` | 40자 | 결과 제목. 없으면 `resultId`를 그대로 보여 줌 |
| `summary` | `summary` | 200자 | 설명 (줄바꿈 유지) |
| `intro` | `intro` | 40자 | 제목 위 문구. 없으면 "{테스트 제목} 결과" |
| `emoji` | `emoji` | 8자 | 결과 그림 자리 |
| `hashtags` | `tag` (여러 번) | 20자 × 6개 | 해시태그 (`#`은 떼어 냄) |
| `goodMatch` / `badMatch` `{ label, emoji? }` | `good`·`goodEmoji` / `bad`·`badEmoji` | 20자 | 잘 맞는 / 안 맞는 유형 |

```js
parent.postMessage({
  source: "psytest-game", type: "result", resultId: "court-judge",
  result: { title: "공정한 재판장", summary: "증거부터 차근차근…", emoji: "⚖️", hashtags: ["신중함", "원칙주의"] },
}, hostOrigin);
```

쿼리는 누구나 고칠 수 있으므로 길이를 넘는 값은 잘리고, 형식이 틀린 항목은 버려집니다. 이미지 주소는 받지 않습니다 (공유 이미지는 테스트의 공유 이미지·썸네일). 결과 페이지는 검색에 올리지 않습니다(`noindex`).

게임 서버 설정:
- iframe 허용: `Content-Security-Policy: frame-ancestors https://<사이트 도메인>` (`X-Frame-Options`는 빼 주세요)
- 게임 화면은 모바일 세로 화면과 PC 16:9(전체화면 포함) 모두에서 보기 좋게 반응형으로 만들어 주세요
- 공포 테스트는 사이트가 시작 전에 경고를 띄우므로, 게임은 바로 시작해도 됩니다
