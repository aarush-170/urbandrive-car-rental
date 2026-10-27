import Link from "next/link";
import { notFound } from "next/navigation";
import Badge from "@/components/Badge";
import { requirePage } from "@/lib/auth";
import { inr, when } from "@/lib/format";
import { customerHistory, getCustomer } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CustomerAudit({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePage();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  // customers can open only their own profile
  if (session.role === "Customer" && session.customerId !== id) notFound();
  const customer = await getCustomer(id);
  if (!customer) notFound();
  const history = await customerHistory(id);
  const lateTotal = history.reduce((s, h) => s + h.late_fee, 0);

  return (
    <>
      {session.role !== "Customer" && <p><Link href="/customers">&larr; All customers</Link></p>}
      <h1>{customer.first_name} {customer.last_name}</h1>
      <p className="sub">{customer.email} &middot; {customer.phone} &middot; licence {customer.license_number} (expires {customer.license_expiry_date})</p>

      <div className="grid-stats">
        <div className="card stat"><div className="num">{history.length}</div><div className="lbl">Bookings</div></div>
        <div className="card stat"><div className="num">{inr(customer.total_spent)}</div><div className="lbl">Spent (completed)</div></div>
        <div className="card stat"><div className="num">{inr(lateTotal)}</div><div className="lbl">Late-return penalties</div></div>
      </div>

      <h2>Complete booking history</h2>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>#</th><th>Vehicle</th><th>Route</th><th>Period</th><th>Returned</th><th>Status</th><th className="num">Late fee</th><th className="num">Total</th></tr></thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.booking_id}>
                <td>{h.booking_id}</td><td>{h.vehicle}<br /><span className="muted">{h.license_plate}</span></td>
                <td>{h.pickup_branch} <span className="muted">&rarr; {h.dropoff_branch}</span></td>
                <td style={{ whiteSpace: "nowrap" }}>{when(h.start_date)}<br /><span className="muted">to {when(h.end_date)}</span></td>
                <td>{when(h.actual_return_date)}</td><td><Badge status={h.booking_status} /></td>
                <td className="num">{h.late_fee ? inr(h.late_fee) : "-"}</td><td className="num">{inr(h.total_amount)}</td>
              </tr>
            ))}
            {history.length === 0 && <tr><td colSpan={8} className="muted">No bookings yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
