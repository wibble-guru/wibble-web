import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { isValidId } from "@/lib/ids";
import { apiGet, apiGetOrNull } from "./client";
import type { TestResult, TestSummary } from "./schemas";
import { ApiCategorySchema, ApiTestPageSchema, ApiTestSchema, toCategory, toTestDetail, toTestSummary } from "./wibble";

/*
 * 페이지가 쓰는 데이터 함수. 전부 "use cache"로 캐시되고, 태그로 즉시 무효화할 수 있다.
 * Wibble API(/api/psychology-…) 응답을 wibble.ts에서 화면용 형식으로 바꿔 돌려준다.
 * 서버에서 데이터가 바뀌면 POST /api/revalidate 로 아래 태그를 알려주면 된다 (docs/api.md).
 *
 * 빌드할 때는 API를 부르지 않는다. 빌드 서버에서는 API에 닿지 않을 수 있고(주소 없음, 아직 안 뜸,
 * Railway 같은 곳의 내부 네트워크), 그 때문에 배포가 멈추면 안 되기 때문이다.
 * 대신 connection()으로 미리 렌더링을 건너뛰고 실제 요청 때 불러와 캐시한다 (화면 틀은 그대로 미리 만들어진다).
 * 실행할 때 주소가 없거나 연결이 안 되면 그때 오류 화면이 나온다.
 */
async function requestTimeOnlyDuringBuild() {
  if (process.env.NEXT_PHASE === "phase-production-build" || !process.env.WIBBLE_API_URL) await connection();
}
export const cacheTags = {
  categories: "categories",
  tests: "tests",
  test: (slug: string) => `test:${slug}`,
  result: (slug: string, resultId: string) => `result:${slug}:${resultId}`,
} as const;

/** new: 최신순 · popular: 이번 주 인기 · all-time: 누적 참여 수 */
export type TestSort = "new" | "popular" | "all-time";
export type TestListQuery = {
  category?: string;
  sort?: TestSort;
  featured?: boolean;
  limit?: number;
};

const TESTS = "/api/psychology-tests";
/** 검색·추천처럼 서버에 전용 API가 없는 기능은 목록을 이만큼 받아와 프론트에서 거른다 (서버 최대 100) */
const SCAN_SIZE = 100;

export async function getCategories() {
  await requestTimeOnlyDuringBuild();
  return cachedGetCategories();
}

async function cachedGetCategories() {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.categories);
  const items = await apiGet("/api/psychology-categories", ApiCategorySchema.array());
  return items.map(toCategory);
}

export async function getTests(query: TestListQuery = {}) {
  await requestTimeOnlyDuringBuild();
  return cachedGetTests(query);
}

/** new → 최신순, popular → 이번 주 인기, all-time → 누적 인기 */
const SORT_PARAMS: Record<TestSort, { sort: string; period?: string }> = {
  new: { sort: "latest" },
  popular: { sort: "popular", period: "weekly" },
  "all-time": { sort: "popular", period: "all_time" },
};

async function cachedGetTests(query: TestListQuery = {}) {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.tests);
  if (query.featured) {
    // 어드민에서 featured로 고른 테스트가 있으면 그것만, 없으면 최신순
    const { items } = await apiGet(TESTS, ApiTestPageSchema, { sort: "latest", size: SCAN_SIZE, page: 0 });
    const picked = items.some((t) => t.featured) ? items.filter((t) => t.featured) : items;
    return picked.slice(0, query.limit ?? 5).map(toTestSummary);
  }
  const sort = SORT_PARAMS[query.sort ?? "new"];
  return fetchTests({ ...sort, category: query.category, size: query.limit ?? 20 });
}

async function fetchTests(params: { sort: string; period?: string; category?: string; size: number }) {
  const { items } = await apiGet(TESTS, ApiTestPageSchema, { ...params, page: 0 });
  return items.map(toTestSummary);
}

export async function searchTests(q: string, limit = 30) {
  await requestTimeOnlyDuringBuild();
  return cachedSearchTests(q, limit);
}

async function cachedSearchTests(q: string, limit = 30) {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.tests);
  const keyword = q.trim().toLowerCase();
  if (!keyword) return [];
  // 서버에 검색 API가 없어 최신 목록에서 제목·설명·장르로 거른다
  const tests = await fetchTests({ sort: "latest", size: SCAN_SIZE });
  const matches = (t: TestSummary) => [t.title, t.description, ...t.genres].some((text) => text.toLowerCase().includes(keyword));
  return tests.filter(matches).slice(0, limit);
}

export async function getTest(slug: string) {
  await requestTimeOnlyDuringBuild();
  return cachedGetTest(slug);
}

async function cachedGetTest(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.test(slug));
  if (!isValidId(slug)) return null;
  const test = await apiGetOrNull(`${TESTS}/${slug}`, ApiTestSchema);
  return test && toTestDetail(test);
}

/**
 * 서버에 결과 조회 API가 아직 없다. 지금 게임들은 결과를 게임 안에서 보여주므로
 * 결과 페이지(/t/{slug}/result/{id})는 찾을 수 없음으로 처리한다.
 */
export async function getResult(slug: string, resultId: string): Promise<TestResult | null> {
  void slug;
  void resultId;
  return null;
}

export async function getRecommendations(slug: string, limit = 4) {
  await requestTimeOnlyDuringBuild();
  return cachedGetRecommendations(slug, limit);
}

async function cachedGetRecommendations(slug: string, limit = 4) {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.test(slug), cacheTags.tests);
  if (!isValidId(slug)) return [];
  // 서버에 추천 API가 없어 최신 목록에서 같은 카테고리를 먼저 고른다
  const tests = await fetchTests({ sort: "latest", size: SCAN_SIZE });
  const current = tests.find((t) => t.slug === slug);
  const others = tests.filter((t) => t.slug !== slug);
  const related = (t: TestSummary) => (current?.categories.some((c) => t.categories.includes(c)) ? 0 : 1);
  return others.sort((a, b) => related(a) - related(b)).slice(0, limit);
}
