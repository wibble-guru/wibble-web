"use client";

import { useEffect, useRef, useState } from "react";
import type { Theme } from "@/lib/api/schemas";
import { cx } from "@/lib/format";
import { isGameMessage, type HostMessage } from "@/lib/game-bridge";
import { sharedResultPath } from "@/lib/shared-result";
import { buttonClass } from "./ui";

type Device = "mobile" | "pc";

function originOf(url: string) {
  try {
    const parsed = new URL(url);
    return /^https?:$/.test(parsed.protocol) ? parsed.origin : null;
  } catch {
    return null;
  }
}

/**
 * 게임 주소를 사이트와 같은 방식으로 띄워 본다. 게임이 ready를 보내면 init으로 답하고,
 * 결과(result)는 이동하지 않고 아래에 적어 준다 (src/lib/game-bridge.ts 규약).
 */
export function GamePreview({ gameUrl, slug, theme }: { gameUrl: string; slug: string; theme: Theme }) {
  const [device, setDevice] = useState<Device>("mobile");
  const [shown, setShown] = useState<string | null>(null);
  const [run, setRun] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const origin = shown ? originOf(shown) : null;

  useEffect(() => {
    if (!shown || !origin) return;
    let greeted = false;
    function onMessage(event: MessageEvent) {
      const frame = frameRef.current?.contentWindow;
      if (!frame || event.source !== frame || event.origin !== origin || !isGameMessage(event.data)) return;
      if (event.data.type === "ready") {
        const init: HostMessage = { source: "psytest-host", type: "init", slug, theme };
        frame.postMessage(init, origin);
        if (!greeted) setLog((l) => [...l, "ready 받음 → init 보냄"]);
        greeted = true;
      } else {
        const { resultId, result } = event.data;
        const path = decodeURIComponent(sharedResultPath(slug, "{playId}", resultId, result).replace(/\+/g, " "));
        setLog((l) => [...l, `결과: ${resultId} (사이트라면 ${path}로 이동)`]);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [shown, origin, slug, theme, run]);

  const canShow = originOf(gameUrl) !== null;
  const open = () => {
    setShown(gameUrl);
    setRun((n) => n + 1);
    setLog([]);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={open} disabled={!canShow} className={buttonClass.secondary}>
          {shown ? "다시 불러오기" : "게임 미리보기"}
        </button>
        <div role="radiogroup" aria-label="화면 크기" className="flex rounded-lg bg-brand-50 p-1">
          {(["mobile", "pc"] as const).map((d) => (
            <button key={d} type="button" role="radio" aria-checked={device === d} onClick={() => setDevice(d)}
              className={cx("rounded-md px-3 py-1 text-label", device === d ? "bg-surface font-bold text-ink" : "text-ink-3")}>
              {d === "mobile" ? "모바일" : "PC 16:9"}
            </button>
          ))}
        </div>
        {shown && <a href={shown} target="_blank" rel="noreferrer" className="text-label text-ink-3 hover:text-ink">새 탭 ↗</a>}
      </div>
      {shown && origin && (
        <>
          <div className={cx("overflow-hidden rounded-xl", theme === "horror" ? "bg-horror" : "bg-brand-100",
            device === "mobile" ? "mx-auto h-[640px] w-[360px] max-w-full" : "aspect-video w-full")}>
            <iframe key={run} ref={frameRef} src={shown} title="게임 미리보기"
              allow="autoplay; fullscreen; clipboard-write; web-share" className="size-full border-0" />
          </div>
          {log.length > 0 && (
            <ul className="flex flex-col gap-1 rounded-lg bg-bg px-3 py-2 text-caption text-ink-2">
              {log.map((line, i) => <li key={i}>{line}</li>)}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
