import Link from "next/link";
import ActionButton from "@/components/ActionButton";
import ApiForm, { Field } from "@/components/ApiForm";
import Badge from "@/components/Badge";
import { requirePage } from "@/lib/auth";
import { inr, nowLocalInput, param, when } from "@/lib/format";
import { listBookings } from "@/lib/queries";
import { paymentMethods } from "@/lib/validation";

export const dynamic = "force-dynamic";

const STATUSES = ["Confirmed", "Ongoing", "Completed", "Cancelled"];

export default async function BookingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requirePage();
  const isCustomer = session.role === "Customer";
  const status = param((await searchParams).status);
  const bookings = await listBookings(STATUSES.includes(status ?? "") ? status : undefined, isCustomer ? session.customerId ?? -1 : undefined);
  const nowLocal = nowLocalInput();

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h1>Bookings</h1>
          <p className="sub">Reservation lifecycle: Confirmed &rarr; Ongoing &rarr; Completed (or Cancelled).</p>
        </div>
        <Link className="btn" href="/bookings/new" style={{ textDecoration: "none" }}>New booking</Link>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        <Link className={`btn sm ${status ? "ghost" : ""}`} href="/bookings" style={{ textDecoration: "none" }}>All</Link>
        {STATUSES.map((s) => (
          <Link key={s} className={`btn sm ${status === s ? "" : "ghost"}`} href={`/bookings?status=${s}`} style={{ textDecoration: "none" }}>{s}</Link>
        ))}
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>#</th><th>Customer</th><th>Vehicle</th><th>Route</th><th>Period</th><th>Status</th><th className="num">Late fee</th><th className="num">Total</th><th className="num">Paid</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.booking_id}>
                <td>{b.booking_id}</td>
                <td>{b.customer_name}</td>
                <td>{b.vehicle}<br /><span className="muted">{b.license_plate}</span></td>
                <td>{b.pickup_branch}<br /><span className="muted">&rarr; {b.dropoff_branch}</span></td>
                <td style={{ whiteSpace: "nowrap" }}>{when(b.start_date)}<br /><span className="muted">to {when(b.end_date)}</span>{b.actual_return_date && <><br /><span className="muted">returned {when(b.actual_return_date)}</span></>}</td>
                <td><Badge status={b.booking_status} /></td>
                <td className="num">{b.late_fee ? inr(b.late_fee) : "-"}</td>
                <td className="num">{inr(b.total_amount)}</td>
                <td className="num">{inr(b.paid)}</td>
                <td>
                  {b.booking_status === "Confirmed" && (
                    <div style={{ display: "flex", gap: 6 }}>
                      {!isCustomer && <ActionButton endpoint={`/api/bookings/${b.booking_id}/start`} label="Start rental" />}
                      <ActionButton endpoint={`/api/bookings/${b.booking_id}/cancel`} label="Cancel" variant="danger" confirmText={`Cancel booking #${b.booking_id}? Payments received will be marked Refunded.`} />
                    </div>
                  )}
                  {b.booking_status === "Ongoing" && !isCustomer && (
                    <details>
                      <summary style={{ cursor: "pointer" }}>Return vehicle</summary>
                      <ApiForm endpoint={`/api/bookings/${b.booking_id}/return`} submitLabel="Complete return">
                        <Field label="Return mileage"><input className="input" type="number" name="return_mileage" required min={b.initial_mileage} defaultValue={b.initial_mileage} /></Field>
                        <Field label="Returned at"><input className="input" type="datetime-local" name="actual_return_date" required defaultValue={nowLocal} /></Field>
                        <Field label="Balance paid by">
                          <select className="input" name="payment_method">{paymentMethods.map((m) => <option key={m}>{m}</option>)}</select>
                        </Field>
                      </ApiForm>
                    </details>
                  )}
                </td>
              </tr>
            ))}
            {bookings.length === 0 && <tr><td colSpan={10} className="muted">No bookings.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
