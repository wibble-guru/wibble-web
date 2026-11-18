import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { isValidId } from "@/lib/ids";
import { apiGet, apiGetOrNull } from "./client";
import { CategorySchema, TestDetailSchema, TestResultSchema, TestSummarySchema, listOf } from "./schemas";

/*
 * 페이지가 쓰는 데이터 함수. 전부 "use cache"로 캐시되고, 태그로 즉시 무효화할 수 있다.
 * 서버에서 데이터가 바뀌면 POST /api/revalidate 로 아래 태그를 알려주면 된다 (docs/api.md).
 *
 * 빌드할 때는 홈·목록 화면을 미리 렌더링하면서 API를 부른다. WIBBLE_API_URL이 없는 빌드 환경에서는
 * 미리 렌더링을 건너뛰고(connection) 실제 요청 때 불러오게 해서 빌드가 멈추지 않게 한다.
 * 실행할 때도 주소가 없으면 그때 ApiConfigError로 오류 화면이 나온다.
 */
async function whenConfigured() {
  if (!process.env.WIBBLE_API_URL) await connection();
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

export async function getCategories() {
  await whenConfigured();
  return cachedGetCategories();
}

async function cachedGetCategories() {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.categories);
  const { items } = await apiGet("/categories", listOf(CategorySchema));
  return items;
}

export async function getTests(query: TestListQuery = {}) {
  await whenConfigured();
  return cachedGetTests(query);
}

async function cachedGetTests(query: TestListQuery = {}) {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.tests);
  const { items } = await apiGet("/tests", listOf(TestSummarySchema), {
    category: query.category,
    sort: query.sort,
    featured: query.featured || undefined,
    limit: query.limit,
  });
  return items;
}

export async function searchTests(q: string, limit = 30) {
  await whenConfigured();
  return cachedSearchTests(q, limit);
}

async function cachedSearchTests(q: string, limit = 30) {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.tests);
  const keyword = q.trim();
  if (!keyword) return [];
  const { items } = await apiGet("/tests", listOf(TestSummarySchema), { q: keyword, limit });
  return items;
}

export async function getTest(slug: string) {
  await whenConfigured();
  return cachedGetTest(slug);
}

async function cachedGetTest(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.test(slug));
  if (!isValidId(slug)) return null;
  return apiGetOrNull(`/tests/${slug}`, TestDetailSchema);
}

export async function getResult(slug: string, resultId: string) {
  await whenConfigured();
  return cachedGetResult(slug, resultId);
}

async function cachedGetResult(slug: string, resultId: string) {
  "use cache";
  cacheLife("days");
  cacheTag(cacheTags.test(slug), cacheTags.result(slug, resultId));
  if (!isValidId(slug) || !isValidId(resultId)) return null;
  return apiGetOrNull(`/tests/${slug}/results/${resultId}`, TestResultSchema);
}

export async function getRecommendations(slug: string, limit = 4) {
  await whenConfigured();
  return cachedGetRecommendations(slug, limit);
}

async function cachedGetRecommendations(slug: string, limit = 4) {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.test(slug), cacheTags.tests);
  if (!isValidId(slug)) return [];
  const { items } = await apiGet(`/tests/${slug}/recommendations`, listOf(TestSummarySchema), { limit });
  return items.filter((t) => t.slug !== slug);
}
