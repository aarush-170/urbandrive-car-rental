const inrFmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export const inr = (n: number | null | undefined) => (n == null ? "-" : inrFmt.format(n));
export const km = (n: number) => new Intl.NumberFormat("en-IN").format(n);
// MySQL 'YYYY-MM-DD HH:mm:ss' -> 'YYYY-MM-DD HH:mm'
export const when = (s: string | null | undefined) => (s ? s.slice(0, 16) : "-");

export function statusTone(s: string): "ok" | "warn" | "bad" | "info" | "" {
  switch (s) {
    case "Available": case "Completed": case "Success": return "ok";
    case "Rented": case "Ongoing": return "info";
    case "In_Maintenance": case "Confirmed": case "Pending": return "warn";
    case "Decommissioned": case "Cancelled": case "Failed": case "Refunded": return "bad";
    default: return "";
  }
}

// searchParams values can be string | string[] | undefined
export function param(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s.trim() : undefined;
}
export function intParam(v: string | string[] | undefined): number | undefined {
  const s = param(v);
  return s && /^\d+$/.test(s) ? Number(s) : undefined;
}

// Current local time formatted for <input type="datetime-local">
export function nowLocalInput(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
