import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { cacheTags } from "@/lib/api/queries";
import { ID_PATTERN } from "@/lib/ids";

/*
 * 백엔드가 콘텐츠를 바꾼 뒤 호출하는 캐시 무효화 웹훅.
 *   POST /api/revalidate
 *   Authorization: Bearer <REVALIDATE_SECRET>
 *   { "testSlug": "animal" }              → 그 테스트(상세·결과·추천) + 목록
 *   { "testSlug": "animal", "resultId": "cat" } → 그 결과 + 위 항목
 *   { "scope": "lists" }                  → 목록·카테고리 전체
 */
const BodySchema = z
  .object({
    testSlug: z.string().regex(ID_PATTERN).optional(),
    resultId: z.string().regex(ID_PATTERN).optional(),
    scope: z.enum(["lists"]).optional(),
  })
  .refine((b) => b.testSlug || b.scope, { message: "testSlug 또는 scope가 필요해요" })
  .refine((b) => !b.resultId || b.testSlug, { message: "resultId는 testSlug와 함께 보내야 해요" });

function authorized(request: Request, secret: string) {
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return Response.json({ error: "REVALIDATE_SECRET이 설정되지 않았어요" }, { status: 503 });
  if (!authorized(request, secret)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: z.prettifyError(parsed.error) }, { status: 400 });

  const { testSlug, resultId } = parsed.data;
  const tags = new Set<string>([cacheTags.tests]);
  if (parsed.data.scope === "lists") tags.add(cacheTags.categories);
  if (testSlug) tags.add(cacheTags.test(testSlug));
  if (testSlug && resultId) tags.add(cacheTags.result(testSlug, resultId));

  for (const tag of tags) revalidateTag(tag, "max");
  return Response.json({ revalidated: [...tags] });
}
