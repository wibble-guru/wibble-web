import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MobileTitleBar } from "@/components/Chrome";
import { HomeIcon } from "@/components/icons";
import { ResultCard } from "@/components/ResultCard";
import { ShareButtons } from "@/components/ShareButtons";
import { RowListSkeleton } from "@/components/Skeletons";
import { Recommendations, shareImageFor } from "@/components/TestPanels";
import { getResult, getTest } from "@/lib/api/queries";
import { absoluteUrl, resultPath, testPath } from "@/lib/site";

type Props = PageProps<"/t/[slug]/result/[resultId]">;

async function load(params: Props["params"]) {
  const { slug, resultId } = await params;
  const id = decodeURIComponent(resultId);
  const [test, result] = await Promise.all([getTest(slug), getResult(slug, id)]);
  return test && result ? { test, result } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load(params);
  if (!data) return { title: "결과를 찾을 수 없어요" };
  const { test, result } = data;
  const path = resultPath(test.slug, result.id);
  return {
    title: `${result.title} - ${test.title}`,
    description: result.summary || test.description,
    alternates: { canonical: path },
    openGraph: {
      title: `나는 ${result.title}!`,
      description: `${test.title} · ${result.summary}`,
      url: path,
      images: [{ url: shareImageFor(test, result.imageUrl), width: 1200, height: 630 }],
    },
  };
}

export default function ResultPage({ params }: Props) {
  return (
    <Suspense fallback={<ResultSkeleton />}>
      <ResultView params={params} />
    </Suspense>
  );
}

async function ResultView({ params }: Pick<Props, "params">) {
  const data = await load(params);
  if (!data) notFound();
  const { test, result } = data;
  return (
    <>
      <MobileTitleBar title="테스트 결과" left={<Link href="/" aria-label="홈으로" className="icon-btn"><HomeIcon /></Link>} />
      {/* 두 칸(결과 | 공유·추천)은 오른쪽 칸이 충분히 넓어지는 xl부터. 그 아래는 위아래로 쌓는다 */}
      <main className="container-page flex flex-col gap-4 md:mt-10 md:gap-5 xl:grid xl:grid-cols-[minmax(0,560px)_minmax(0,1fr)] xl:items-start xl:gap-10">
        <ResultCard test={test} result={result} />
        <div className="flex flex-col gap-4 md:gap-5">
          <section className="flex flex-col items-center gap-4 rounded-xl bg-surface p-6 md:items-start md:p-8">
            <h2 className="text-label font-bold text-ink-2 md:text-title-2 md:text-ink">
              <span className="md:hidden">친구에게 공유하기</span>
              <span className="hidden md:inline">결과를 친구에게 공유해 보세요</span>
            </h2>
            <ShareButtons
              url={absoluteUrl(resultPath(test.slug, result.id))}
              title={`나는 ${result.title}!`}
              description={`${test.title} · 나랑 닮은 결과는?`}
              imageUrl={shareImageFor(test, result.imageUrl)}
            />
          </section>
          <div className="flex gap-3">
            <Link href={testPath(test.slug)} className="grid h-[52px] min-w-0 flex-1 place-items-center whitespace-nowrap rounded-lg bg-primary px-4 text-subtitle text-white hover:bg-brand-600 md:h-[60px] md:text-title-3">
              나도 테스트하기 · 다시하기
            </Link>
            <Link href="/tests" className="hidden h-[60px] shrink-0 place-items-center whitespace-nowrap rounded-lg bg-brand-50 px-6 text-title-3 text-brand-600 md:grid">
              다른 테스트
            </Link>
          </div>
          <Suspense fallback={<RowListSkeleton count={2} />}>
            <Recommendations slug={test.slug} layout="cards" />
          </Suspense>
        </div>
      </main>
    </>
  );
}

function ResultSkeleton() {
  return (
    <main className="container-page flex flex-col gap-4 pt-[64px] md:mt-10 md:pt-0 xl:grid xl:grid-cols-[560px_1fr] xl:gap-10">
      <div className="h-[520px] animate-pulse rounded-xl bg-brand-50" />
    </main>
  );
}
