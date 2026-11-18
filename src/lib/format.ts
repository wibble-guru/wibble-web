/** 참여 수 표기: 9,820 / 2.4만 / 1.2억 */
export function formatCount(n: number) {
  if (n >= 100_000_000) return `${trim(n / 100_000_000)}억`;
  if (n >= 10_000) return `${trim(n / 10_000)}만`;
  return n.toLocaleString("ko-KR");
}

const trim = (v: number) => (v >= 100 ? Math.round(v).toString() : v.toFixed(1).replace(/\.0$/, ""));

export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");
