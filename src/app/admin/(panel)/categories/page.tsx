import type { Metadata } from "next";
import { Suspense } from "react";
import { ActionButton } from "@/components/admin/ActionButton";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { Panel, PublicSourceNotice } from "@/components/admin/ui";
import { removeCategory } from "@/lib/admin/actions";
import { listCategories } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "카테고리" };

export default function CategoriesPage() {
  return (
    <>
      <h1 className="text-title-2">카테고리</h1>
      <Suspense fallback={<Panel><div className="h-40 animate-pulse rounded-lg bg-brand-50" /></Panel>}>
        <Categories />
      </Suspense>
    </>
  );
}

async function Categories() {
  await requireAdmin();
  const { data: categories, source } = await listCategories();
  return (
    <>
      {source === "public" && <PublicSourceNotice />}
      <Panel title="목록">
        <p className="text-caption text-ink-3">순서가 작을수록 사이트 카테고리 칩에서 앞에 와요. slug는 주소에 쓰여서 바꿀 수 없어요.</p>
        <ul className="flex flex-col gap-3">
          {categories.map((c, i) => (
            <li key={c.slug} className="flex flex-col gap-2 md:flex-row md:items-start">
              <div className="flex-1"><CategoryForm category={c} order={i + 1} /></div>
              <ActionButton action={removeCategory.bind(null, c.slug)} label="삭제" pendingLabel="삭제 중…" tone="danger"
                confirm={`'${c.name}' 카테고리를 삭제할까요?`} />
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="새 카테고리">
        <CategoryForm order={categories.length + 1} />
      </Panel>
    </>
  );
}
