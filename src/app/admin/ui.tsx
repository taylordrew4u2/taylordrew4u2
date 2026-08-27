"use client";

import type { ReactNode } from "react";

export function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-8 rounded-lg border border-neutral-800 bg-neutral-950">
      <header className="border-b border-neutral-800 px-4 py-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-neutral-200">
          {title}
        </h2>
        {hint ? <p className="mt-1 text-[12px] text-neutral-500">{hint}</p> : null}
      </header>
      <div className="grid gap-4 p-4">{children}</div>
    </section>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))" }}
    >
      {children}
    </div>
  );
}

export function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-neutral-400">
      {children}
      {hint ? <span className="ml-2 normal-case tracking-normal text-neutral-600">{hint}</span> : null}
    </span>
  );
}

const inputClass =
  "w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-[14px] text-neutral-100 outline-none transition-colors placeholder:text-neutral-600 focus:border-neutral-400";

export function Text({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <Label hint={hint}>{label}</Label>
      <input
        className={inputClass}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function Area({
  label,
  value,
  onChange,
  rows = 5,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <Label hint={hint}>{label}</Label>
      <textarea
        className={`${inputClass} resize-y leading-relaxed`}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function Num({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="block">
      <Label>
        {label}
        <span className="ml-2 text-neutral-500">
          {value}
          {suffix ?? ""}
        </span>
      </Label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          className="h-1 w-full accent-white"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <input
          type="number"
          className="w-20 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-[13px] text-neutral-100 outline-none focus:border-neutral-400"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
    </label>
  );
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <Label hint={hint}>{label}</Label>
      <select
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Toggle({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2.5">
      <span>
        <span className="block text-[13px] text-neutral-200">{label}</span>
        {hint ? <span className="block text-[11px] text-neutral-500">{hint}</span> : null}
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          value ? "bg-white" : "bg-neutral-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${
            value ? "left-[18px] bg-black" : "left-0.5 bg-neutral-300"
          }`}
        />
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={value}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

export function Color({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="h-9 w-12 cursor-pointer rounded border border-neutral-700 bg-neutral-900"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          className={inputClass}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </label>
  );
}

export function Button({
  children,
  onClick,
  tone = "default",
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "default" | "ghost" | "danger" | "primary";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const tones = {
    default: "border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-neutral-500",
    ghost: "border-transparent bg-transparent text-neutral-400 hover:text-neutral-100",
    danger: "border-red-900/60 bg-red-950/40 text-red-300 hover:border-red-600",
    primary: "border-white bg-white text-black hover:bg-neutral-200",
  } as const;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

export function Card({
  title,
  subtitle,
  actions,
  children,
  defaultOpen = false,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-lg border border-neutral-800 bg-neutral-950 open:bg-neutral-900/40"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <span className="min-w-0">
          <span className="block truncate text-[14px] text-neutral-100">{title || "Untitled"}</span>
          {subtitle ? (
            <span className="block truncate text-[11px] text-neutral-500">{subtitle}</span>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {actions}
          <span className="text-[11px] text-neutral-500 group-open:hidden">Open</span>
          <span className="hidden text-[11px] text-neutral-500 group-open:inline">Close</span>
        </span>
      </summary>
      <div className="grid gap-4 border-t border-neutral-800 p-4">{children}</div>
    </details>
  );
}

export function Tags({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <Label hint={hint ?? "comma separated"}>{label}</Label>
      <input
        className={inputClass}
        value={value.join(", ")}
        onChange={(event) =>
          onChange(
            event.target.value
              .split(",")
              .map((entry) => entry.trim())
              .filter(Boolean)
          )
        }
      />
    </label>
  );
}
