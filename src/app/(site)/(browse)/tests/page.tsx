import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CategoryChips, TestGrid } from "@/components/HomeSections";
import { ChipsSkeleton, PosterGridSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/TestBits";
import { getCategories, getTests, type TestSort } from "@/lib/api/queries";
import { cx } from "@/lib/format";

export const metadata: Metadata = { title: "전체 테스트" };

type Props = PageProps<"/tests">;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const toSort = (v: string | undefined): TestSort => (v === "popular" ? "popular" : "new");

export default function TestsPage({ searchParams }: Props) {
  return (
    <div className="flex flex-col pt-1 md:pt-8">
      <Suspense fallback={<TestsSkeleton />}>
        <TestsBody searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function TestsBody({ searchParams }: Pick<Props, "searchParams">) {
  const sp = await searchParams;
  const sort = toSort(first(sp.sort));
  const category = first(sp.category);
  const [tests, categories] = await Promise.all([getTests({ sort, category, limit: 60 }), getCategories()]);
  const known = !category || categories.some((c) => c.slug === category);
  const shown = known ? tests : [];
  return (
    <>
      <CategoryChips active={category} sort={sort} />
      <PageHead sort={sort} category={category} count={shown.length} />
      {shown.length === 0 ? (
        <EmptyState
          title={known ? "이 카테고리엔 아직 테스트가 없어요" : "없는 카테고리예요"}
          description="곧 새 테스트가 올라와요. 다른 테스트부터 해볼까요?">
          <Link href="/tests" className="inline-flex rounded-lg bg-primary px-5 py-3 text-subtitle-s text-white">전체 테스트 보기</Link>
        </EmptyState>
      ) : (
        <TestGrid tests={shown} />
      )}
    </>
  );
}

function PageHead({ sort, category, count }: { sort: TestSort; category?: string; count: number }) {
  const href = (s: TestSort) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    params.set("sort", s);
    return `/tests?${params}`;
  };
  const tab = (s: TestSort, label: string) => (
    <Link href={href(s)} aria-current={sort === s ? "page" : undefined}
      className={cx("rounded-md px-3 py-1.5 text-body-s", sort === s ? "bg-surface text-ink shadow-[0_1px_2px_rgb(28_43_69/0.08)]" : "text-ink-3 hover:text-ink")}>
      {label}
    </Link>
  );
  return (
    <div className="flex items-center justify-between pb-4 pt-6 md:pb-6 md:pt-8">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-title-2 md:text-title-1">{sort === "popular" ? "인기 테스트" : "전체 테스트"}</h1>
        <p className="text-body-s text-ink-3">테스트 {count}개</p>
      </div>
      <nav aria-label="정렬" className="flex rounded-lg bg-brand-50 p-1">
        {tab("new", "최신순")}
        {tab("popular", "인기순")}
      </nav>
    </div>
  );
}

function TestsSkeleton() {
  return (
    <>
      <ChipsSkeleton />
      <div aria-hidden className="h-[106px] md:h-[136px]" />
      <PosterGridSkeleton />
    </>
  );
}
