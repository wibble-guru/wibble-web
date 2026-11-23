export const SITE_NAME = "Wibble";
export const SITE_DESCRIPTION = "게임으로 즐기는 유형 테스트";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export function absoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

export const testPath = (slug: string) => `/t/${slug}`;
/** 결과 페이지 경로. playId는 한 판마다 새로 만드는 공유용 id (쿼리는 src/lib/shared-result.ts) */
export const resultPath = (slug: string, playId: string) => `/t/${slug}/result/${encodeURIComponent(playId)}`;

export const SITE_TAGLINE = "게임으로 즐기는 심리테스트";
export const CONTACT_EMAIL = "contact@wibble.guru";
export const COPYRIGHT_YEAR = 2026;

/** 푸터 SNS. 계정이 생기면 주소를 넣는다 — 비어 있으면 아이콘만 보이고 눌리지 않는다. */
export const SOCIAL_LINKS: { id: "x" | "kakao" | "instagram"; label: string; href: string | null }[] = [
  { id: "x", label: "X", href: null },
  { id: "kakao", label: "카카오톡 채널", href: null },
  { id: "instagram", label: "인스타그램", href: null },
];
