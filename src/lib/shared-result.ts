import type { Match, TestResult } from "@/lib/api/schemas";
import { isValidId } from "@/lib/ids";
import { resultPath } from "@/lib/site";

/*
 * 게임 결과는 서버에 저장하지 않는다. 게임이 보낸 결과 내용을 결과 페이지 주소의 쿼리에 그대로 싣고,
 * 경로에는 이번 판의 고유 id(playId)만 넣어 공유 링크마다 주소가 달라지게 한다.
 *
 *   /t/{slug}/result/{playId}?r=court-judge&title=…&summary=…&tag=…&tag=…
 *
 * 쿼리는 누구나 고쳐 쓸 수 있으므로 길이를 자르고, 글자로만 보여 준다 (이미지 주소는 받지 않는다).
 */

/** 게임이 결과(result 메시지의 result)로 보낼 수 있는 내용. 모두 선택이다. */
export type ResultContent = {
  title?: string;
  summary?: string;
  intro?: string;
  emoji?: string;
  hashtags?: string[];
  goodMatch?: Match;
  badMatch?: Match;
};

const MAX = { title: 40, summary: 200, intro: 40, emoji: 8, tag: 20, tags: 6, match: 20 } as const;

function clip(value: unknown, max: number) {
  if (typeof value !== "string") return undefined;
  const text = Array.from(value.trim()).slice(0, max).join("").trim();
  return text || undefined;
}

function readMatch(value: unknown): Match | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const raw = value as Record<string, unknown>;
  const label = clip(raw.label, MAX.match);
  return label ? { label, emoji: clip(raw.emoji, MAX.emoji) ?? null } : undefined;
}

/** 게임 메시지든 쿼리든, 받은 값을 같은 규칙(타입·길이)으로 걸러 낸다. */
export function readResultContent(value: unknown): ResultContent {
  if (typeof value !== "object" || value === null) return {};
  const raw = value as Record<string, unknown>;
  const tags = Array.isArray(raw.hashtags) ? raw.hashtags : [];
  return {
    title: clip(raw.title, MAX.title),
    summary: clip(raw.summary, MAX.summary),
    intro: clip(raw.intro, MAX.intro),
    emoji: clip(raw.emoji, MAX.emoji),
    hashtags: tags
      .map((tag) => clip(typeof tag === "string" ? tag.replace(/^#+/, "") : tag, MAX.tag))
      .filter((tag): tag is string => tag !== undefined)
      .slice(0, MAX.tags),
    goodMatch: readMatch(raw.goodMatch),
    badMatch: readMatch(raw.badMatch),
  };
}

/** 결과 페이지 주소. playId는 경로에, 결과 id와 내용은 쿼리에. */
export function sharedResultPath(slug: string, playId: string, resultId: string, content: unknown) {
  const c = readResultContent(content);
  const query = new URLSearchParams({ r: resultId });
  if (c.title) query.set("title", c.title);
  if (c.summary) query.set("summary", c.summary);
  if (c.intro) query.set("intro", c.intro);
  if (c.emoji) query.set("emoji", c.emoji);
  for (const tag of c.hashtags ?? []) query.append("tag", tag);
  if (c.goodMatch) {
    query.set("good", c.goodMatch.label);
    if (c.goodMatch.emoji) query.set("goodEmoji", c.goodMatch.emoji);
  }
  if (c.badMatch) {
    query.set("bad", c.badMatch.label);
    if (c.badMatch.emoji) query.set("badEmoji", c.badMatch.emoji);
  }
  return `${resultPath(slug, playId)}?${query}`;
}

type Query = Record<string, string | string[] | undefined>;

/**
 * 결과 페이지 쿼리 → 결과 카드 값. 결과 id(r)가 없거나 형식이 틀리면 null.
 * 게임이 제목을 보내지 않았으면 결과 id를 제목으로 쓴다.
 */
export function readSharedResult(query: Query): TestResult | null {
  const one = (key: string) => {
    const value = query[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const resultId = one("r");
  if (!isValidId(resultId)) return null;
  const tags = query.tag;
  const c = readResultContent({
    title: one("title"),
    summary: one("summary"),
    intro: one("intro"),
    emoji: one("emoji"),
    hashtags: tags === undefined ? [] : Array.isArray(tags) ? tags : [tags],
    goodMatch: { label: one("good"), emoji: one("goodEmoji") },
    badMatch: { label: one("bad"), emoji: one("badEmoji") },
  });
  return {
    id: resultId,
    title: c.title ?? resultId,
    summary: c.summary ?? "",
    intro: c.intro ?? null,
    emoji: c.emoji ?? null,
    imageUrl: null,
    hashtags: c.hashtags ?? [],
    goodMatch: c.goodMatch ?? null,
    badMatch: c.badMatch ?? null,
  };
}
