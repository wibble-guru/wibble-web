import { z } from "zod";
import { categoryIconKeys } from "@/lib/category-icons";
import { ID_PATTERN } from "@/lib/ids";
import { titleFontKeys } from "@/lib/title-fonts";

/*
 * 서버 응답 계약. docs/api.md와 함께 관리한다.
 * - 화면에 꼭 필요한 값(slug, title, gameUrl …)은 엄격하게 검증해 계약 위반을 바로 드러낸다.
 * - 꾸밈용 값(썸네일 색, 이모지 …)은 잘못 와도 기본값으로 대체해 화면이 깨지지 않게 한다.
 */

const id = z.string().regex(ID_PATTERN, "영문·숫자·-·_ 로 된 1~64자여야 해요");
const optionalUrl = z.url().nullish().catch(null);
const optionalText = z.string().trim().min(1).nullish().catch(null);

export const thumbnailColors = ["sky", "pink", "lemon", "mint", "lilac", "peach"] as const;
export const ThumbnailColorSchema = z.enum(thumbnailColors);
export const ThemeSchema = z.enum(["default", "horror"]);
export const TitleFontSchema = z.enum(titleFontKeys);
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const CategorySchema = z.object({
  slug: id,
  name: z.string().min(1),
  /** 3D 아이콘 키 (src/lib/category-icons.ts). 모르는 키면 emoji로 대체 */
  icon: z.enum(categoryIconKeys).nullish().catch(null),
  emoji: optionalText,
});

export const TestSummarySchema = z.object({
  slug: id,
  title: z.string().min(1),
  description: z.string().default(""),
  emoji: optionalText,
  thumbnailUrl: optionalUrl,
  thumbnailColor: ThumbnailColorSchema.nullish().catch(null),
  theme: ThemeSchema.default("default").catch("default"),
  playCount: z.number().int().nonnegative().default(0).catch(0),
  isNew: z.boolean().default(false).catch(false),
  categories: z.array(z.string()).default([]).catch([]),
  /** 포스터에 쓸 제목. 줄바꿈(\n)을 넣어 줄 나눔을 정할 수 있다. 없으면 title */
  posterTitle: optionalText,
  /** 포스터·배너 제목 글꼴 키 (src/lib/title-fonts.ts). 모르는 키면 기본 글꼴 */
  titleFont: TitleFontSchema.nullish().catch(null),
  /** 제목 아래 장르 줄. ["공포", "나폴리탄"] → "공포 · 나폴리탄" */
  genres: z.array(z.string().trim().min(1)).default([]).catch([]),
  /** 포스터 아래쪽 그림자 색 (#rrggbb). 없으면 썸네일 색에 맞춘 기본값 */
  shadeColor: hexColor.nullish().catch(null),
});

export const WarningSchema = z.object({
  emoji: optionalText,
  label: z.string().min(1),
});

export const TestDetailSchema = TestSummarySchema.extend({
  /** 따로 호스팅된 게임 주소. iframe으로 띄운다. */
  gameUrl: z.url({ protocol: /^https?$/ }),
  durationMinutes: z.number().positive().nullish().catch(null),
  shareImageUrl: optionalUrl,
  /** 공포 테스트 시작 전 경고에 보여줄 항목 (예: 깜짝 놀라는 장면, 효과음) */
  warnings: z.array(WarningSchema).default([]).catch([]),
});

export const MatchSchema = z.object({
  emoji: optionalText,
  label: z.string().min(1),
});

export const TestResultSchema = z.object({
  id,
  title: z.string().min(1),
  summary: z.string().default(""),
  /** 결과 제목 위 문구. 예: "나와 닮은 동물은" */
  intro: optionalText,
  emoji: optionalText,
  imageUrl: optionalUrl,
  hashtags: z.array(z.string().min(1)).default([]).catch([]),
  goodMatch: MatchSchema.nullish().catch(null),
  badMatch: MatchSchema.nullish().catch(null),
});

export const listOf = <T extends z.ZodType>(item: T) => z.object({ items: z.array(item) });

export type Category = z.infer<typeof CategorySchema>;
export type TestSummary = z.infer<typeof TestSummarySchema>;
export type TestDetail = z.infer<typeof TestDetailSchema>;
export type TestResult = z.infer<typeof TestResultSchema>;
export type Warning = z.infer<typeof WarningSchema>;
export type Match = z.infer<typeof MatchSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type ThumbnailColor = z.infer<typeof ThumbnailColorSchema>;
export type TitleFont = z.infer<typeof TitleFontSchema>;
