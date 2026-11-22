import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";
import { Logo } from "@/components/Logo";
import { adminEnabled } from "@/lib/admin/session";

export const metadata: Metadata = { title: "로그인" };

export default function AdminLoginPage() {
  return (
    <main className="grid flex-1 place-items-center px-4 py-16">
      <div className="flex w-full max-w-[380px] flex-col gap-6 rounded-xl bg-surface p-8">
        <div className="flex flex-col gap-2">
          <Logo className="h-8" />
          <h1 className="text-title-3">어드민</h1>
        </div>
        <Suspense fallback={<div className="h-[124px]" />}>
          <LoginBody />
        </Suspense>
      </div>
    </main>
  );
}

async function LoginBody() {
  await connection(); // ADMIN_PASSWORD는 실행할 때 값으로 확인
  if (!adminEnabled()) {
    return (
      <p className="text-body-s text-ink-2">
        어드민이 꺼져 있어요. 서버 환경 변수 <code className="font-bold">ADMIN_PASSWORD</code>를 설정하면 열려요.
      </p>
    );
  }
  return <LoginForm />;
}
