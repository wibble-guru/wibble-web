import { ImageResponse } from "next/og";

// 기본 공유 이미지. 테스트/결과별 이미지는 tests.ts의 thumbnail / image로 지정.
// next/og 기본 폰트는 한글을 지원하지 않으므로, 한글 문구가 필요하면 폰트 파일을 fonts 옵션으로 넘기거나 정적 이미지를 쓴다.
export const alt = "Wibble";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #5b4bff 0%, #ee2a7b 100%)",
          color: "white",
          fontSize: 96,
          fontWeight: 700,
          letterSpacing: -2,
        }}
      >
        Wibble
      </div>
    ),
    size,
  );
}
