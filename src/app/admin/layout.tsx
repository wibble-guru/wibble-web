import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "어드민", template: "%s · 어드민 | Wibble" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex min-h-full flex-1 flex-col bg-bg text-ink">{children}</div>;
}
