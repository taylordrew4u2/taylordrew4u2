"use client";

import { useEffect, useState } from "react";
import { DECISION_MAX, NAME_MAX } from "@/lib/decisions";

/**
 * The submission form. Built for a phone in a bar: one field, one choice,
 * one button, and a thank-you that replaces the form so nobody sends twice
 * by accident.
 *
 * Outside the show's window the form is replaced by a note saying when it
 * opens. The poll that keeps the count moving also watches for the window
 * opening, so a phone left face-up on the table turns into a live form on
 * its own.
 */
export default function DecisionForm({
  question,
  placeholder,
  namePrompt,
  formNote,
  submitLabel,
  thanksText,
  showCount,
  initialCount,
  initialOpen,
  initialClosedText,
}: {
  question: string;
  placeholder: string;
  namePrompt: string;
  formNote: string;
  submitLabel: string;
  thanksText: string;
  showCount: boolean;
  initialCount: number | null;
  initialOpen: boolean;
  initialClosedText: string;
}) {
  const [decision, setDecision] = useState("");
  const [named, setNamed] = useState(false);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [count, setCount] = useState<number | null>(initialCount);
  const [open, setOpen] = useState(initialOpen);
  const [closedText, setClosedText] = useState(initialClosedText);

  // Watch for the window opening, and keep the count moving once it has.
  useEffect(() => {
    const tick = async () => {
      try {
        const response = await fetch("/api/decisions", { cache: "no-store" });
        const data = await response.json();
        if (typeof data.open === "boolean") setOpen(data.open);
        if (typeof data.closedText === "string") setClosedText(data.closedText);
        setCount(typeof data.count === "number" ? data.count : null);
      } catch {
        // A missed tick is nothing; the next one will land.
      }
    };
    // Half a minute is plenty for a number that only has to feel alive, and
    // it halves what a full room asks of the store.
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, name, anonymous: !named, website }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || "Couldn't send that.");
      if (typeof data.count === "number") setCount(data.count);
      setDone(true);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Couldn't send that.");
    } finally {
      setBusy(false);
    }
  };

  const remaining = DECISION_MAX - decision.length;

  const counter =
    showCount && count !== null ? (
      <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--pnc-muted)]">
        {count === 0 ? "No decisions in yet. Be first." : `${count} ${count === 1 ? "decision" : "decisions"} in tonight`}
      </p>
    ) : null;

  if (!open) {
    return (
      <div className="border border-dashed border-white/20 p-5 sm:p-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--pnc-muted)]">
          Submissions closed
        </p>
        <p className="mt-3 text-[17px] leading-relaxed">{closedText}</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="border border-white/15 p-5 sm:p-6">
        <p className="text-[17px] leading-relaxed">{thanksText}</p>
        <div className="mt-4">{counter}</div>
        <button
          type="button"
          onClick={() => {
            setDecision("");
            setName("");
            setNamed(false);
            setDone(false);
          }}
          className="mt-5 text-[12px] uppercase tracking-[0.22em] text-[var(--pnc-muted)] underline underline-offset-4 hover:text-[var(--pnc-fg)]"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="border border-white/15 p-5 sm:p-6">
      <label className="block">
        <span className="block text-[20px] leading-snug sm:text-[22px]" style={{ fontFamily: "var(--pnc-heading)" }}>
          {question}
        </span>
        <textarea
          required
          rows={6}
          maxLength={DECISION_MAX}
          value={decision}
          onChange={(event) => setDecision(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="mt-4 w-full resize-y border border-white/25 bg-transparent px-3 py-3 text-[17px] leading-relaxed outline-none placeholder:text-white/30 focus:border-[var(--pnc-accent)]"
        />
      </label>

      {/* Only appears once the cap is close, so it never reads as a target. */}
      {remaining <= 100 ? (
        <p className="mt-2 text-right text-[12px] text-[var(--pnc-muted)]">
          {remaining} character{remaining === 1 ? "" : "s"} left
        </p>
      ) : null}

      <label className="mt-4 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={named}
          onChange={(event) => setNamed(event.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--pnc-accent)]"
        />
        <span className="text-[15px] leading-snug">
          {namePrompt}
          <span className="mt-1 block text-[13px] text-[var(--pnc-muted)]">
            {named
              ? "Your name gets read out with it."
              : "Leave this unticked and it stays anonymous."}
          </span>
        </span>
      </label>

      {named ? (
        <input
          type="text"
          maxLength={NAME_MAX}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          autoComplete="name"
          className="mt-3 w-full border border-white/25 bg-transparent px-3 py-2.5 text-[16px] outline-none placeholder:text-white/30 focus:border-[var(--pnc-accent)]"
        />
      ) : null}

      {/* Honeypot — hidden from people, filled by bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
        </label>
      </div>

      <button
        type="submit"
        disabled={busy || !decision.trim()}
        className="mt-5 block w-full bg-[var(--pnc-fg)] px-5 py-3.5 text-center text-[13px] uppercase tracking-[0.22em] text-[var(--pnc-bg)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "Sending…" : submitLabel}
      </button>

      {error ? <p className="mt-3 text-[13px] text-[var(--pnc-accent)]">{error}</p> : null}

      {formNote ? (
        <p className="mt-4 text-[13px] leading-relaxed text-[var(--pnc-muted)]">{formNote}</p>
      ) : null}
      <div className="mt-3">{counter}</div>
    </form>
  );
}
