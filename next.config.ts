import type { NextConfig } from "next";

type RemotePattern = { protocol: "http" | "https"; hostname: string; port: string; pathname: string };

/** 썸네일·결과 이미지를 next/image로 최적화할 수 있도록 API 도메인과 WIBBLE_IMAGE_HOSTS를 허용한다. */
function imageHosts(): RemotePattern[] {
  const sources = [process.env.WIBBLE_API_URL, ...(process.env.WIBBLE_IMAGE_HOSTS ?? "").split(",")];
  return sources.flatMap((raw) => {
    const value = raw?.trim();
    if (!value) return [];
    try {
      const url = new URL(value.includes("://") ? value : `https://${value}`);
      return [{ protocol: url.protocol === "http:" ? "http" : "https", hostname: url.hostname, port: url.port, pathname: "/**" }];
    } catch {
      return [];
    }
  });
}

// Next 기본 목록 + 카카오톡 링크 미리보기 봇: 이 봇들은 메타데이터를 스트리밍 없이 <head>에서 받는다.
const LIMITED_BOTS =
  /[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|kakaotalk-scrap|Daumoa/i;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  htmlLimitedBots: LIMITED_BOTS,
  images: {
    remotePatterns: imageHosts(),
    // 로컬 목업 API(127.0.0.1) 이미지를 확인할 때만 켠다. 배포 환경에서는 켜지 않는다.
    dangerouslyAllowLocalIP: process.env.WIBBLE_ALLOW_LOCAL_IMAGES === "1",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
