import type { Metadata } from "next";
import { LegalDoc } from "@/components/LegalDoc";

export const metadata: Metadata = { title: "개인정보처리방침" };

export default function Page() {
  return (
    <div className="pt-2 md:pt-0">
      <LegalDoc name="privacy" />
    </div>
  );
}
