import type { CSSProperties } from "react";

/**
 * 포스터·배너 제목 글꼴 (Figma "Top poster"). 서버는 테스트의 `titleFont`로 아래 키 중 하나를 보낸다 (docs/api.md).
 * - size: 폭 200px 이상 포스터에서의 글자 크기(px). 더 좁은 포스터에서는 폭에 비례해 줄어든다.
 * - 글꼴 파일은 src/app/fonts.ts에서 CSS 변수(--font-t-<키>)로 불러온다.
 */
export const TITLE_FONTS = {
  "watermelon-salad": { size: 26, weight: 400 },
  orbit: { size: 26, weight: 400 },
  jua: { size: 26, weight: 400 },
  "song-myung": { size: 26, weight: 400 },
  "bagel-fat-one": { size: 23, weight: 400 },
  "gowun-dodum": { size: 26, weight: 400 },
  "gowun-batang": { size: 24, weight: 700 },
  "black-han-sans": { size: 25, weight: 400 },
  "black-and-white-picture": { size: 30, weight: 400 },
} as const;

export type TitleFontKey = keyof typeof TITLE_FONTS;
export const titleFontKeys = Object.keys(TITLE_FONTS) as [TitleFontKey, ...TitleFontKey[]];

/** titleFont가 없을 때: 본문 글꼴(SUIT) 굵게 */
export const DEFAULT_TITLE_FONT = { size: 22, weight: 700 } as const;

export function titleFontStyle(key: TitleFontKey | null | undefined) {
  const font = key ? TITLE_FONTS[key] : DEFAULT_TITLE_FONT;
  return {
    fontFamily: key ? `var(--font-t-${key}), var(--font-sans)` : undefined,
    fontWeight: font.weight,
    "--title-size": font.size,
  } as CSSProperties;
}
