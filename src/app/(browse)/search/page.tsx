import type { Metadata } from "next";
import { Suspense } from "react";
import { TestGrid } from "@/components/HomeSections";
import { PosterGridSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/TestBits";
import { SearchIcon } from "@/components/icons";
import { searchTests } from "@/lib/api/queries";

export const metadata: Metadata = { title: "검색", robots: { index: false } };

type Props = PageProps<"/search">;
const query = async (sp: Props["searchParams"]) => {
  const q = (await sp).q;
  return (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
};

export default function SearchPage({ searchParams }: Props) {
  return (
    <div className="flex flex-col gap-6 pt-2 md:pt-0">
      <Suspense fallback={<SearchForm />}>
        <SearchFormFromParams searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<PosterGridSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchFormFromParams({ searchParams }: Pick<Props, "searchParams">) {
  return <SearchForm defaultValue={await query(searchParams)} />;
}

function SearchForm({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/search" role="search" className="flex h-12 items-center gap-2 rounded-lg bg-surface px-4 text-ink-3 focus-within:ring-2 focus-within:ring-primary">
      <SearchIcon />
      <input name="q" type="search" defaultValue={defaultValue} placeholder="어떤 테스트를 찾나요?" aria-label="테스트 검색"
        autoFocus={!defaultValue} className="w-full bg-transparent text-body text-ink outline-none placeholder:text-ink-3" />
    </form>
  );
}

async function Results({ searchParams }: Pick<Props, "searchParams">) {
  const q = await query(searchParams);
  if (!q) return <EmptyState emoji="🔍" title="테스트 이름이나 키워드를 입력해 보세요" />;
  const tests = await searchTests(q);
  if (!tests.length) return <EmptyState emoji="🫥" title={`'${q}'에 맞는 테스트가 없어요`} />;
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-subtitle">‘{q}’ 검색 결과 {tests.length}개</h1>
      <TestGrid tests={tests} />
    </section>
  );
}
