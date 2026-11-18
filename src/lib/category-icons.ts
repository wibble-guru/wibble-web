/**
 * 카테고리 카드에 쓰는 3D 아이콘 세트 (Microsoft Fluent Emoji 3D, MIT — public/icons/3d/LICENSE).
 * 서버는 카테고리의 `icon`으로 아래 키 중 하나를 보낸다 (docs/api.md).
 */
export const CATEGORY_ICONS = {
  sparkles: "/icons/3d/sparkles.png",
  heart: "/icons/3d/red_heart.png",
  "crystal-ball": "/icons/3d/crystal_ball.png",
  sun: "/icons/3d/sun.png",
  ghost: "/icons/3d/ghost.png",
  paw: "/icons/3d/paw_prints.png",
  star: "/icons/3d/star.png",
  fire: "/icons/3d/fire.png",
  balance: "/icons/3d/balance_scale.png",
  game: "/icons/3d/video_game.png",
  music: "/icons/3d/musical_note.png",
  travel: "/icons/3d/airplane.png",
  dessert: "/icons/3d/shortcake.png",
  coffee: "/icons/3d/hot_beverage.png",
  brain: "/icons/3d/brain.png",
  clover: "/icons/3d/four_leaf_clover.png",
} as const;

export type CategoryIconKey = keyof typeof CATEGORY_ICONS;
export const categoryIconKeys = Object.keys(CATEGORY_ICONS) as [CategoryIconKey, ...CategoryIconKey[]];

/** "전체" 카드 아이콘 (프론트 고정) */
export const ALL_CATEGORY_ICON: CategoryIconKey = "sparkles";
