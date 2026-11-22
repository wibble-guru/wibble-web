import type { ReactNode } from "react";
import { cx } from "@/lib/format";

/* 어드민 공통 모양. 사이트 디자인 토큰(globals.css)만 쓴다. */

export const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-body-s text-ink outline-none placeholder:text-ink-3 focus:border-primary focus:ring-2 focus:ring-primary/25";

export const buttonClass = {
  primary: "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-label-l font-bold text-white hover:bg-brand-600 disabled:opacity-50",
  secondary: "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-brand-50 px-4 text-label-l font-bold text-brand-600 hover:bg-brand-100 disabled:opacity-50",
  danger: "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#fdecec] px-4 text-label-l font-bold text-blood hover:bg-[#fbdcdc] disabled:opacity-50",
};

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cx("flex flex-col gap-1.5", className)}>
      <span className="text-label font-bold text-ink-2">{label}</span>
      {children}
      {hint && <span className="text-caption text-ink-3">{hint}</span>}
    </label>
  );
}

export function Panel({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cx("flex flex-col gap-4 rounded-xl bg-surface p-5 md:p-6", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3">
          {title && <h2 className="text-subtitle">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Notice({ tone, children }: { tone: "error" | "info" | "success"; children: ReactNode }) {
  return (
    <p role={tone === "error" ? "alert" : "status"}
      className={cx("rounded-lg px-4 py-3 text-body-s",
        tone === "error" && "bg-[#fdecec] text-blood",
        tone === "info" && "bg-warn-bg text-warn-fg",
        tone === "success" && "bg-brand-50 text-brand-600")}>
      {children}
    </p>
  );
}

export function Badge({ tone, children }: { tone: "on" | "off" | "warn"; children: ReactNode }) {
  return (
    <span className={cx("inline-flex h-6 items-center rounded-sm px-2 text-caption font-bold",
      tone === "on" && "bg-brand-50 text-brand-600",
      tone === "off" && "bg-chip text-ink-3",
      tone === "warn" && "bg-warn-bg text-warn-fg")}>
      {children}
    </span>
  );
}
