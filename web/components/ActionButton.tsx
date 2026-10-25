"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  endpoint: string;
  method?: "POST" | "PATCH" | "DELETE";
  label: string;
  confirmText?: string;
  body?: Record<string, unknown>;
  variant?: "ghost" | "danger" | "";
}

export default function ActionButton({ endpoint, method = "POST", label, confirmText, body, variant = "ghost" }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) setError((await res.json().catch(() => ({}))).error ?? "Request failed.");
      else router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span>
      <button type="button" className={`btn sm ${variant}`} disabled={busy} onClick={run}>{label}</button>
      {error && <span className="msg-err" role="alert" style={{ display: "block", maxWidth: 220 }}>{error}</span>}
    </span>
  );
}
