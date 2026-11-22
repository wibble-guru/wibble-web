"use client";

import { Notice, buttonClass } from "@/components/admin/ui";

/** 어드민 화면에서 API 조회가 실패했을 때 */
export default function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  const message = error instanceof Error ? error.message : "";
  return (
    <div className="flex flex-col items-start gap-3">
      <Notice tone="error">불러오지 못했어요. {message}</Notice>
      <button type="button" onClick={() => retry()} className={buttonClass.secondary}>다시 시도</button>
    </div>
  );
}
