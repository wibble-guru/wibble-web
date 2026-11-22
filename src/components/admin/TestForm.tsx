"use client";

import { useActionState, useState, startTransition, type FormEvent } from "react";
import { saveTest, type FormState } from "@/lib/admin/actions";
import type { AdminCategory, AdminTest } from "@/lib/admin/api";
import { thumbnailColors, type TestSummary, type ThumbnailColor, type TitleFont } from "@/lib/api/schemas";
import { cx } from "@/lib/format";
import { titleFontKeys } from "@/lib/title-fonts";
import { TestPoster } from "../Poster";
import { GamePreview } from "./GamePreview";
import { Field, Notice, Panel, buttonClass, inputClass } from "./ui";

const COLOR_LABELS: Record<ThumbnailColor, string> = {
  sky: "하늘", pink: "분홍", lemon: "레몬", mint: "민트", lilac: "라일락", peach: "복숭아",
};

type Props = {
  /** 없으면 새 테스트 */
  test: AdminTest | null;
  categories: AdminCategory[];
};

const str = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

/** 폼 값 → 미리보기용 TestSummary */
function previewOf(form: FormData, categories: AdminCategory[]): TestSummary & { gameUrl: string } {
  const picked = form.getAll("categorySlugs").map(String);
  const color = str(form, "thumbnailColor") as ThumbnailColor | "";
  const font = str(form, "titleFont") as TitleFont | "";
  const shade = str(form, "shadeColor");
  return {
    slug: str(form, "slug") || "preview",
    title: str(form, "title") || "제목",
    description: str(form, "description"),
    emoji: str(form, "emoji") || null,
    thumbnailUrl: null, // 이미지 주소는 사이트 허용 도메인이어야 그려져서 미리보기는 아래 <img>로 따로 보여준다
    thumbnailColor: color || "sky",
    theme: picked.includes("horror") ? "horror" : "default",
    playCount: 0,
    isNew: false,
    categories: picked,
    posterTitle: String(form.get("posterTitle") ?? "").replace(/\r\n/g, "\n").trim() || null,
    titleFont: font || null,
    genres: categories.filter((c) => picked.includes(c.slug)).map((c) => c.name),
    shadeColor: /^#[0-9a-fA-F]{6}$/.test(shade) ? shade : null,
    gameUrl: str(form, "gameUrl"),
  };
}

function initialForm(test: AdminTest | null) {
  const form = new FormData();
  if (!test) return form;
  const entries: [string, string | null | undefined][] = [
    ["slug", test.slug], ["title", test.title], ["description", test.description], ["emoji", test.emoji],
    ["thumbnailColor", test.thumbnailColor], ["posterTitle", test.posterTitle], ["titleFont", test.titleFont],
    ["shadeColor", test.shadeColor], ["gameUrl", test.gameUrl],
  ];
  for (const [k, v] of entries) if (v) form.set(k, v);
  const cats = test.categories?.length ? test.categories : test.category ? [test.category] : [];
  for (const c of cats) form.append("categorySlugs", c.slug);
  return form;
}

export function TestForm({ test, categories }: Props) {
  const editing = test !== null;
  const [state, action, pending] = useActionState<FormState, FormData>(saveTest.bind(null, test?.slug ?? null), null);
  const [preview, setPreview] = useState(() => previewOf(initialForm(test), categories));
  const [thumbnailUrl, setThumbnailUrl] = useState(test?.thumbnailUrl ?? "");

  const testCategories = new Set(
    (test?.categories?.length ? test.categories : test?.category ? [test.category] : []).map((c) => c.slug),
  );
  const warningsText = (test?.warnings ?? []).map((w) => (w.emoji ? `${w.emoji} ${w.label}` : w.label)).join("\n");

  // React의 폼 action은 제출 뒤 입력값을 지운다. 실패했을 때 입력이 남도록 직접 제출한다.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => action(form));
  }

  return (
    <form onSubmit={onSubmit} onChange={(e) => setPreview(previewOf(new FormData(e.currentTarget), categories))}
      className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex flex-col gap-5">
        <Panel title="기본 정보">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="slug (주소)" hint={editing ? "주소라서 만든 뒤에는 바꿀 수 없어요" : "영문 소문자·숫자·- 예: midnight-store → /t/midnight-store"}>
              <input name="slug" defaultValue={test?.slug} required readOnly={editing} pattern="[A-Za-z0-9][A-Za-z0-9_\-]{0,63}"
                className={cx(inputClass, editing && "bg-bg text-ink-3")} />
            </Field>
            <Field label="제목">
              <input name="title" defaultValue={test?.title} required className={inputClass} />
            </Field>
          </div>
          <Field label="설명">
            <textarea name="description" defaultValue={test?.description ?? ""} rows={3} className={inputClass} />
          </Field>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-label font-bold text-ink-2">카테고리</legend>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <label key={c.slug} className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-chip px-3.5 py-2 text-label-l has-checked:bg-brand-300 has-checked:font-bold">
                  <input type="checkbox" name="categorySlugs" value={c.slug} defaultChecked={testCategories.has(c.slug)} className="accent-primary" />
                  {c.name}
                </label>
              ))}
            </div>
            <span className="text-caption text-ink-3">공포(horror)를 고르면 어두운 테마와 시작 전 경고가 붙어요</span>
          </fieldset>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <fieldset className="flex items-center gap-4">
              <legend className="sr-only">공개 상태</legend>
              <label className="inline-flex items-center gap-2 text-body-s">
                <input type="radio" name="status" value="PUBLISHED" defaultChecked={test?.status !== "DRAFT"} className="accent-primary" /> 공개
              </label>
              <label className="inline-flex items-center gap-2 text-body-s">
                <input type="radio" name="status" value="DRAFT" defaultChecked={test?.status === "DRAFT"} className="accent-primary" /> 비공개
              </label>
            </fieldset>
            <label className="inline-flex items-center gap-2 text-body-s">
              <input type="checkbox" name="featured" defaultChecked={test?.featured ?? false} className="accent-primary" />
              홈 &quot;오늘의 테스트&quot; 배너에 올리기
            </label>
          </div>
        </Panel>

        <Panel title="게임">
          <Field label="게임 주소 (gameUrl)" hint="iframe으로 띄울 게임. 예: https://game.wibble.guru/court/ — 비우면 사이트에 '게임을 준비하고 있어요'가 보여요">
            <input name="gameUrl" type="url" defaultValue={test?.gameUrl ?? ""} placeholder="https://" className={inputClass} />
          </Field>
          <GamePreview gameUrl={preview.gameUrl} slug={preview.slug} theme={preview.theme} />
        </Panel>

        <Panel title="꾸밈">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="썸네일 이미지 주소" hint="세로 3:5 권장. 비우면 색 + 이모지">
              <input name="thumbnailUrl" type="url" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://" className={inputClass} />
            </Field>
            <Field label="공유 이미지 주소" hint="1200×630. 비우면 썸네일">
              <input name="shareImageUrl" type="url" defaultValue={test?.shareImageUrl ?? ""} placeholder="https://" className={inputClass} />
            </Field>
            <Field label="이모지" hint="썸네일 이미지가 없을 때">
              <input name="emoji" defaultValue={test?.emoji ?? ""} maxLength={8} placeholder="✨" className={inputClass} />
            </Field>
            <Field label="썸네일 색">
              <select name="thumbnailColor" defaultValue={test?.thumbnailColor ?? ""} className={inputClass}>
                <option value="">자동</option>
                {thumbnailColors.map((c) => <option key={c} value={c}>{COLOR_LABELS[c]}</option>)}
              </select>
            </Field>
            <Field label="포스터 제목" hint="줄을 바꾸면 포스터에서도 그 자리에서 나뉘어요. 비우면 제목">
              <textarea name="posterTitle" defaultValue={test?.posterTitle ?? ""} rows={2} className={inputClass} />
            </Field>
            <Field label="제목 글꼴">
              <select name="titleFont" defaultValue={test?.titleFont ?? ""} className={inputClass}>
                <option value="">기본 (SUIT 굵게)</option>
                {titleFontKeys.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
            <Field label="포스터 그림자 색" hint="#rrggbb. 이미지 썸네일이면 꼭 넣어 주세요">
              <input name="shadeColor" defaultValue={test?.shadeColor ?? ""} placeholder="#1a2030" pattern="#[0-9a-fA-F]{6}" className={inputClass} />
            </Field>
            <Field label="소요 시간 (분)">
              <input name="durationMinutes" type="number" min={1} step={1} defaultValue={test?.durationMinutes ?? ""} className={inputClass} />
            </Field>
          </div>
          <Field label="공포 경고" hint="한 줄에 하나. 앞에 이모지를 붙일 수 있어요. 예: 😱 깜짝 놀라는 장면">
            <textarea name="warnings" defaultValue={warningsText} rows={3} className={inputClass} />
          </Field>
        </Panel>
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-20">
        <Panel title="포스터 미리보기">
          <div aria-hidden className="pointer-events-none mx-auto w-[220px]">
            <TestPoster test={preview} sizes="220px" className="h-[330px]" />
          </div>
          {thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- 아무 도메인이나 미리 볼 수 있게 최적화 없이
            <img src={thumbnailUrl} alt="썸네일 이미지 미리보기" className="mx-auto max-h-40 rounded-lg object-contain" />
          )}
        </Panel>
        {state?.error && <Notice tone="error">{state.error}</Notice>}
        <button type="submit" disabled={pending} className={`${buttonClass.primary} h-12 text-subtitle-s`}>
          {pending ? "저장 중…" : editing ? "저장" : "테스트 만들기"}
        </button>
      </div>
    </form>
  );
}
