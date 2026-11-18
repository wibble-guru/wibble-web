"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cx } from "@/lib/format";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

/**
 * 가로 슬라이드 + 좌우 이동 버튼 (Figma: 99 컴포넌트 / Slide arrow).
 * - arrows="mobile": 버튼은 md 미만에서만 보인다 (PC는 그리드로 바뀌는 목록).
 * - arrows="hover": 모바일은 스와이프만, PC는 마우스를 올렸을 때 버튼이 보인다 (배너).
 * - 처음/끝에 닿으면 그 방향 버튼을 숨기고, 한 번 누르면 아이템 하나(첫 아이템 너비 + gap)만큼 이동한다.
 * - counter: 오른쪽 위에 "현재 / 전체" 표시 (배너).
 * - children은 <li>들이고, 목록 레이아웃은 listClassName으로 정한다.
 */
export function SlideRail({ children, listClassName, label, arrowTop, arrows = "mobile", counter, className }: {
  children: ReactNode;
  listClassName: string;
  label: string;
  /** 버튼 세로 중심 위치(px). 없으면 가운데 */
  arrowTop?: number;
  arrows?: "mobile" | "hover";
  counter?: boolean;
  className?: string;
}) {
  const listId = useId();
  const ref = useRef<HTMLUListElement>(null);
  const [state, setState] = useState({ start: true, end: false, index: 1, count: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const first = el.firstElementChild as HTMLElement | null;
      const step = (first?.offsetWidth ?? 0) + (parseFloat(getComputedStyle(el).columnGap) || 0);
      const next = {
        start: el.scrollLeft <= 4,
        end: el.scrollLeft >= max - 4,
        index: step ? Math.min(el.children.length, Math.round(el.scrollLeft / step) + 1) : 1,
        count: el.children.length,
      };
      setState((prev) => (prev.start === next.start && prev.end === next.end && prev.index === next.index && prev.count === next.count ? prev : next));
    };
    const ro = new ResizeObserver(update); // 처음 observe할 때도 한 번 호출된다
    ro.observe(el);
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, []);

  const move = (dir: -1 | 1) => {
    const el = ref.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * (first.offsetWidth + gap), behavior: reduce ? "auto" : "smooth" });
  };

  const arrow = (side: "prev" | "next") => (
    <ArrowButton side={side} hidden={side === "prev" ? state.start : state.end} top={arrowTop} mode={arrows}
      controls={listId} onClick={() => move(side === "prev" ? -1 : 1)} />
  );

  return (
    <div className={cx("group/rail relative", className)}>
      <ul id={listId} ref={ref} aria-label={label} className={listClassName}>
        {children}
      </ul>
      {arrow("prev")}
      {arrow("next")}
      {counter && state.count > 1 && (
        <span aria-hidden className="pointer-events-none absolute right-4 top-4 z-10 inline-flex h-6 items-center rounded-sm bg-white/70 px-2.5 text-caption/none font-bold text-ink-2 md:right-8 md:top-7">
          {state.index} / {state.count}
        </span>
      )}
    </div>
  );
}

function ArrowButton({ side, hidden, top, mode, controls, onClick }: {
  side: "prev" | "next"; hidden: boolean; top?: number; mode: "mobile" | "hover"; controls: string; onClick: () => void;
}) {
  const Icon = side === "prev" ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button type="button" onClick={onClick} hidden={hidden} aria-controls={controls}
      aria-label={side === "prev" ? "이전 보기" : "다음 보기"}
      style={{ top: top ?? "50%" }}
      className={cx(
        "absolute z-10 size-9 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-white/72 text-ink",
        "shadow-[0_2px_8px_rgb(29_43_69/0.18)] backdrop-blur-[8px] transition-[opacity,scale] active:scale-95",
        mode === "mobile" ? "grid md:hidden" : "hidden md:grid md:opacity-0 md:group-hover/rail:opacity-100 md:focus-visible:opacity-100",
        side === "prev" ? (mode === "mobile" ? "left-2" : "left-4") : mode === "mobile" ? "right-2" : "right-4",
      )}>
      <Icon size={20} strokeWidth={2} />
    </button>
  );
}
