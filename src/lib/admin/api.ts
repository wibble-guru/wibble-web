import "server-only";
import { z } from "zod";
import { ApiConfigError, ApiContractError, ApiRequestError, parse, request } from "@/lib/api/client";
import { notFound } from "next/navigation";
import { ApiCategorySchema, ApiTestSchema } from "@/lib/api/wibble";

/*
 * 어드민 API (docs/admin-api.md). 공개 API는 쓰지 않는다.
 * 서버가 거부하거나(401/403) 없다고 하면(404) 어드민 화면은 404를 띄운다.
 */

const ADMIN = "/api/admin";
const token = () => process.env.WIBBLE_ADMIN_TOKEN;

export const TestStatusSchema = z.enum(["PUBLISHED", "DRAFT"]);
export type TestStatus = z.infer<typeof TestStatusSchema>;

export const AdminTestSchema = ApiTestSchema.extend({
  status: TestStatusSchema,
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

/** 이 응답이면 어드민 화면은 404: 토큰이 없거나 틀림(401/403), 없는 항목(404) */
const NOT_FOUND = new Set([401, 403, 404]);

/**
 * 어드민 API로 읽는다. 거부·없음이면 notFound()로 404 화면,
 * 그 밖의 실패(5xx·연결 실패)는 오류를 던져 어드민 오류 화면을 띄운다.
 */
async function readAdmin<S extends z.ZodType>(path: string, schema: S, query?: Record<string, number>): Promise<z.infer<S>> {
  const res = await request(`${ADMIN}${path}`, { token: token(), query });
  if (NOT_FOUND.has(res.status)) notFound();
  if (!res.ok) throw new ApiRequestError(`어드민 API ${path}: HTTP ${res.status}`, path, res.status);
  return parse(res, `admin ${path}`, schema);
}

export async function listTests() {
  return (await readAdmin("/psychology-tests", AdminPageSchema, { size: 100 })).items; // 서버 최대 100
}

export function getTest(slug: string) {
  return readAdmin(`/psychology-tests/${slug}`, AdminTestSchema);
}

export function listCategories() {
  return readAdmin("/psychology-categories", ApiCategorySchema.array());
}

/* ---------- 쓰기 ---------- */

export type WriteResult = { ok: true } | { ok: false; message: string };

async function write(method: "POST" | "PUT" | "DELETE", path: string, body?: unknown): Promise<WriteResult> {
  try {
    const res = await request(`${ADMIN}${path}`, { method, body, token: token() });
    if (res.ok) return { ok: true };
    if (res.status === 404) return { ok: false, message: "없거나 이미 삭제된 항목이에요." };
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
