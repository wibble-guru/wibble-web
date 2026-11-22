# 어드민 API 요청 명세 (백엔드 구현 필요)

사이트 어드민(`/admin`)이 테스트·카테고리를 등록·수정하려면 아래 API가 Wibble API 서버(`https://api.wibble.guru`)에 있어야 합니다.
지금 Swagger에는 조회·기록 API만 있어서, 어드민은 **조회는 공개 API로 대신**하고 **저장하면 "아직 없음" 안내**를 보여줍니다.
아래 경로가 생기면 프론트 수정 없이 바로 동작합니다 (호출 코드: [`src/lib/admin/api.ts`](../src/lib/admin/api.ts)).

## 공통

- 인증: `Authorization: Bearer <WIBBLE_ADMIN_TOKEN>` — 사이트 서버만 호출합니다 (브라우저에서 직접 부르지 않음, CORS 불필요)
- 토큰이 없거나 틀리면 `401`/`403`
- 요청·응답 `application/json`. 오류는 지금처럼 `ProblemDetail` (`detail` 문구를 어드민에 그대로 보여줍니다)
- 경로가 없으면 `404`/`405`/`501` → 어드민이 "아직 없음"으로 처리

## 테스트

| 메서드 · 경로 | 설명 | 응답 |
|---|---|---|
| `GET /api/admin/psychology-tests?size=100` | 비공개 포함 전체 | `{ items: AdminTest[] }` |
| `GET /api/admin/psychology-tests/{slug}` | 하나 | `AdminTest` · 없으면 404 |
| `POST /api/admin/psychology-tests` | 새로 만들기 (본문 `TestInput`) | `201` + `AdminTest` · slug 중복이면 **409** |
| `PUT /api/admin/psychology-tests/{slug}` | 전체 수정 (본문 `TestInput`, slug는 바뀌지 않음) | `AdminTest` |
| `DELETE /api/admin/psychology-tests/{slug}` | 삭제 | `204` |

```ts
type TestInput = {
  slug: string;               // ^[a-z0-9][a-z0-9_-]{0,63}$ (대소문자 무시). 사이트 주소 /t/{slug}
  title: string;
  description: string;
  status: "PUBLISHED" | "DRAFT"; // DRAFT는 공개 API 목록·상세에서 빠짐 (상세 404)
  categorySlugs: string[];    // 순서 = 표시 순서. 공개 응답의 categories/category에 반영
  gameUrl: string | null;     // 게임 주소. 예: https://game.wibble.guru/court/
  thumbnailUrl: string | null;
  // ↓ 꾸밈 값. 공개 API(GET /api/psychology-tests, /{slug}) 응답에도 같은 이름으로 내려주세요
  emoji: string | null;
  thumbnailColor: "sky" | "pink" | "lemon" | "mint" | "lilac" | "peach" | null;
  posterTitle: string | null; // "\n"으로 줄 나눔
  titleFont: string | null;   // src/lib/title-fonts.ts 키
  shadeColor: string | null;  // "#rrggbb"
  durationMinutes: number | null;
  shareImageUrl: string | null;
  warnings: { emoji: string | null; label: string }[];
  featured: boolean;          // 홈 "오늘의 테스트" 배너
};

// 공개 PsychologyTestResponse + 위 꾸밈 값 + status
type AdminTest = PsychologyTestResponse & Omit<TestInput, "categorySlugs"> & {
  status: "PUBLISHED" | "DRAFT";
};
```

`publishedAt`은 서버가 처음 `PUBLISHED`가 될 때 정해 주세요 (사이트는 14일 안이면 NEW 배지).

## 카테고리

| 메서드 · 경로 | 설명 | 응답 |
|---|---|---|
| `GET /api/admin/psychology-categories` | 전체 (표시 순서대로) | `{ slug, name }[]` |
| `POST /api/admin/psychology-categories` | 추가 `{ slug, name, displayOrder }` | `201` · 중복이면 409 |
| `PUT /api/admin/psychology-categories/{slug}` | 수정 `{ slug, name, displayOrder }` | `200` |
| `DELETE /api/admin/psychology-categories/{slug}` | 삭제 (쓰는 테스트가 있으면 409 + detail) | `204` |

## 사이트 쪽

- 어드민에서 저장·삭제하면 사이트 캐시(목록·카테고리·해당 테스트)를 바로 비웁니다.
- 백엔드에서 직접 데이터를 고쳤다면 어드민 편집 화면의 "사이트 캐시 비우기" 또는 `POST /api/revalidate`(docs/api.md)를 쓰면 됩니다.
- 공개 API가 꾸밈 값을 내려주면 [`src/lib/api/wibble.ts`](../src/lib/api/wibble.ts)가 그 값을 먼저 쓰고, 없으면 지금처럼 기본값을 씁니다.
