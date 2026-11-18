import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-page flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
      <span className="text-5xl" aria-hidden>🫥</span>
      <h1 className="text-title-3">찾는 테스트가 없어요</h1>
      <p className="text-ink-2">주소가 바뀌었거나 사라진 테스트일 수 있어요.</p>
      <Link href="/tests" className="rounded-lg bg-primary px-5 py-3 font-bold text-white">다른 테스트 보러가기</Link>
    </main>
  );
}
