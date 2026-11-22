import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Badge, Notice, Panel, PublicSourceNotice, buttonClass } from "@/components/admin/ui";
import { listTests, type AdminTest } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/session";
import { testPath } from "@/lib/site";

export const metadata: Metadata = { title: "테스트" };

export default function AdminTestsPage({ searchParams }: PageProps<"/admin">) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-title-2">테스트</h1>
        <Link href="/admin/tests/new" className={buttonClass.primary}>+ 새 테스트</Link>
      </div>
      <Suspense fallback={<Panel><div className="h-40 animate-pulse rounded-lg bg-brand-50" /></Panel>}>
        <TestList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function TestList({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  await requireAdmin();
  const [{ data: tests, source }, sp] = await Promise.all([listTests(), searchParams]);
  return (
    <>
      {sp.deleted && <Notice tone="success">삭제했어요.</Notice>}
      {source === "public" && <PublicSourceNotice />}
      <Panel>
        {tests.length === 0 ? (
          <p className="py-10 text-center text-body-s text-ink-3">아직 테스트가 없어요.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {tests.map((t) => <TestRow key={t.slug} test={t} />)}
          </ul>
        )}
      </Panel>
    </>
  );
}

const dateFormat = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeZone: "Asia/Seoul" });

function TestRow({ test }: { test: AdminTest }) {
  const categories = test.categories?.length ? test.categories : test.category ? [test.category] : [];
  const published = test.publishedAt ? new Date(test.publishedAt) : null;
  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:gap-5">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/tests/${test.slug}`} className="text-subtitle-s hover:text-primary">{test.title}</Link>
          {test.status === "PUBLISHED" ? <Badge tone="on">공개</Badge> : <Badge tone="off">비공개</Badge>}
          {test.gameUrl ? <Badge tone="on">게임 연결됨</Badge> : <Badge tone="warn">게임 없음</Badge>}
          {test.featured && <Badge tone="on">배너</Badge>}
        </div>
        <p className="flex flex-wrap gap-x-3 text-caption text-ink-3">
          <span>/{test.slug}</span>
          {categories.length > 0 && <span>{categories.map((c) => c.name).join(", ")}</span>}
          {published && !Number.isNaN(published.getTime()) && <span>{dateFormat.format(published)} 공개</span>}
          {test.gameUrl && <span className="truncate">{new URL(test.gameUrl).host}</span>}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <a href={testPath(test.slug)} target="_blank" rel="noreferrer" className={buttonClass.secondary}>사이트 ↗</a>
        <Link href={`/admin/tests/${test.slug}`} className={buttonClass.primary}>편집</Link>
      </div>
    </li>
  );
}
