"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/admin/actions";
import { Notice, buttonClass } from "./ui";

/** 버튼 하나짜리 서버 액션 (삭제·캐시 비우기). confirm이 있으면 먼저 묻는다 */
export function ActionButton({ action, label, pendingLabel, tone = "secondary", confirm }: {
  action: (prev: FormState) => Promise<FormState>;
  label: string;
  pendingLabel: string;
  tone?: keyof typeof buttonClass;
  confirm?: string;
}) {
  const [state, run, pending] = useActionState(action, null);
  return (
    <form action={run} onSubmit={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }}
      className="flex flex-col gap-2">
      <button type="submit" disabled={pending} className={buttonClass[tone]}>{pending ? pendingLabel : label}</button>
      {state?.error && <Notice tone="error">{state.error}</Notice>}
      {state?.notice && <Notice tone="success">{state.notice}</Notice>}
    </form>
  );
}
