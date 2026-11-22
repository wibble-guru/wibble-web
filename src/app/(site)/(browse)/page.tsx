import { Suspense } from "react";
import { AllTimeTop, Hero, WeeklyTop } from "@/components/HomeSections";
import { HeroSkeleton, PosterGridSkeleton, PosterRailSkeleton } from "@/components/Skeletons";
import { SectionHeader } from "@/components/TestBits";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-7 pt-1 md:gap-14 md:pt-0">
      <Suspense fallback={<HeroSkeleton />}>
        <Hero />
      </Suspense>

      <section className="flex flex-col gap-3.5 md:gap-5">
        <SectionHeader title="이번 주 인기 TOP" href="/tests?sort=popular" />
        <Suspense fallback={<PosterRailSkeleton />}>
          <WeeklyTop />
        </Suspense>
      </section>

      <section className="flex flex-col gap-3.5 md:gap-5">
        <SectionHeader title="역대 인기 TOP" href="/tests?sort=popular" />
        <Suspense fallback={<PosterGridSkeleton />}>
          <AllTimeTop />
        </Suspense>
      </section>
    </div>
  );
}
