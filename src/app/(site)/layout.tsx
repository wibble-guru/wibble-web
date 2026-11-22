import { Footer } from "@/components/Chrome";
import { PcNav } from "@/components/PcNav";

/**
 * 일반 화면: PC 상단 내비 + 푸터.
 * 404(app/not-found.tsx)는 단독 화면이다. 없는 주소는 이 그룹 밖에서 뜨고,
 * /t/… 안의 notFound()로 이 레이아웃 안에 뜰 때는 globals.css가 data-site-chrome을 숨긴다.
 */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <div className="contents" data-site-chrome>
        <PcNav />
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
      <div className="contents" data-site-chrome>
        <Footer />
      </div>
    </>
  );
}
