import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ActionButton } from "@/components/admin/ActionButton";
import { TestForm } from "@/components/admin/TestForm";
import { Notice, Panel, buttonClass } from "@/components/admin/ui";
import { refreshTest, removeTest } from "@/lib/admin/actions";
import { getTest, listCategories } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/session";
import { isValidId } from "@/lib/ids";
import { testPath } from "@/lib/site";

export const metadata: Metadata = { title: "테스트 편집" };

type Props = PageProps<"/admin/tests/[slug]">;

export default function EditTestPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<Panel><div className="h-80 animate-pulse rounded-lg bg-brand-50" /></Panel>}>
      <EditTest params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditTest({ params, searchParams }: Props) {
  await requireAdmin();
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  if (!isValidId(slug)) notFound();
  const [test, categories] = await Promise.all([getTest(slug), listCategories()]);
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link href="/admin" className="text-label text-ink-3 hover:text-ink">← 테스트 목록</Link>
          <h1 className="text-title-2">{test.title}</h1>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <a href={testPath(test.slug)} target="_blank" rel="noreferrer" className={buttonClass.secondary}>사이트에서 보기 ↗</a>
          <ActionButton action={refreshTest.bind(null, test.slug)} label="사이트 캐시 비우기" pendingLabel="비우는 중…" />
          <ActionButton action={removeTest.bind(null, test.slug)} label="삭제" pendingLabel="삭제 중…" tone="danger"
            confirm={`'${test.title}' 테스트를 삭제할까요? 되돌릴 수 없어요.`} />
        </div>
      </div>
      {sp.saved && <Notice tone="success">저장했어요. 사이트에도 바로 반영돼요.</Notice>}
      <TestForm key={test.slug} test={test} categories={categories} />
    </>
  );
}
