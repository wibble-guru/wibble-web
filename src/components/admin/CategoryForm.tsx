"use client";

import { useActionState, startTransition, type FormEvent } from "react";
import { saveCategory, type FormState } from "@/lib/admin/actions";
import type { AdminCategory } from "@/lib/admin/api";
import { cx } from "@/lib/format";
import { Notice, buttonClass, inputClass } from "./ui";

/** 카테고리 한 줄 수정, 또는 category가 없으면 새로 추가 */
export function CategoryForm({ category, order }: { category?: AdminCategory; order?: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCategory.bind(null, category?.slug ?? null), null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => action(form));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_88px_auto] items-center gap-2">
        <input name="slug" aria-label="slug" defaultValue={category?.slug} readOnly={Boolean(category)} required
          placeholder="slug (예: love)" pattern="[A-Za-z0-9][A-Za-z0-9_\-]{0,63}"
          className={cx(inputClass, category && "bg-bg text-ink-3")} />
        <input name="name" aria-label="이름" defaultValue={category?.name} required placeholder="이름 (예: 연애)" className={inputClass} />
        <input name="displayOrder" aria-label="표시 순서" type="number" step={1} defaultValue={order} placeholder="순서" className={inputClass} />
        <button type="submit" disabled={pending} className={category ? buttonClass.secondary : buttonClass.primary}>
          {pending ? "저장 중…" : category ? "저장" : "추가"}
        </button>
      </div>
      {state?.error && <Notice tone="error">{state.error}</Notice>}
      {state?.notice && <Notice tone="success">{state.notice}</Notice>}
    </form>
  );
}
