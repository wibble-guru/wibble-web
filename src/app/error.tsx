"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const detail = process.env.NODE_ENV === "development" && error instanceof Error ? error.message : null;

  return (
    <main className="container-page flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
      <span className="text-5xl" aria-hidden>🫧</span>
      <h1 className="text-title-3">잠시 문제가 생겼어요</h1>
      <p className="text-ink-2">테스트 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
      {detail && <pre className="max-w-xl whitespace-pre-wrap rounded-lg bg-surface p-4 text-left text-caption text-ink-2">{detail}</pre>}
      <div className="flex gap-2">
        <button type="button" onClick={() => retry()} className="rounded-lg bg-primary px-5 py-3 font-bold text-white">다시 시도</button>
        <Link href="/" className="rounded-lg bg-brand-50 px-5 py-3 font-bold text-brand-600">홈으로</Link>
      </div>
    </main>
  );
}
