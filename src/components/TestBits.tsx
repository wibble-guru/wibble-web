import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { TestSummary, ThumbnailColor, Warning } from "@/lib/api/schemas";
import { cx, formatCount } from "@/lib/format";
import { testPath } from "@/lib/site";
import { ChevronRightIcon, PlayIcon } from "./icons";

export const THUMB_BG: Record<ThumbnailColor, string> = {
  sky: "bg-thumb-sky",
  pink: "bg-thumb-pink",
  lemon: "bg-thumb-lemon",
  mint: "bg-thumb-mint",
  lilac: "bg-thumb-lilac",
  peach: "bg-thumb-peach",
};

export const isHorror = (t: Pick<TestSummary, "theme">) => t.theme === "horror";

/* ---------- 배지 ---------- */

export function NewBadge() {
  return <span className="inline-flex items-center rounded-sm bg-primary px-[7px] py-[3px] text-caption/[1.35] font-bold text-white">NEW</span>;
}

export function HorrorBadge({ compact }: { compact?: boolean }) {
  return (
    <span className={cx("inline-flex shrink-0 items-center gap-1 rounded-sm bg-night-800 font-bold text-white", compact ? "h-5 px-1.5 text-micro font-bold" : "px-[7px] py-[3px] text-caption/[1.35] font-bold")}>
      {!compact && <span aria-hidden>👻</span>}공포
    </span>
  );
}

export function WarningChips({ warnings }: { warnings: Warning[] }) {
  if (!warnings.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="주의할 점">
      {warnings.map((w) => (
        <li key={w.label} className="inline-flex h-7 items-center gap-1 rounded-sm bg-warn-bg px-2.5 text-caption font-bold text-warn-fg">
          {w.emoji && <span aria-hidden>{w.emoji}</span>}
          {w.label}
        </li>
      ))}
    </ul>
  );
}

export function PlayCount({ count, className }: { count: number; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 text-caption text-ink-3", className)}>
      <PlayIcon />
      <span className="sr-only">참여</span>
      {formatCount(count)}
    </span>
  );
}

/* ---------- 썸네일 ---------- */

type ThumbProps = {
  test: TestSummary;
  /** 이모지 크기(px). 썸네일 크기에 맞춰 넘긴다. */
  emojiSize: number;
  className?: string;
  sizes?: string;
  badges?: boolean;
};

/** 서버 이미지가 있으면 이미지, 없으면 테마 색 + 이모지 */
export function TestThumb({ test, emojiSize, className, sizes = "200px", badges }: ThumbProps) {
  const horror = isHorror(test);
  const bg = horror ? "bg-night-900" : THUMB_BG[test.thumbnailColor ?? "sky"];
  return (
    <div className={cx("relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg", bg, className)}>
      {test.thumbnailUrl ? (
        <Image src={test.thumbnailUrl} alt="" fill sizes={sizes} className="object-cover" />
      ) : (
        <>
          {horror && <span aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgb(255_196_107/0.35),transparent_45%)]" />}
          <span aria-hidden className="relative leading-none" style={{ fontSize: emojiSize }}>{test.emoji ?? (horror ? "🕯️" : "✨")}</span>
          <span aria-hidden className={cx("gloss", horror && "bg-white/12")} />
        </>
      )}
      {badges && (test.isNew || horror) && (
        <span className="absolute left-2.5 top-2.5 flex gap-1">
          {test.isNew && <NewBadge />}
          {horror && <HorrorBadge />}
        </span>
      )}
    </div>
  );
}

/* ---------- 카드 · 행 ---------- */

/** 모바일 슬라이드 카드(136px, 썸네일 4:5)의 썸네일 세로 중심 — 슬라이드 버튼 위치 */
export const RAIL_THUMB_CENTER = (136 * 5) / 4 / 2;

/** 세로형 카드 (썸네일 4:5 + 제목 + 참여 수) */
export function TestCard({ test, emojiSize = 56, sizes }: { test: TestSummary; emojiSize?: number; sizes?: string }) {
  return (
    <Link href={testPath(test.slug)} className="group flex flex-col gap-2 rounded-lg outline-offset-4">
      <TestThumb test={test} emojiSize={emojiSize} badges sizes={sizes} className="aspect-[4/5] w-full transition-transform group-active:scale-[0.98]" />
      <p className="line-clamp-2 text-subtitle-s">{test.title}</p>
      <PlayCount count={test.playCount} />
    </Link>
  );
}

/** 가로형 행 (랭킹·추천) */
export function RankRow({ test, rank, tone = "surface" }: { test: TestSummary; rank?: number; tone?: "surface" | "bg" }) {
  return (
    <Link href={testPath(test.slug)}
      className={cx("flex items-center gap-3.5 rounded-lg p-3 transition-colors", tone === "bg" ? "bg-bg hover:bg-brand-50" : "bg-surface hover:bg-brand-50")}>
      {rank !== undefined && <span className="w-[22px] text-center text-title-3 text-primary">{rank}</span>}
      <TestThumb test={test} emojiSize={28} sizes="60px" className="size-14 rounded-md md:size-[60px]" />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-subtitle-s">{test.title}</span>
          {isHorror(test) && <HorrorBadge compact />}
        </span>
        <PlayCount count={test.playCount} />
      </span>
      <ChevronRightIcon size={18} className="text-ink-3" />
    </Link>
  );
}

/* ---------- 섹션 제목 ---------- */

export function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-title-3 md:text-title-2">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center gap-0.5 text-label-s text-ink-3 hover:text-ink md:text-label">
          전체보기 <ChevronRightIcon size={14} />
        </Link>
      )}
    </div>
  );
}

/* ---------- 빈 화면 ---------- */

export function EmptyState({ emoji = "🫥", title, description, children }: {
  emoji?: string; title: string; description?: string; children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-surface px-6 py-14 text-center">
      <span className="text-5xl" aria-hidden>{emoji}</span>
      <p className="text-subtitle">{title}</p>
      {description && <p className="text-body-s text-ink-3">{description}</p>}
      {children && <div className="pt-1">{children}</div>}
    </div>
  );
}
