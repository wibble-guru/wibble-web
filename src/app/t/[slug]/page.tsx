import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MobileTitleBar } from "@/components/Chrome";
import { GamePlayer } from "@/components/GamePlayer";
import { ChevronLeftIcon } from "@/components/icons";
import { RowListSkeleton } from "@/components/Skeletons";
import { Recommendations, TestInfo, shareImageFor } from "@/components/TestPanels";
import { getTest } from "@/lib/api/queries";
import { testPath } from "@/lib/site";

type Props = PageProps<"/t/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const test = await getTest((await params).slug);
  if (!test) return { title: "테스트를 찾을 수 없어요" };
  const path = testPath(test.slug);
  return {
    title: test.title,
    description: test.description,
    alternates: { canonical: path },
    openGraph: {
      title: test.title,
      description: test.description,
      url: path,
      images: [{ url: shareImageFor(test), width: 1200, height: 630 }],
    },
  };
}

/*
 * 처음 보는 slug도 바로 열리도록, params는 Suspense 안에서만 읽는다.
 * (빌드 때 App Shell을 만들고, 첫 방문 시 서버 데이터로 채운 뒤 캐시 — ISR)
 */
export default function TestPage({ params }: Props) {
  return (
    <Suspense fallback={<TestSkeleton />}>
      <TestView params={params} />
    </Suspense>
  );
}

async function TestView({ params }: Pick<Props, "params">) {
  const test = await getTest((await params).slug);
  if (!test) notFound();
  return (
    <>
      <MobileTitleBar
        title={test.title}
        left={<Link href="/" aria-label="홈으로" className="icon-btn"><ChevronLeftIcon /></Link>}
      />
      <main className="container-page flex flex-col gap-6 max-md:px-3 md:mt-10">
        <h1 className="sr-only">{test.title}</h1>
        <GamePlayer slug={test.slug} title={test.title} gameUrl={test.gameUrl} theme={test.theme} warnings={test.warnings} />
        <div className="grid items-start gap-4 md:grid-cols-2 md:gap-5">
          <TestInfo test={test} />
          <Suspense fallback={<RowListSkeleton count={3} />}>
            <Recommendations slug={test.slug} />
          </Suspense>
        </div>
      </main>
    </>
  );
}

function TestSkeleton() {
  return (
    <main className="container-page flex flex-col gap-6 pt-[60px] max-md:px-3 md:mt-10 md:pt-0">
      <div className="h-[calc(100dvh-76px)] min-h-[480px] animate-pulse rounded-xl bg-brand-50 md:aspect-video md:h-auto md:min-h-0 md:rounded-2xl" />
    </main>
  );
}
