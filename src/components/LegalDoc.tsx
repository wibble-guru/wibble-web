import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import type { ReactNode } from "react";

/*
 * docs/legal/*.md를 그대로 보여주는 약관 화면. 문서는 제목(#)·소제목(##)·문단·목록(-, 1.)·인용(>)·**굵게**만 쓴다.
 * 문서를 고치면 다음 배포 때 반영된다.
 */

type Block =
  | { type: "h1" | "h2" | "h3" | "p" | "quote"; text: string }
  | { type: "ul" | "ol"; items: { text: string; sub: string[] }[] };

async function loadDoc(name: string) {
  "use cache";
  cacheLife("max");
  return readFile(path.join(process.cwd(), "docs/legal", `${name}.md`), "utf8");
}

function parse(md: string): Block[] {
  const blocks: Block[] = [];
  const lines = md.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const heading = /^(#{1,3}) (.*)$/.exec(line);
    if (heading) {
      blocks.push({ type: (["h1", "h2", "h3"] as const)[heading[1].length - 1], text: heading[2] });
      continue;
    }
    if (line.startsWith(">")) {
      const quote = [line.replace(/^>\s?/, "")];
      while (lines[i + 1]?.startsWith(">")) quote.push(lines[++i].replace(/^>\s?/, ""));
      blocks.push({ type: "quote", text: quote.join("\n") });
      continue;
    }
    const item = /^(-|\d+\.) (.*)$/.exec(line);
    if (item) {
      const type = item[1] === "-" ? "ul" : "ol";
      const items = [{ text: item[2], sub: [] as string[] }];
      while (i + 1 < lines.length) {
        const next = lines[i + 1];
        const sibling = /^(-|\d+\.) (.*)$/.exec(next);
        const nested = /^\s+- (.*)$/.exec(next);
        if (sibling && (sibling[1] === "-") === (type === "ul")) items.push({ text: sibling[2], sub: [] });
        else if (nested) items[items.length - 1].sub.push(nested[1]);
        else break;
        i++;
      }
      blocks.push({ type, items });
      continue;
    }
    const para = [line];
    while (lines[i + 1]?.trim() && !/^(#|>|-|\d+\.)/.test(lines[i + 1])) para.push(lines[++i]);
    blocks.push({ type: "p", text: para.join(" ") });
  }
  return blocks;
}

/** **굵게**, `코드`, [글](주소) */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
    if (part.startsWith("**")) return <strong key={i} className="font-bold text-ink">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`")) return <code key={i} className="rounded-sm bg-brand-50 px-1">{part.slice(1, -1)}</code>;
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) return <a key={i} href={link[2]} className="text-primary underline">{link[1]}</a>;
    return part;
  });
}

export async function LegalDoc({ name }: { name: "terms" | "privacy" | "license" }) {
  const blocks = parse(await loadDoc(name));
  return (
    <article className="mx-auto flex w-full max-w-[760px] flex-col gap-4 rounded-xl bg-surface px-5 py-8 text-body-s text-ink-2 md:px-12 md:py-12">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h1": return <h1 key={i} className="mb-2 text-title-2 text-ink md:text-title-1">{inline(b.text)}</h1>;
          case "h2": return <h2 key={i} className="mt-4 text-subtitle text-ink">{inline(b.text)}</h2>;
          case "h3": return <h3 key={i} className="mt-2 text-subtitle-s text-ink">{inline(b.text)}</h3>;
          case "quote": return <blockquote key={i} className="whitespace-pre-line rounded-lg bg-warn-bg px-4 py-3 text-body-xs text-warn-fg">{inline(b.text)}</blockquote>;
          case "p": return <p key={i}>{inline(b.text)}</p>;
          default: {
            const List = b.type === "ul" ? "ul" : "ol";
            return (
              <List key={i} className={b.type === "ul" ? "flex list-disc flex-col gap-1.5 pl-5" : "flex list-decimal flex-col gap-1.5 pl-5"}>
                {b.items.map((it, j) => (
                  <li key={j}>
                    {inline(it.text)}
                    {it.sub.length > 0 && (
                      <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-5">{it.sub.map((s, k) => <li key={k}>{inline(s)}</li>)}</ul>
                    )}
                  </li>
                ))}
              </List>
            );
          }
        }
      })}
    </article>
  );
}
