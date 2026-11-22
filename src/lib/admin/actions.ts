"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { cacheTags } from "@/lib/api/queries";
import { ThumbnailColorSchema, TitleFontSchema } from "@/lib/api/schemas";
import { ID_PATTERN } from "@/lib/ids";
import * as admin from "./api";
import { checkPassword, endSession, requireAdmin, startSession } from "./session";

/** 폼 액션 결과. 성공하면 대부분 redirect하므로 실패 문구만 돌려준다 */
export type FormState = { error?: string; notice?: string } | null;

/* ---------- 로그인 ---------- */

export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  if (!checkPassword(String(form.get("password") ?? ""))) return { error: "비밀번호가 맞지 않아요." };
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

/* ---------- 테스트 ---------- */

const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : typeof v === "string" ? v.trim() : v);
const optionalUrl = z.preprocess(blankToNull, z.url({ protocol: /^https?$/, error: "http(s) 주소를 넣어 주세요" }).nullable());
const optionalText = z.preprocess(blankToNull, z.string().nullable());

const TestFormSchema = z.object({
  slug: z.string().trim().regex(ID_PATTERN, "slug는 영문·숫자·-·_ 1~64자여야 해요"),
  title: z.string().trim().min(1, "제목을 넣어 주세요"),
  description: z.string().trim(),
  status: admin.TestStatusSchema,
  categorySlugs: z.array(z.string().regex(ID_PATTERN)),
  gameUrl: optionalUrl,
  thumbnailUrl: optionalUrl,
  shareImageUrl: optionalUrl,
  emoji: optionalText,
  thumbnailColor: z.preprocess(blankToNull, ThumbnailColorSchema.nullable()),
  posterTitle: z.preprocess((v) => (typeof v === "string" ? v.replace(/\r\n/g, "\n") : v), optionalText),
  titleFont: z.preprocess(blankToNull, TitleFontSchema.nullable()),
  shadeColor: z.preprocess(blankToNull, z.string().regex(/^#[0-9a-fA-F]{6}$/, "그림자 색은 #rrggbb 형식이에요").nullable()),
  durationMinutes: z.preprocess((v) => (blankToNull(v) === null ? null : Number(v)), z.number().positive("소요 시간은 0보다 커야 해요").nullable()),
  warnings: z.string(),
  featured: z.boolean(),
});

/** "😱 깜짝 놀라는 장면" 한 줄 → { emoji, label }. 첫 단어가 글자·숫자로 시작하지 않으면 이모지로 본다 */
function parseWarnings(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [first, ...rest] = line.split(/\s+/);
      const isEmoji = rest.length > 0 && !/^[\p{L}\p{N}]/u.test(first);
      return isEmoji ? { emoji: first, label: rest.join(" ") } : { emoji: null, label: line };
    });
}

function readTestForm(form: FormData) {
  return TestFormSchema.safeParse({
    ...Object.fromEntries(form),
    categorySlugs: form.getAll("categorySlugs"),
    featured: form.get("featured") === "on",
    warnings: String(form.get("warnings") ?? ""),
  });
}

function refreshSite(slug?: string) {
  updateTag(cacheTags.tests);
  updateTag(cacheTags.categories);
  if (slug) updateTag(cacheTags.test(slug));
}

/** originalSlug가 없으면 새로 만들기, 있으면 수정 */
export async function saveTest(originalSlug: string | null, _prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = readTestForm(form);
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" · ") };
  const { warnings, ...rest } = parsed.data;
  const input: admin.TestInput = { ...rest, warnings: parseWarnings(warnings) };
  if (originalSlug) input.slug = originalSlug; // slug는 주소라 만든 뒤에는 바꾸지 않는다

  const result = originalSlug ? await admin.updateTest(originalSlug, input) : await admin.createTest(input);
  if (!result.ok) return { error: result.message };
  refreshSite(input.slug);
  redirect(`/admin/tests/${input.slug}?saved=1`);
}

export async function removeTest(slug: string): Promise<FormState> {
  await requireAdmin();
  const result = await admin.deleteTest(slug);
  if (!result.ok) return { error: result.message };
  refreshSite(slug);
  redirect("/admin?deleted=1");
}

/** 백엔드에서 직접 고친 내용을 사이트에 바로 반영 (캐시 비우기) */
export async function refreshTest(slug: string): Promise<FormState> {
  await requireAdmin();
  refreshSite(slug);
  return { notice: "사이트 캐시를 비웠어요. 다음 방문부터 서버 최신 값이 보여요." };
}

/* ---------- 카테고리 ---------- */

const CategoryFormSchema = z.object({
  slug: z.string().trim().regex(ID_PATTERN, "slug는 영문·숫자·-·_ 1~64자여야 해요"),
  name: z.string().trim().min(1, "이름을 넣어 주세요"),
  displayOrder: z.preprocess((v) => (blankToNull(v) === null ? null : Number(v)), z.number().int("순서는 정수예요").nullable()),
});

export async function saveCategory(originalSlug: string | null, _prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = CategoryFormSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" · ") };
  const input = originalSlug ? { ...parsed.data, slug: originalSlug } : parsed.data;
  const result = originalSlug ? await admin.updateCategory(originalSlug, input) : await admin.createCategory(input);
  if (!result.ok) return { error: result.message };
  refreshSite();
  return { notice: originalSlug ? "저장했어요." : "추가했어요." };
}

export async function removeCategory(slug: string): Promise<FormState> {
  await requireAdmin();
  const result = await admin.deleteCategory(slug);
  if (!result.ok) return { error: result.message };
  refreshSite();
  return { notice: "삭제했어요." };
}
