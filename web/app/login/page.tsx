"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: f.get("username"), password: f.get("password") }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? "Sign in failed.");
      else {
        router.push(data.role === "Customer" ? "/vehicles" : "/");
        router.refresh();
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: "48px auto" }}>
      <h1>Sign in to UrbanDrive</h1>
      <p className="sub">Admins, branch managers and customers each see different screens.</p>
      <form onSubmit={onSubmit} className="card">
        <label className="field">Username<input className="input" name="username" required autoComplete="username" autoFocus /></label>
        <label className="field" style={{ marginTop: 10 }}>Password<input className="input" type="password" name="password" required autoComplete="current-password" /></label>
        <div style={{ marginTop: 14 }}><button className="btn" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button></div>
        {error && <p className="msg-err" role="alert">{error}</p>}
      </form>
    </div>
  );
}
