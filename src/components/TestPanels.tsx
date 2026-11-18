import { getRecommendations } from "@/lib/api/queries";
import type { TestDetail } from "@/lib/api/schemas";
import { formatCount } from "@/lib/format";
import { absoluteUrl, testPath } from "@/lib/site";
import { PlayIcon } from "./icons";
import { ShareButtons } from "./ShareButtons";
import { SlideRail } from "./SlideRail";
import { HorrorBadge, RAIL_THUMB_CENTER, RankRow, TestCard, TestThumb, WarningChips, isHorror } from "./TestBits";

export function shareImageFor(test: TestDetail, override?: string | null) {
  return absoluteUrl(override ?? test.shareImageUrl ?? test.thumbnailUrl ?? "/opengraph-image");
}

/** 테스트 소개 + 공유 */
export function TestInfo({ test }: { test: TestDetail }) {
  const horror = isHorror(test);
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-surface p-6 md:p-8">
      <TestThumb test={test} emojiSize={44} sizes="88px" className="size-[72px] rounded-xl md:size-[88px]" />
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-title-2 md:text-title-1">{test.title}</h2>
        {horror && <HorrorBadge />}
      </div>
      {test.description && <p className="whitespace-pre-line text-body text-ink-2">{test.description}</p>}
      <p className="flex items-center gap-1 text-label text-ink-3">
        <PlayIcon />
        {formatCount(test.playCount)}명 참여{test.durationMinutes ? ` · 약 ${test.durationMinutes}분` : ""}
      </p>
      {horror && <WarningChips warnings={test.warnings} />}
      <hr className="my-1 border-line" />
      <p className="text-label font-bold text-ink-2">친구에게 공유하기</p>
      <ShareButtons
        align="start"
        url={absoluteUrl(testPath(test.slug))}
        title={test.title}
        description={test.description || "나도 해볼까?"}
        imageUrl={shareImageFor(test)}
      />
    </section>
  );
}

/** "이런 테스트는 어때요?" — 행 목록(테스트 화면) 또는 카드 그리드(결과 화면) */
export async function Recommendations({ slug, layout = "rows" }: { slug: string; layout?: "rows" | "cards" }) {
  const tests = await getRecommendations(slug, 4);
  if (!tests.length) return null;
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-surface p-6">
      <h2 className="text-title-3">이런 테스트는 어때요?</h2>
      {layout === "rows" ? (
        <ul className="flex flex-col gap-1.5">
          {tests.slice(0, 3).map((t) => <li key={t.slug}><RankRow test={t} tone="bg" /></li>)}
        </ul>
      ) : (
        <SlideRail label="추천 테스트" arrowTop={RAIL_THUMB_CENTER}
          listClassName="scrollbar-none -mx-6 flex snap-x scroll-px-6 gap-3 overflow-x-auto px-6 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0">
          {tests.map((t) => (
            <li key={t.slug} className="w-[136px] shrink-0 snap-start md:w-auto">
              <TestCard test={t} emojiSize={48} sizes="(min-width: 768px) 140px, 136px" />
            </li>
          ))}
        </SlideRail>
      )}
    </section>
  );
}
