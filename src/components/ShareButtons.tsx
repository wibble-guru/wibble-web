"use client";

import Script from "next/script";
import { useRef, useState } from "react";
import { getKakao, KAKAO_SDK_INTEGRITY, KAKAO_SDK_SRC } from "@/lib/kakao";
import { cx } from "@/lib/format";
import { InstagramIcon, KakaoIcon, LinkIcon } from "./icons";

type Props = {
  /** 공유될 페이지의 절대 URL */
  url: string;
  title: string;
  description: string;
  /** 공유 카드·스토리용 이미지 절대 URL (권장 1200×630) */
  imageUrl: string;
  ctaLabel?: string;
  align?: "center" | "start";
};

/** 카카오톡 · 인스타 스토리 · 링크 복사 */
export function ShareButtons({ url, title, description, imageUrl, ctaLabel = "나도 테스트하기", align = "center" }: Props) {
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  function flash(message: string) {
    setNotice(message);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setNotice(null), 2500);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }

  function shareKakao() {
    const kakao = getKakao();
    if (!kakao) {
      flash(process.env.NEXT_PUBLIC_KAKAO_JS_KEY ? "카카오 공유를 준비하는 중이에요. 잠시 후 다시 눌러주세요." : "카카오 공유가 아직 설정되지 않았어요.");
      return;
    }
    const link = { mobileWebUrl: url, webUrl: url };
    kakao.Share.sendDefault({
      objectType: "feed",
      content: { title, description, imageUrl, imageWidth: 1200, imageHeight: 630, link },
      buttons: [{ title: ctaLabel, link }],
    });
  }

  /** 웹에서 스토리에 바로 올리는 공식 API는 없어서, 링크를 복사하고 이미지를 OS 공유 시트로 넘긴다. */
  async function shareInstagramStory() {
    const copied = await copyLink();
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(String(response.status));
      const blob = await response.blob();
      const file = new File([blob], "wibble.png", { type: blob.type || "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        if (copied) flash("링크를 복사했어요. 스토리의 링크 스티커에 붙여넣어 주세요!");
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    flash(copied ? "링크를 복사했어요. 화면을 캡처해 스토리에 올리고 링크 스티커로 붙여넣어 주세요!" : "이 브라우저에서는 공유를 지원하지 않아요.");
  }

  async function onCopy() {
    flash((await copyLink()) ? "링크를 복사했어요!" : "복사하지 못했어요.");
  }

  const button = "flex flex-col items-center gap-2 text-label-s text-ink-2";
  const square = "grid size-[60px] place-items-center rounded-xl transition-transform active:scale-95";

  return (
    <div className={cx("flex flex-col gap-2", align === "center" ? "items-center" : "items-start")}>
      <Script src={KAKAO_SDK_SRC} integrity={KAKAO_SDK_INTEGRITY} crossOrigin="anonymous" strategy="lazyOnload" />
      <div className="flex gap-7">
        <button type="button" onClick={shareKakao} className={button}>
          <span className={cx(square, "bg-kakao")}><KakaoIcon /></span>카카오톡
        </button>
        <button type="button" onClick={shareInstagramStory} className={button}>
          <span className={cx(square, "bg-[linear-gradient(45deg,#f9ce34_0%,#ee2a7b_55%,#6228d7_100%)] text-white")}><InstagramIcon size={26} /></span>
          인스타 스토리
        </button>
        <button type="button" onClick={onCopy} className={button}>
          <span className={cx(square, "bg-brand-50 text-primary")}><LinkIcon size={26} /></span>링크 복사
        </button>
      </div>
      <p aria-live="polite" className="min-h-5 text-center text-label text-ink-3">{notice}</p>
    </div>
  );
}
