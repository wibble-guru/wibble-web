"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { cx } from "@/lib/format";
import { FlameIcon, GridIcon, HomeIcon } from "./icons";

type Tab = { href: string; label: string; icon: ReactNode; active: (path: string, sort: string | null) => boolean };

const TABS: Tab[] = [
  { href: "/", label: "홈", icon: <HomeIcon size={24} />, active: (p) => p === "/" },
  { href: "/tests", label: "전체 테스트", icon: <GridIcon size={24} />, active: (p, s) => p.startsWith("/tests") && s !== "popular" },
  { href: "/tests?sort=popular", label: "인기", icon: <FlameIcon size={24} />, active: (p, s) => p.startsWith("/tests") && s === "popular" },
];

/** 모바일 하단 탭바 */
export function TabBar() {
  return (
    <nav aria-label="주요 메뉴" data-tabbar className="fixed inset-x-0 bottom-0 z-30 rounded-t-xl bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgb(29_43_69/0.06)] md:hidden">
      <Suspense fallback={<Tabs pathname="" sort={null} />}>
        <ActiveTabs />
      </Suspense>
    </nav>
  );
}

function ActiveTabs() {
  return <Tabs pathname={usePathname()} sort={useSearchParams().get("sort")} />;
}

function Tabs({ pathname, sort }: { pathname: string; sort: string | null }) {
  return (
    <ul className="flex h-16 items-start justify-around pt-2.5">
      {TABS.map((t) => {
        const active = pathname !== "" && t.active(pathname, sort);
        return (
          <li key={t.href}>
            <Link href={t.href} aria-current={active ? "page" : undefined}
              className={cx("flex w-20 flex-col items-center gap-1 text-micro", active ? "text-primary" : "text-ink-3")}>
              {t.icon}
              {t.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
