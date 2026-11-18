"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { cx } from "@/lib/format";
import { SearchIcon } from "./icons";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/", label: "홈", match: (p: string) => p === "/" },
  { href: "/tests", label: "전체 테스트", match: (p: string, sort: string | null) => p.startsWith("/tests") ? sort !== "popular" : p.startsWith("/t/") },
  { href: "/tests?sort=popular", label: "인기", match: (p: string, sort: string | null) => p.startsWith("/tests") && sort === "popular" },
];

/** 데스크톱(≥768px) 상단 내비게이션. 모바일에서는 각 페이지의 상단바·탭바가 대신한다. */
export function PcNav() {
  return (
    <nav className="sticky top-0 z-30 hidden h-[76px] border-b border-line bg-surface md:block">
      <div className="container-page flex h-full items-center gap-10">
        <Logo className="h-[38px]" priority />
        <Suspense fallback={<NavLinks pathname="" sort={null} />}>
          <ActiveNavLinks />
        </Suspense>
        <form action="/search" role="search" className="flex h-11 w-[280px] items-center gap-2 rounded-lg bg-bg px-[18px] text-ink-3 focus-within:ring-2 focus-within:ring-primary">
          <SearchIcon size={20} />
          <input name="q" type="search" placeholder="테스트 검색" aria-label="테스트 검색"
            className="w-full bg-transparent text-body text-ink outline-none placeholder:text-ink-3" />
        </form>
      </div>
    </nav>
  );
}

function ActiveNavLinks() {
  const pathname = usePathname();
  const sort = useSearchParams().get("sort");
  return <NavLinks pathname={pathname} sort={sort} />;
}

function NavLinks({ pathname, sort }: { pathname: string; sort: string | null }) {
  return (
    <div className="flex flex-1 gap-7">
      {LINKS.map((l) => {
        const active = pathname !== "" && l.match(pathname, sort);
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}
            className={cx("text-subtitle transition-colors", active ? "text-primary" : "text-ink-2 hover:text-ink")}>
            {l.label}
          </Link>
        );
      })}
    </div>
  );
}
