import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { SearchIcon } from "./icons";
import { cx } from "@/lib/format";
import { CONTACT_EMAIL, COPYRIGHT_YEAR, SITE_NAME, SITE_TAGLINE, SOCIAL_LINKS } from "@/lib/site";
import { Logo } from "./Logo";

/** 모바일 상단바 (홈·목록·검색). 데스크톱에서는 PcNav가 대신한다. */
export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between bg-bg/90 px-4 backdrop-blur md:hidden">
      <Logo className="h-[30px]" priority />
      <Link href="/search" aria-label="테스트 검색" className="icon-btn">
        <SearchIcon />
      </Link>
    </header>
  );
}

/** 모바일 상세 화면 상단바: [왼쪽 버튼] 제목 [오른쪽 버튼] */
export function MobileTitleBar({ left, title, right }: { left: ReactNode; title: string; right?: ReactNode }) {
  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between gap-3 px-4 md:hidden">
      {left}
      <h1 className="truncate text-subtitle">{title}</h1>
      {right ?? <span className="size-10" aria-hidden />}
    </header>
  );
}

/** 사이트 공통 푸터 (Figma 99 컴포넌트 / Footer) */
export function Footer() {
  return (
    <footer className="mt-15 border-t border-line bg-surface pb-7 pt-8 md:mt-25 md:pb-10 md:pt-12">
      <div className="container-page flex flex-col gap-5 md:gap-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1 md:gap-1.5">
            <p className="text-subtitle md:text-title-3">{SITE_NAME}</p>
            <p className="text-label-s text-ink-2 md:text-label">{SITE_TAGLINE}</p>
            <p className="text-body-xs text-ink-3">심리테스트 결과는 전문적인 진단이 아닙니다. 실제 진단이 필요한 경우 전문가와 상담하세요.</p>
          </div>
          <ul className="flex gap-2.5" aria-label="Wibble SNS">
            {SOCIAL_LINKS.map((s) => (
              <li key={s.id}><SocialIcon {...s} /></li>
            ))}
          </ul>
        </div>
        <hr className="hidden border-line md:block" />
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <ul className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-caption text-ink-2 md:gap-5 md:text-label-s">
            <li><Link href="/privacy" className="font-bold text-ink hover:underline">개인정보처리방침</Link></li>
            <li><Link href="/terms" className="hover:text-ink hover:underline">이용약관</Link></li>
            <li><Link href="/license" className="hover:text-ink hover:underline">라이선스</Link></li>
            <li><a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-ink hover:underline">문의 {CONTACT_EMAIL}</a></li>
          </ul>
          <p className="text-body-xs text-ink-3">© {COPYRIGHT_YEAR} {SITE_NAME}</p>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ id, label, href }: (typeof SOCIAL_LINKS)[number]) {
  const icon = <Image src={`/icons/sns/${id}.svg`} alt="" width={18} height={18} className="size-4 md:size-[18px]" />;
  const cls = "grid size-9 place-items-center rounded-full border border-line bg-bg md:size-10";
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={cx(cls, "hover:border-brand-300")}>{icon}</a>
  ) : (
    <span role="img" aria-label={`${label} (준비 중)`} className={cls}>{icon}</span>
  );
}
