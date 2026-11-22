import { MobileTopBar } from "@/components/Chrome";
import { TabBar } from "@/components/TabBar";

/** 홈·전체 테스트·검색: 모바일 상단바 + 하단 탭바 */
export default function BrowseLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <MobileTopBar />
      <main className="container-page flex flex-1 flex-col pb-4 md:pt-8">{children}</main>
      <TabBar />
    </>
  );
}
