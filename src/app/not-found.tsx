import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { COPYRIGHT_YEAR, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "페이지를 찾을 수 없어요" };

/**
 * 404 (Figma "07 404", 419:1885 · PC 419:1886 / 모바일 419:1924).
 * 없는 주소와 notFound() 모두 여기로 온다. 루트 레이아웃 바로 아래라 내비·푸터 없이 단독 화면으로 뜬다.
 * 게임 허브(wibble-game-hub)의 404도 같은 화면이다.
 */
export default function NotFound() {
  return (
    <div data-not-found className="flex min-h-dvh flex-1 flex-col items-center justify-between gap-6 bg-bg px-6 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(48px,env(safe-area-inset-top))] text-center">
      <header>
        <Logo className="h-[30px] md:h-[38px]" priority />
      </header>
      <main className="flex w-full max-w-[342px] flex-col items-center md:max-w-none">
        <picture>
          <source media="(min-width: 768px)" srcSet="/wibble-gate-pc.svg" width={203} height={203} />
          <img src="/wibble-gate-mobile.svg" alt="" width={152} height={152} className="block size-[152px] md:size-[203px]" />
        </picture>
        <h1 className="mt-4 text-[24px]/[1.3] font-extrabold tracking-[-0.025em] md:mt-5 md:text-display md:font-extrabold">404</h1>
        <p className="mt-2 text-body text-ink-2 md:mt-0">없는 페이지에요. 아래 버튼을 눌러 이동해봐요!</p>
        <Link
          href="/"
          className="mt-8 flex w-full items-center justify-center rounded-lg bg-primary px-8 py-4 text-subtitle-s text-white hover:bg-brand-600 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-300 md:mt-10 md:w-auto"
        >
          위블로 돌아가기
        </Link>
      </main>
      <footer className="text-caption text-ink-3">© {COPYRIGHT_YEAR} {SITE_NAME}</footer>
    </div>
  );
}
