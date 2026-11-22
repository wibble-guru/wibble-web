import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { titleFontVariables } from "./fonts";
import "./globals.css";

const suit = localFont({
  src: "./fonts/SUIT-Variable.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-suit",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} · ${SITE_DESCRIPTION}`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: { type: "website", locale: "ko_KR", siteName: SITE_NAME, title: SITE_NAME, description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f3f8ff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${suit.variable} ${titleFontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
