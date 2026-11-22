"use client";

import { Notice, buttonClass } from "@/components/admin/ui";

/**
 * 어드민 화면에서 서버 조회가 실패했을 때.
 * 운영 빌드에서는 서버 오류 문구가 브라우저로 오지 않으므로(React #441) 문구 대신 digest를 보여 주고,
 * 같은 digest로 서버 로그에서 원인을 찾는다.
 */
export default function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = typeof error === "object" && error && "digest" in error ? String(error.digest) : null;
  const message = process.env.NODE_ENV === "development" && error instanceof Error ? error.message : null;
  return (
    <div className="flex flex-col items-start gap-3">
      <Notice tone="error">
        API 서버에서 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.
        {message && <><br />{message}</>}
        {digest && <><br /><span className="text-caption">서버 로그 코드: {digest}</span></>}
      </Notice>
      <button type="button" onClick={() => retry()} className={buttonClass.secondary}>다시 시도</button>
    </div>
  );
}
