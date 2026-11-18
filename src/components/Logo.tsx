import Image from "next/image";
import Link from "next/link";
import { cx } from "@/lib/format";

/** 말랑한 Wibble 로고 (투명 PNG 1747×435). 높이는 className으로 정한다. */
export function Logo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Link href="/" aria-label="Wibble 홈" className="shrink-0">
      <Image src="/wibble-logo.png" alt="Wibble" width={1747} height={435} priority={priority} className={cx("w-auto", className)} />
    </Link>
  );
}
