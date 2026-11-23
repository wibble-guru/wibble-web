import { isValidId } from "@/lib/ids";
import type { Theme } from "@/lib/api/schemas";

/**
 * 호스트(이 사이트) <-> iframe 게임 간 postMessage 프로토콜. docs/api.md "게임 연동" 참고.
 *
 *   game -> host  { source: "psytest-game", type: "ready" }            (init을 받을 때까지 반복 전송)
 *   host -> game  { source: "psytest-host", type: "init", slug, theme }
 *   game -> host  { source: "psytest-game", type: "result", resultId, result? } (init에서 받은 origin으로만 전송)
 *
 * result는 결과 카드 내용(제목·설명·해시태그 …, src/lib/shared-result.ts의 ResultContent). 서버에 저장하지 않고
 * 결과 페이지 주소의 쿼리로 넘긴다. 형식이 틀린 값은 그 항목만 버린다.
 */
export type GameMessage =
  | { source: "psytest-game"; type: "ready" }
  | { source: "psytest-game"; type: "result"; resultId: string; result?: unknown };

export type HostMessage = { source: "psytest-host"; type: "init"; slug: string; theme: Theme };

export function isGameMessage(data: unknown): data is GameMessage {
  if (typeof data !== "object" || data === null) return false;
  const msg = data as Record<string, unknown>;
  if (msg.source !== "psytest-game") return false;
  if (msg.type === "ready") return true;
  return msg.type === "result" && isValidId(msg.resultId);
}
