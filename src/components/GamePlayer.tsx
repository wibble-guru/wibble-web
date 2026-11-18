"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import type { Theme, Warning } from "@/lib/api/schemas";
import { cx } from "@/lib/format";
import { isGameMessage, type HostMessage } from "@/lib/game-bridge";
import { resultPath } from "@/lib/site";
import { MaximizeIcon, MinimizeIcon, RestartIcon } from "./icons";

type Props = {
  slug: string;
  title: string;
  gameUrl: string;
  theme: Theme;
  warnings: Warning[];
};

/**
 * 따로 호스팅된 게임을 iframe으로 띄우는 플레이어.
 * - 모바일: 화면 높이를 채움 / 데스크톱: 16:9 + 처음부터·전체화면 버튼
 * - 공포 테스트는 시작 전 경고를 보여주고, 동의하면 이 탭(세션)에서는 다시 묻지 않음
 * - 게임이 보낸 결과(resultId)를 받아 결과 페이지로 이동
 */
export function GamePlayer({ slug, title, gameUrl, theme, warnings }: Props) {
  const horror = theme === "horror";
  const stageRef = useRef<HTMLDivElement>(null);
  const consent = useHorrorConsent(slug);
  const [runId, setRunId] = useState(0);
  const fullscreen = useFullscreen(stageRef);

  // 공포 테스트: 동의 전에는 게임을 불러오지 않는다. (null = 아직 확인 전 / 서버 렌더)
  const canPlay = !horror || consent === true;
  const askConsent = horror && consent === false;

  const restart = () => setRunId((n) => n + 1);

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={stageRef}
        className={cx(
          "relative h-[calc(100dvh-76px)] min-h-[480px] overflow-hidden rounded-xl md:aspect-video md:h-auto md:min-h-0 md:rounded-2xl",
          "[&:fullscreen]:h-screen [&:fullscreen]:w-screen [&:fullscreen]:rounded-none",
          horror ? "bg-horror" : "bg-brand-100",
        )}
      >
        {/* 게임이 그려지기 전까지 보이는 안내. iframe이 위를 덮으므로 따로 숨길 필요가 없다. */}
        {canPlay && (
          <div aria-hidden className={cx("absolute inset-0 grid place-items-center text-label", horror ? "text-mist-3" : "text-ink-3")}>
            게임을 불러오는 중…
          </div>
        )}
        {canPlay && <GameFrame key={runId} slug={slug} title={title} gameUrl={gameUrl} theme={theme} />}
        {askConsent && <HorrorGate warnings={warnings} onAccept={() => grantHorrorConsent(slug)} />}
        {fullscreen.active && (
          <button type="button" onClick={fullscreen.exit}
            className="absolute right-6 top-6 inline-flex h-10 items-center gap-1.5 rounded-lg bg-ink/80 pl-4 pr-[18px] text-label-l font-bold text-white backdrop-blur hover:bg-ink">
            <MinimizeIcon size={18} /> 전체화면 나가기
          </button>
        )}
      </div>

      <div className="hidden items-center justify-between md:flex">
        <p className="text-label-s text-ink-3">
          {fullscreen.supported && "전체화면에서는 ESC를 눌러 나올 수 있어요"}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={restart} disabled={!canPlay}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand-50 pl-4 pr-[18px] text-label-l font-bold text-brand-600 hover:bg-brand-100 disabled:opacity-40">
            <RestartIcon size={18} /> 처음부터
          </button>
          {fullscreen.supported && (
            <button type="button" onClick={fullscreen.enter} disabled={!canPlay}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary pl-4 pr-[18px] text-label-l font-bold text-white hover:bg-brand-600 disabled:opacity-40">
              <MaximizeIcon size={18} /> 전체화면
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- iframe + postMessage 연동 ---------- */

function GameFrame({ slug, title, gameUrl, theme }: Omit<Props, "warnings">) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const router = useRouter();

  useEffect(() => {
    const gameOrigin = new URL(gameUrl, window.location.href).origin;
    function onMessage(event: MessageEvent) {
      const frame = iframeRef.current?.contentWindow;
      if (!frame || event.source !== frame || event.origin !== gameOrigin) return;
      if (!isGameMessage(event.data)) return;
      if (event.data.type === "ready") {
        const init: HostMessage = { source: "psytest-host", type: "init", slug, theme };
        frame.postMessage(init, gameOrigin);
      } else {
        router.push(resultPath(slug, event.data.resultId));
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [gameUrl, router, slug, theme]);

  return (
    <iframe
      ref={iframeRef}
      src={gameUrl}
      title={`${title} 게임`}
      allow="autoplay; fullscreen; clipboard-write; web-share"
      className="absolute inset-0 size-full border-0"
    />
  );
}

/* ---------- 공포 경고 ---------- */

function HorrorGate({ warnings, onAccept }: { warnings: Warning[]; onAccept: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="horror-gate-title"
      className="fixed inset-0 z-50 flex items-end bg-night-950/55 md:absolute md:items-center md:justify-center">
      <div className="flex w-full flex-col gap-4 rounded-t-xl bg-surface px-5 pb-[calc(28px+env(safe-area-inset-bottom))] pt-3 text-ink md:max-w-[440px] md:rounded-xl md:p-8">
        <span aria-hidden className="h-1 w-10 self-center rounded-full bg-line md:hidden" />
        <span aria-hidden className="grid size-14 place-items-center rounded-xl bg-warn-bg text-[28px]">🕯️</span>
        <div className="flex flex-col gap-2">
          <h2 id="horror-gate-title" className="text-title-3">조금 무서운 테스트예요</h2>
          <p className="text-body-s text-ink-2">
            어두운 분위기와 갑자기 놀라는 장면이 있어요. 무서운 걸 잘 못 본다면 다른 테스트를 추천해요.
          </p>
        </div>
        {warnings.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {warnings.map((w) => (
              <li key={w.label} className="inline-flex h-7 items-center gap-1 rounded-sm bg-warn-bg px-2.5 text-caption font-bold text-warn-fg">
                {w.emoji && <span aria-hidden>{w.emoji}</span>}{w.label}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-1 flex flex-col gap-2">
          <button type="button" onClick={onAccept} autoFocus
            className="h-[52px] rounded-lg bg-ink text-subtitle text-white hover:bg-ink-2">
            그래도 할래요
          </button>
          <Link href="/tests" className="grid h-[52px] place-items-center rounded-lg bg-brand-50 text-subtitle text-brand-600">
            다른 테스트 볼래요
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ---------- 공포 동의 저장 (탭 세션 동안 유지) ---------- */

const CONSENT_EVENT = "wibble:horror-consent";
const consentKey = (slug: string) => `wibble:horror-ok:${slug}`;
const memoryConsent = new Set<string>(); // sessionStorage를 못 쓰는 환경 대비

function readConsent(slug: string) {
  if (memoryConsent.has(slug)) return true;
  try {
    return window.sessionStorage.getItem(consentKey(slug)) === "1";
  } catch {
    return false;
  }
}

function grantHorrorConsent(slug: string) {
  memoryConsent.add(slug);
  try {
    window.sessionStorage.setItem(consentKey(slug), "1");
  } catch {
    /* 저장이 막혀 있어도 이번 화면에서는 memoryConsent로 동작 */
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

function subscribeConsent(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CONSENT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function useHorrorConsent(slug: string): boolean | null {
  return useSyncExternalStore(subscribeConsent, () => readConsent(slug), () => null);
}

/* ---------- 전체화면 ---------- */

function subscribeFullscreen(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
}
const noop = () => () => {};

function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const supported = useSyncExternalStore(noop, () => document.fullscreenEnabled === true, () => false);
  const active = useSyncExternalStore(
    subscribeFullscreen,
    () => document.fullscreenElement !== null && document.fullscreenElement === ref.current,
    () => false,
  );
  const enter = useCallback(() => {
    ref.current?.requestFullscreen().catch(() => {});
  }, [ref]);
  const exit = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);
  return { supported, active, enter, exit };
}
