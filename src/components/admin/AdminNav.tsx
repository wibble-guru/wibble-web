"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { logout } from "@/lib/admin/actions";
import { cx } from "@/lib/format";

const LINKS = [
  { href: "/admin", label: "테스트", match: (p: string) => p === "/admin" || p.startsWith("/admin/tests") },
  { href: "/admin/categories", label: "카테고리", match: (p: string) => p.startsWith("/admin/categories") },
];

export function AdminNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center gap-6 px-4 md:px-6">
        <Link href="/admin" className="text-subtitle">Wibble 어드민</Link>
        <nav aria-label="어드민 메뉴" className="flex gap-1">
          {/* 현재 경로는 요청 때만 알 수 있어서, 그 전에는 강조 없이 먼저 그린다 */}
          <Suspense fallback={<NavLinks pathname={null} />}>
            <CurrentNavLinks />
          </Suspense>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <a href="/" target="_blank" rel="noreferrer" className="text-label text-ink-3 hover:text-ink">사이트 ↗</a>
          <form action={logout}>
            <button type="submit" className="text-label text-ink-3 hover:text-ink">로그아웃</button>
          </form>
        </div>
      </div>
    </header>
  );
}

function CurrentNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

function NavLinks({ pathname }: { pathname: string | null }) {
  return LINKS.map((link) => {
    const active = pathname !== null && link.match(pathname);
    return (
      <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined}
        className={cx("rounded-md px-3 py-1.5 text-label-l", active ? "bg-brand-50 font-bold text-brand-600" : "text-ink-2 hover:text-ink")}>
        {link.label}
      </Link>
    );
  });
}
