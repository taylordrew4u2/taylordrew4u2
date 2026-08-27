"use client";

import { useState } from "react";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || "Wrong password");
      window.location.reload();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Wrong password");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <form onSubmit={submit} className="w-full max-w-xs">
        <h1 className="mb-1 text-center text-[13px] font-semibold uppercase tracking-[0.2em] text-neutral-200">
          Pins &amp; Needles admin
        </h1>
        <p className="mb-6 text-center text-[12px] text-neutral-500">Enter the password.</p>

        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-center text-[15px] tracking-[0.3em] text-neutral-100 outline-none focus:border-neutral-400"
        />

        {error ? <p className="mt-3 text-center text-[12px] text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={busy || !password}
          className="mt-4 w-full rounded-md bg-white py-2.5 text-[13px] font-medium text-black transition-colors hover:bg-neutral-200 disabled:opacity-40"
        >
          {busy ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}
