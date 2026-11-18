import Image from "next/image";
import type { Match, TestDetail, TestResult } from "@/lib/api/schemas";
import { cx } from "@/lib/format";
import { isHorror } from "./TestBits";

/** 결과 카드. 공포 테스트는 어두운 촛불 톤, 그 외는 밝은 하늘 톤. */
export function ResultCard({ test, result }: { test: TestDetail; result: TestResult }) {
  const horror = isHorror(test);
  const intro = result.intro ?? `${test.title} 결과`;
  return (
    <article
      className={cx(
        "flex flex-col items-center gap-4 overflow-hidden rounded-xl px-6 pb-7 pt-8 text-center md:px-10 md:pb-10 md:pt-12",
        horror
          ? "bg-night-900 bg-[radial-gradient(circle_at_50%_0%,rgb(255_196_107/0.2),transparent_55%)] text-mist"
          : "bg-surface bg-[linear-gradient(180deg,#d6eaff_0%,#ffffff_45%)]",
      )}
    >
      <p className={cx("text-label font-bold", horror ? "text-mist-2" : "text-ink-2")}>{intro}</p>

      <div className={cx("relative grid size-32 place-items-center overflow-hidden rounded-full md:size-40",
        horror ? "bg-night-800 shadow-[0_0_0_1px_var(--color-night-700),0_14px_28px_rgb(0_0_0/0.35)]" : "bg-surface shadow-[0_10px_30px_rgb(61_155_239/0.22)]")}>
        {result.imageUrl ? (
          <Image src={result.imageUrl} alt="" fill sizes="160px" className="object-cover" />
        ) : (
          <span aria-hidden className="text-[64px] leading-none md:text-[80px]">{result.emoji ?? test.emoji ?? "✨"}</span>
        )}
      </div>

      <h1 className="text-title-1 md:text-display">{result.title}</h1>
      {result.summary && (
        <p className={cx("max-w-md whitespace-pre-line text-body-s md:text-body-l", horror ? "text-mist-2" : "text-ink-2")}>
          {result.summary}
        </p>
      )}

      {result.hashtags.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-1.5">
          {result.hashtags.map((tag) => (
            <li key={tag} className={cx("inline-flex h-[30px] items-center rounded-sm px-3 text-label-s font-bold",
              horror ? "bg-night-800 text-[#ffb3b6]" : "bg-brand-50 text-brand-600")}>
              #{tag.replace(/^#/, "")}
            </li>
          ))}
        </ul>
      )}

      {(result.goodMatch || result.badMatch) && (
        <div className="mt-1 grid w-full grid-cols-2 gap-2.5">
          {result.goodMatch && <MatchBox label={horror ? "함께하면 든든한 유형" : "잘 맞는 유형"} match={result.goodMatch} horror={horror} />}
          {result.badMatch && <MatchBox label={horror ? "같이 있으면 위험한 유형" : "안 맞는 유형"} match={result.badMatch} horror={horror} />}
        </div>
      )}
    </article>
  );
}

function MatchBox({ label, match, horror }: { label: string; match: Match; horror: boolean }) {
  return (
    <div className={cx("flex flex-col items-center gap-1.5 rounded-lg p-3.5", horror ? "bg-night-800" : "bg-bg")}>
      <span className={cx("text-caption/[1.35] font-bold", horror ? "text-mist-3" : "text-ink-3")}>{label}</span>
      <span className="text-subtitle">
        {match.emoji && <span aria-hidden>{match.emoji} </span>}
        {match.label}
      </span>
    </div>
  );
}
