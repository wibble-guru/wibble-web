import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TestForm } from "@/components/admin/TestForm";
import { Panel, PublicSourceNotice } from "@/components/admin/ui";
import { listCategories } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "새 테스트" };

export default function NewTestPage() {
  return (
    <>
      <div className="flex flex-col gap-1">
        <Link href="/admin" className="text-label text-ink-3 hover:text-ink">← 테스트 목록</Link>
        <h1 className="text-title-2">새 테스트</h1>
      </div>
      <Suspense fallback={<Panel><div className="h-80 animate-pulse rounded-lg bg-brand-50" /></Panel>}>
        <NewTestForm />
      </Suspense>
    </>
  );
}

async function NewTestForm() {
  await requireAdmin();
  const { data: categories, source } = await listCategories();
  return (
    <>
      {source === "public" && <PublicSourceNotice />}
      <TestForm test={null} categories={categories} />
    </>
  );
}
