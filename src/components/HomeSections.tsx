import Link from "next/link";
import { getCategories, getTests, type TestSort } from "@/lib/api/queries";
import type { TestSummary } from "@/lib/api/schemas";
import { cx } from "@/lib/format";
import { HeroSlide, TestPoster } from "./Poster";
import { SlideRail } from "./SlideRail";

/* ---------- 오늘의 테스트: 배너 슬라이드 (featured) ---------- */

export async function Hero() {
  const featured = await getTests({ featured: true, limit: 5 });
  if (!featured.length) return null;
  return (
    <SlideRail label="오늘의 테스트" arrows="hover" counter
      className="overflow-hidden rounded-xl md:rounded-2xl"
      listClassName="scrollbar-none flex snap-x snap-mandatory overflow-x-auto">
      {featured.map((t, i) => (
        <li key={t.slug} className="h-[196px] w-full shrink-0 snap-start md:h-[340px]">
          <HeroSlide test={t} priority={i === 0} />
        </li>
      ))}
    </SlideRail>
  );
}

/* ---------- 이번 주 인기 TOP: 모바일 가로 스크롤 → PC 5열 ---------- */

export async function WeeklyTop() {
  const tests = await getTests({ sort: "popular", limit: 10 });
  if (!tests.length) return null;
  return (
    <SlideRail label="이번 주 인기 테스트" arrowTop={140}
      listClassName="scrollbar-none -mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-5 md:gap-3 md:overflow-visible md:px-0">
      {tests.map((t, i) => (
        <li key={t.slug} className={cx("w-40 shrink-0 snap-start md:w-auto", i >= 5 && "md:hidden")}>
          <TestPoster test={t} className="h-[280px] md:h-[330px]" sizes="(min-width: 768px) 240px, 160px" />
        </li>
      ))}
    </SlideRail>
  );
}

/* ---------- 역대 인기 TOP: 모바일 2열 6개 → PC 4열 8개 ---------- */

export async function AllTimeTop() {
  const tests = await getTests({ sort: "all-time", limit: 8 });
  if (!tests.length) return null;
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {tests.map((t, i) => (
        <li key={t.slug} className={cx(i >= 6 && "hidden md:block")}>
          <TestPoster test={t} className="h-[300px] md:h-[330px]" sizes="(min-width: 768px) 288px, 50vw" />
        </li>
      ))}
    </ul>
  );
}

/* ---------- 카테고리 칩: 왼쪽 정렬, 모바일은 가로 스크롤 ---------- */

export async function CategoryChips({ active, sort }: { active?: string; sort: TestSort }) {
  const categories = await getCategories();
  const href = (category?: string) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (sort !== "new") params.set("sort", sort);
    const qs = params.toString();
    return qs ? `/tests?${qs}` : "/tests";
  };
  return (
    <nav aria-label="카테고리" className="scrollbar-none -mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
      <CategoryChip href={href()} label="전체" active={!active} />
      {categories.map((c) => (
        <CategoryChip key={c.slug} href={href(c.slug)} label={c.name} active={active === c.slug} />
      ))}
    </nav>
  );
}

function CategoryChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined}
      className={cx(
        "shrink-0 snap-start rounded-full px-[18px] py-[9px] text-label-l transition-colors",
        active ? "bg-brand-300 font-bold text-ink" : "bg-chip text-ink-2 hover:bg-brand-100 hover:text-ink",
      )}>
      {label}
    </Link>
  );
}

/* ---------- 목록 그리드 (전체 테스트·검색): 모바일 2열 → PC 4열 ---------- */

export function TestGrid({ tests }: { tests: TestSummary[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {tests.map((t) => (
        <li key={t.slug}>
          <TestPoster test={t} className="h-[300px] md:h-[330px]" sizes="(min-width: 768px) 288px, 50vw" />
        </li>
      ))}
    </ul>
  );
}
