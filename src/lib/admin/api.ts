import "server-only";
import { z } from "zod";
import { ApiConfigError, ApiContractError, ApiRequestError, parse, request } from "@/lib/api/client";
import { ApiCategorySchema, ApiTestPageSchema, ApiTestSchema } from "@/lib/api/wibble";

/*
 * 어드민 API (docs/admin-api.md). 아직 백엔드에 없어서, 조회는 공개 API로 대신하고
 * 저장은 서버가 404/405/501을 주면 "아직 없음"으로 알려 준다.
 */

const ADMIN = "/api/admin";
const token = () => process.env.WIBBLE_ADMIN_TOKEN;

export const TestStatusSchema = z.enum(["PUBLISHED", "DRAFT"]);
export type TestStatus = z.infer<typeof TestStatusSchema>;

export const AdminTestSchema = ApiTestSchema.extend({
  /** 공개 API로 대신 읽으면 공개된 것만 오므로 PUBLISHED */
  status: TestStatusSchema.default("PUBLISHED").catch("PUBLISHED"),
});
export type AdminTest = z.infer<typeof AdminTestSchema>;
const AdminPageSchema = z.object({ items: z.array(AdminTestSchema) });
export type AdminCategory = z.infer<typeof ApiCategorySchema>;

/** 저장할 때 보내는 테스트 값 (POST·PUT 본문) */
export type TestInput = {
  slug: string;
  title: string;
  description: string;
  status: TestStatus;
  categorySlugs: string[];
  gameUrl: string | null;
  thumbnailUrl: string | null;
  emoji: string | null;
  thumbnailColor: string | null;
  posterTitle: string | null;
  titleFont: string | null;
  shadeColor: string | null;
  durationMinutes: number | null;
  shareImageUrl: string | null;
  warnings: { emoji: string | null; label: string }[];
  featured: boolean;
};

export type CategoryInput = { slug: string; name: string; displayOrder: number | null };

/** 어드민 API가 백엔드에 아직 없다고 볼 응답 */
const MISSING = new Set([404, 405, 501]);

/** 읽기 결과. source가 "public"이면 어드민 API가 없어 공개 API로 대신 읽은 것 */
export type Loaded<T> = { data: T; source: "admin" | "public" };

export async function listTests(): Promise<Loaded<AdminTest[]>> {
  const res = await request(`${ADMIN}/psychology-tests`, { token: token(), query: { size: 100 } });
  if (res.ok) return { data: (await parse(res, "admin tests", AdminPageSchema)).items, source: "admin" };
  if (!MISSING.has(res.status)) throw new ApiRequestError(`어드민 테스트 목록: HTTP ${res.status}`, ADMIN, res.status);
  const fallback = await request("/api/psychology-tests", { query: { sort: "latest", size: 100, page: 0 } } /* 서버 최대 100 */);
  if (!fallback.ok) throw new ApiRequestError(`테스트 목록: HTTP ${fallback.status}`, "/api/psychology-tests", fallback.status);
  const { items } = await parse(fallback, "tests", ApiTestPageSchema);
  return { data: items.map((t) => AdminTestSchema.parse(t)), source: "public" };
}

export async function getTest(slug: string): Promise<Loaded<AdminTest> | null> {
  const res = await request(`${ADMIN}/psychology-tests/${slug}`, { token: token() });
  if (res.ok) return { data: await parse(res, "admin test", AdminTestSchema), source: "admin" };
  if (!MISSING.has(res.status)) throw new ApiRequestError(`어드민 테스트: HTTP ${res.status}`, ADMIN, res.status);
  const fallback = await request(`/api/psychology-tests/${slug}`);
  if (fallback.status === 404) return null;
  if (!fallback.ok) throw new ApiRequestError(`테스트: HTTP ${fallback.status}`, slug, fallback.status);
  return { data: await parse(fallback, "test", AdminTestSchema), source: "public" };
}

export async function listCategories(): Promise<Loaded<AdminCategory[]>> {
  const res = await request(`${ADMIN}/psychology-categories`, { token: token() });
  if (res.ok) return { data: await parse(res, "admin categories", ApiCategorySchema.array()), source: "admin" };
  if (!MISSING.has(res.status)) throw new ApiRequestError(`어드민 카테고리: HTTP ${res.status}`, ADMIN, res.status);
  const fallback = await request("/api/psychology-categories");
  if (!fallback.ok) throw new ApiRequestError(`카테고리: HTTP ${fallback.status}`, "categories", fallback.status);
  return { data: await parse(fallback, "categories", ApiCategorySchema.array()), source: "public" };
}

/* ---------- 쓰기 ---------- */

export type WriteResult = { ok: true } | { ok: false; message: string };

async function write(method: "POST" | "PUT" | "DELETE", path: string, body?: unknown): Promise<WriteResult> {
  try {
    const res = await request(`${ADMIN}${path}`, { method, body, token: token() });
    if (res.ok) return { ok: true };
    if (MISSING.has(res.status)) {
      return { ok: false, message: `백엔드에 어드민 API(${method} ${ADMIN}${path})가 아직 없어요. docs/admin-api.md 대로 추가되면 저장돼요. (HTTP ${res.status})` };
    }
    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: `어드민 API가 권한을 거부했어요. WIBBLE_ADMIN_TOKEN을 확인해 주세요. (HTTP ${res.status})` };
    }
    if (res.status === 409) return { ok: false, message: "같은 slug가 이미 있어요." };
    return { ok: false, message: (await problemDetail(res)) ?? `저장하지 못했어요. (HTTP ${res.status})` };
  } catch (error) {
    if (error instanceof ApiConfigError || error instanceof ApiRequestError || error instanceof ApiContractError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }
}

/** Spring ProblemDetail의 detail 문구 */
async function problemDetail(res: Response) {
  const body = await res.json().catch(() => null);
  const detail = z.object({ detail: z.string().min(1) }).safeParse(body);
  return detail.success ? detail.data.detail : null;
}

export const createTest = (input: TestInput) => write("POST", "/psychology-tests", input);
export const updateTest = (slug: string, input: TestInput) => write("PUT", `/psychology-tests/${slug}`, input);
export const deleteTest = (slug: string) => write("DELETE", `/psychology-tests/${slug}`);
export const createCategory = (input: CategoryInput) => write("POST", "/psychology-categories", input);
export const updateCategory = (slug: string, input: CategoryInput) => write("PUT", `/psychology-categories/${slug}`, input);
export const deleteCategory = (slug: string) => write("DELETE", `/psychology-categories/${slug}`);
