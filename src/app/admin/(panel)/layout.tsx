import { AdminNav } from "@/components/admin/AdminNav";

/** 로그인한 뒤의 어드민 화면. 로그인 확인은 각 화면이 Suspense 안에서 requireAdmin()으로 한다. */
export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <AdminNav />
      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-5 px-4 py-6 md:px-6 md:py-8">{children}</main>
    </>
  );
}
