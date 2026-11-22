"use client";

import { useActionState } from "react";
import { login } from "@/lib/admin/actions";
import { Field, Notice, buttonClass, inputClass } from "./ui";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="비밀번호">
        <input name="password" type="password" required autoFocus autoComplete="current-password" className={inputClass} />
      </Field>
      {state?.error && <Notice tone="error">{state.error}</Notice>}
      <button type="submit" disabled={pending} className={`${buttonClass.primary} h-11`}>
        {pending ? "확인 중…" : "들어가기"}
      </button>
    </form>
  );
}
