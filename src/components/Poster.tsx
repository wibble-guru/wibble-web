import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { TestSummary, ThumbnailColor } from "@/lib/api/schemas";
import { cx } from "@/lib/format";
import { testPath } from "@/lib/site";
import { titleFontStyle } from "@/lib/title-fonts";
import { HorrorBadge, NewBadge, THUMB_BG, isHorror } from "./TestBits";

/** 썸네일 색마다 같은 계열의 진한 그림자 색 (흰 글씨 5:1 이상) */
const SHADE: Record<ThumbnailColor, string> = {
  sky: "#2a6fbd",
  pink: "#b8396d",
  lemon: "#8a6100",
  mint: "#1b7a57",
  lilac: "#6b4fd1",
  peach: "#b04f23",
};

export function shadeFor(test: TestSummary) {
  if (test.shadeColor) return test.shadeColor;
  if (isHorror(test)) return "#0b0d17";
  if (test.thumbnailUrl) return "#1a2030";
  return SHADE[test.thumbnailColor ?? "sky"];
}

export const genreLine = (test: TestSummary) => test.genres.join(" · ");

const shadeStyle = (test: TestSummary) => ({ "--shade": shadeFor(test) }) as CSSProperties;

/**
 * 포스터 카드 (Figma 99 컴포넌트 / Top poster).
 * 이미지 썸네일이 있으면 이미지, 없으면 파스텔 바탕 + 이모지. 아래쪽은 같은 계열 진한 색으로 어두워지고
 * 그 위에 테스트별 제목 글꼴 + 장르 줄을 얹는다. 높이는 className으로 정한다.
 */
export function TestPoster({ test, sizes, className, priority }: {
  test: TestSummary;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const horror = isHorror(test);
  const genre = genreLine(test);
  return (
    <Link href={testPath(test.slug)} style={shadeStyle(test)}
      className={cx(
        "@container group relative block overflow-hidden rounded-xl outline-offset-4 transition-transform active:scale-[0.98]",
        test.thumbnailUrl ? "bg-night-900" : horror ? "bg-night-900" : THUMB_BG[test.thumbnailColor ?? "sky"],
        className,
      )}>
      {test.thumbnailUrl ? (
        <Image src={test.thumbnailUrl} alt="" fill sizes={sizes} priority={priority}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
      ) : (
        <>
          {horror && <span aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_75%,rgb(255_196_107/0.38),transparent_55%)]" />}
          <span aria-hidden className={cx("poster-gloss", horror && "bg-white/12")} />
          <span aria-hidden className="absolute inset-x-0 top-[22.42%] text-center text-[76px] leading-[90px]">
            {test.emoji ?? (horror ? "🕯️" : "✨")}
          </span>
        </>
      )}
      <span aria-hidden
        className={cx("absolute inset-x-0 bottom-0 top-[42.42%]",
          test.thumbnailUrl
            ? "bg-[linear-gradient(to_bottom,transparent,color-mix(in_srgb,var(--shade)_85%,transparent)_50%,var(--shade))]"
            : "bg-[linear-gradient(to_bottom,transparent,color-mix(in_srgb,var(--shade)_88%,transparent)_55%,var(--shade))]")} />
      <span className="absolute inset-x-3 bottom-4 flex flex-col items-center gap-1 text-center text-white">
        <span className="poster-title line-clamp-2 whitespace-pre-line" style={titleFontStyle(test.titleFont)}>
          {test.posterTitle ?? test.title}
        </span>
        {genre && <span className="text-label-s text-white/80">{genre}</span>}
      </span>
      {(test.isNew || horror) && (
        <span className="absolute left-2.5 top-2.5 flex gap-1">
          {test.isNew && <NewBadge />}
          {horror && <HorrorBadge />}
        </span>
      )}
    </Link>
  );
}

/**
 * 홈 배너 한 장 (Figma 01 홈 / 오늘의 테스트). 배너 전체가 링크이고 "시작하기"는 모양만 버튼.
 * 이미지 위에 왼쪽부터 진한 그림자를 깔아 제목을 읽기 쉽게 한다.
 */
export function HeroSlide({ test, priority }: { test: TestSummary; priority?: boolean }) {
  const genre = genreLine(test);
  return (
    <Link href={testPath(test.slug)} style={shadeStyle(test)}
      className={cx("relative block size-full overflow-hidden outline-offset-[-4px]",
        test.thumbnailUrl || isHorror(test) ? "bg-night-900" : THUMB_BG[test.thumbnailColor ?? "sky"])}>
      {test.thumbnailUrl ? (
        <Image src={test.thumbnailUrl} alt="" fill priority={priority} sizes="(min-width: 1248px) 1200px, 100vw" className="object-cover" />
      ) : (
        <span aria-hidden className="absolute right-[12%] top-1/2 -translate-y-1/2 text-[88px] leading-none md:right-[16%] md:text-[160px]">
          {test.emoji ?? "✨"}
        </span>
      )}
      <span aria-hidden className={cx(
        "absolute inset-0",
        "bg-[linear-gradient(90deg,color-mix(in_srgb,var(--shade)_92%,transparent),color-mix(in_srgb,var(--shade)_65%,transparent)_50%,color-mix(in_srgb,var(--shade)_10%,transparent)_85%),linear-gradient(color-mix(in_srgb,var(--shade)_25%,transparent),color-mix(in_srgb,var(--shade)_25%,transparent))]",
        "md:bg-[linear-gradient(180deg,transparent_55%,color-mix(in_srgb,var(--shade)_50%,transparent)),linear-gradient(90deg,color-mix(in_srgb,var(--shade)_92%,transparent),color-mix(in_srgb,var(--shade)_70%,transparent)_40%,transparent_70%),linear-gradient(color-mix(in_srgb,var(--shade)_25%,transparent),color-mix(in_srgb,var(--shade)_25%,transparent))]",
      )} />
      <span className="absolute inset-y-0 left-5 flex max-w-[60%] flex-col justify-center gap-1 text-white md:left-16 md:max-w-[640px] md:gap-2">
        <span className="hero-title line-clamp-2 whitespace-pre-line" style={titleFontStyle(test.titleFont)}>
          {test.posterTitle ?? test.title}
        </span>
        {genre && <span className="text-caption text-white/80 md:text-body">{genre}</span>}
      </span>
      <span className="absolute bottom-4 right-4 inline-flex h-10 items-center rounded-lg bg-white px-5 text-subtitle-s text-brand-600 md:bottom-8 md:right-8 md:h-auto md:px-8 md:py-3 md:text-subtitle">
        시작하기
      </span>
    </Link>
  );
}
