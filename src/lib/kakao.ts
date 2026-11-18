// Kakao JavaScript SDK — https://developers.kakao.com/docs/latest/ko/javascript/getting-started
export const KAKAO_SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.5/kakao.min.js";
export const KAKAO_SDK_INTEGRITY =
  "sha384-v6JKY3z4FUkWq21oZDHZe74YvuPk/WUrVLrDHTBojHXClOSa3iXy7sCXPY1jkFbj";

type KakaoLink = { mobileWebUrl: string; webUrl: string };

export type KakaoFeedSettings = {
  objectType: "feed";
  content: {
    title: string;
    description?: string;
    imageUrl: string;
    imageWidth?: number;
    imageHeight?: number;
    link: KakaoLink;
  };
  buttons?: { title: string; link: KakaoLink }[];
};

type KakaoStatic = {
  init(appKey: string): void;
  isInitialized(): boolean;
  Share: { sendDefault(settings: KakaoFeedSettings): void };
};

declare global {
  interface Window {
    Kakao?: KakaoStatic;
  }
}

/** SDK 로드 + init 완료된 Kakao 객체. 키가 없거나 로드 전이면 null */
export function getKakao(): KakaoStatic | null {
  const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  const kakao = typeof window === "undefined" ? undefined : window.Kakao;
  if (!key || !kakao) return null;
  if (!kakao.isInitialized()) kakao.init(key);
  return kakao;
}
