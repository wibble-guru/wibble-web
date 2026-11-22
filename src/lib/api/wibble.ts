import "server-only";
import { z } from "zod";
import type { CategoryIconKey } from "@/lib/category-icons";
import { ID_PATTERN } from "@/lib/ids";
import {
  ThumbnailColorSchema,
  TitleFontSchema,
  WarningSchema,
  thumbnailColors,
  type Category,
  type TestDetail,
  type TestSummary,
} from "./schemas";

/*
 * Wibble API 서버(https://api.wibble.guru, Swagger: /swagger-ui/index.html)의 실제 응답 형식과
 * 화면이 쓰는 형식(schemas.ts) 사이의 변환. 서버가 아직 주지 않는 꾸밈 값(색·이모지·NEW 등)은 여기서 채운다.
 * 꾸밈 값은 어드민 API 계약(docs/admin-api.md)에 있는 필드라, 서버가 내려주기 시작하면 그 값을 먼저 쓴다.
 */

const id = z.string().regex(ID_PATTERN);
const optionalText = z.string().trim().min(1).nullish().catch(null);

export const ApiCategorySchema = z.object({
  slug: id,
  name: z.string().min(1),
});

export const ApiTestSchema = z.object({
  slug: id,
  title: z.string().min(1),
  description: z.string().nullish(),
  publishedAt: z.string().nullish(),
  thumbnailUrl: z.url().nullish().catch(null),
  /** 아직 게임이 배포되지 않은 테스트는 null */
  gameUrl: z.url({ protocol: /^https?$/ }).nullish().catch(null),
  category: ApiCategorySchema.nullish().catch(null),
  categories: z.array(ApiCategorySchema).nullish().catch(null),
  // ↓ 꾸밈 값 (docs/admin-api.md). 지금 서버는 보내지 않는다
  emoji: optionalText,
  thumbnailColor: ThumbnailColorSchema.nullish().catch(null),
  posterTitle: optionalText,
  titleFont: TitleFontSchema.nullish().catch(null),
  shadeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullish().catch(null),
  durationMinutes: z.number().positive().nullish().catch(null),
  shareImageUrl: z.url().nullish().catch(null),
  warnings: z.array(WarningSchema).nullish().catch(null),
  featured: z.boolean().nullish().catch(null),
  playCount: z.number().int().nonnegative().nullish().catch(null),
});

export const ApiTestPageSchema = z.object({
  items: z.array(ApiTestSchema),
  page: z.number().int().optional(),
  size: z.number().int().optional(),
  hasNext: z.boolean().optional(),
});

export type ApiCategory = z.infer<typeof ApiCategorySchema>;
export type ApiTest = z.infer<typeof ApiTestSchema>;

/** 카테고리별 아이콘·이모지. 서버에 없는 값이라 프론트가 정한다. 모르는 카테고리는 기본 아이콘 */
const CATEGORY_LOOKS: Record<string, { icon: CategoryIconKey; emoji: string }> = {
  horror: { icon: "ghost", emoji: "👻" },
  mystery: { icon: "brain", emoji: "🔍" },
};

const NEW_FOR_DAYS = 14;

export function toCategory(c: ApiCategory): Category {
  const look = CATEGORY_LOOKS[c.slug];
  return { slug: c.slug, name: c.name, icon: look?.icon ?? null, emoji: look?.emoji ?? null };
}

function categoriesOf(t: ApiTest): ApiCategory[] {
  if (t.categories?.length) return t.categories;
  return t.category ? [t.category] : [];
}

/** slug마다 늘 같은 썸네일 색 */
function colorFor(slug: string) {
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return thumbnailColors[Math.abs(hash) % thumbnailColors.length];
}

function isRecent(publishedAt: string | null | undefined) {
  if (!publishedAt) return false;
  const time = Date.parse(publishedAt);
  return Number.isFinite(time) && Date.now() - time < NEW_FOR_DAYS * 24 * 60 * 60 * 1000;
}

export function toTestSummary(t: ApiTest): TestSummary {
  const cats = categoriesOf(t);
  const horror = cats.some((c) => c.slug === "horror");
  return {
    slug: t.slug,
    title: t.title,
    description: t.description ?? "",
    emoji: t.emoji ?? (horror ? null : (cats.map((c) => CATEGORY_LOOKS[c.slug]?.emoji).find(Boolean) ?? null)),
    thumbnailUrl: t.thumbnailUrl ?? null,
    thumbnailColor: t.thumbnailColor ?? colorFor(t.slug),
    theme: horror ? "horror" : "default",
    playCount: t.playCount ?? 0,
    isNew: isRecent(t.publishedAt),
    categories: cats.map((c) => c.slug),
    posterTitle: t.posterTitle ?? null,
    titleFont: t.titleFont ?? null,
    genres: cats.map((c) => c.name),
    shadeColor: t.shadeColor ?? null,
  };
}

export function toTestDetail(t: ApiTest): TestDetail {
  return {
    ...toTestSummary(t),
    gameUrl: t.gameUrl ?? null,
    durationMinutes: t.durationMinutes ?? null,
    shareImageUrl: t.shareImageUrl ?? null,
    warnings: t.warnings ?? [],
  };
}
