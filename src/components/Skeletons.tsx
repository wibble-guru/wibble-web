import type { CSSProperties } from "react";
import { cx } from "@/lib/format";

const Block = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <div aria-hidden className={cx("animate-pulse rounded-lg bg-brand-50", className)} style={style} />
);

export function HeroSkeleton() {
  return <Block className="h-[196px] rounded-xl md:h-[340px] md:rounded-2xl" />;
}

/** 이번 주 인기 TOP: 모바일 가로 슬라이드 → PC 5열 */
export function PosterRailSkeleton() {
  return (
    <div className="flex gap-2 overflow-hidden md:grid md:grid-cols-5 md:gap-3">
      {Array.from({ length: 5 }, (_, i) => <Block key={i} className="h-[280px] w-40 shrink-0 rounded-xl md:h-[330px] md:w-auto" />)}
    </div>
  );
}

/** 포스터 그리드: 모바일 2열 → PC 4열 */
export function PosterGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {Array.from({ length: count }, (_, i) => (
        <Block key={i} className={cx("h-[300px] rounded-xl md:h-[330px]", i >= 6 && "hidden md:block")} />
      ))}
    </div>
  );
}

export function ChipsSkeleton() {
  return (
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: 5 }, (_, i) => <Block key={i} className="h-10 w-16 shrink-0 rounded-full" />)}
    </div>
  );
}

export function RowListSkeleton({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={cx("flex flex-col gap-2.5", className)}>
      {Array.from({ length: count }, (_, i) => <Block key={i} className="h-[84px] bg-surface" />)}
    </div>
  );
}
