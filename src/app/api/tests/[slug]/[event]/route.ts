import { z } from "zod";
import { ApiRequestError, apiPost } from "@/lib/api/client";
import { isValidId } from "@/lib/ids";

/*
 * 테스트 화면의 방문·게임 실행 기록을 Wibble API로 전달한다.
 * 브라우저에서 API를 바로 부르면 CORS로 막히므로 이 사이트 서버를 거친다.
 *   POST /api/tests/{slug}/views   { entryId }          → POST /api/psychology-tests/{slug}/views
 *   POST /api/tests/{slug}/starts  { entryId, playId }  → POST /api/psychology-tests/{slug}/starts
 * entryId·playId는 브라우저가 만든 UUID. 같은 값으로 재시도해도 서버가 한 번만 센다.
 */
const BODIES = {
  views: z.object({ entryId: z.uuid(), shareCode: z.uuid().optional() }),
  starts: z.object({ entryId: z.uuid(), playId: z.uuid() }),
} as const;

const isEvent = (value: string): value is keyof typeof BODIES => Object.hasOwn(BODIES, value);

export async function POST(request: Request, ctx: RouteContext<"/api/tests/[slug]/[event]">) {
  const { slug, event } = await ctx.params;
  if (!isValidId(slug) || !isEvent(event)) return new Response(null, { status: 404 });

  const parsed = BODIES[event].safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: z.prettifyError(parsed.error) }, { status: 400 });

  try {
    await apiPost(`/api/psychology-tests/${slug}/${event}`, parsed.data);
    return new Response(null, { status: 204 });
  } catch (error) {
    const status = error instanceof ApiRequestError && error.status && error.status < 500 ? error.status : 502;
    return new Response(null, { status });
  }
}
