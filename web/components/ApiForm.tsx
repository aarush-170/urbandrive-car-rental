"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  endpoint: string;
  method?: "POST" | "PATCH";
  submitLabel: string;
  children: React.ReactNode;
  redirectTo?: string; // navigate here after success instead of refreshing
  className?: string;
}

// Submits the form's fields as JSON to a Route Handler and shows the server's validation / DB errors.
export default function ApiForm({ endpoint, method = "POST", submitLabel, children, redirectTo, className }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError(null);
    setDone(false);
    const body: Record<string, string> = {};
    for (const [k, v] of new FormData(form).entries()) {
      if (typeof v === "string" && v !== "") body[k] = v;
    }
    try {
      const res = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Request failed.");
      } else if (redirectTo) {
        router.push(redirectTo);
      } else {
        form.reset();
        setDone(true);
        router.refresh();
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      <div className="form-grid">{children}</div>
      <div style={{ marginTop: 12 }}>
        <button className="btn" disabled={busy}>{busy ? "Saving..." : submitLabel}</button>
      </div>
      {error && <p className="msg-err" role="alert">{error}</p>}
      {done && <p className="msg-ok">Saved.</p>}
    </form>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      {label}
      {children}
    </label>
  );
}
