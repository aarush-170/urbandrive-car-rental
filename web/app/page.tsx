import Link from "next/link";
import Badge from "@/components/Badge";
import { inr, km, when } from "@/lib/format";
import { dashboardStats, listBookings, maintenanceDue, revenueByCategory, revenueQuarters } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [stats, bookings, due, quarters] = await Promise.all([
    dashboardStats(), listBookings(), maintenanceDue(), revenueQuarters(),
  ]);
  const revenue = quarters[0] ? await revenueByCategory(quarters[0]) : [];
  const maxRev = Math.max(1, ...revenue.map((r) => r.revenue));
  const active = bookings.filter((b) => b.booking_status === "Ongoing" || b.booking_status === "Confirmed").sort((a, b) => a.start_date.localeCompare(b.start_date)).slice(0, 6);

  return (
    <>
      <h1>Fleet dashboard</h1>
      <p className="sub">Live view of availability, rentals, revenue and maintenance across all branches.</p>

      <div className="grid-stats">
        {[
          ["Vehicles in fleet", stats.total],
          ["Available now", stats.available],
          ["Currently rented", stats.rented],
          ["In maintenance", stats.in_maintenance],
          ["Upcoming bookings", stats.upcoming_bookings],
          ["Revenue this month", inr(stats.month_revenue)],
          ["Late fees collected", inr(stats.late_fees)],
          ["Need servicing (>10,000 mi)", due.length],
        ].map(([label, value]) => (
          <div className="card stat" key={label as string}>
            <div className="num">{value}</div>
            <div className="lbl">{label}</div>
          </div>
        ))}
      </div>

      <h2>Revenue by vehicle category{quarters[0] ? ` (Q${quarters[0].qtr} ${quarters[0].yr})` : ""}</h2>
      <div className="card">
        {revenue.length === 0 && <p className="muted">No payments recorded yet.</p>}
        {revenue.map((r) => (
          <div key={r.category_name} style={{ display: "grid", gridTemplateColumns: "130px 1fr 100px", gap: 10, alignItems: "center", marginBottom: 6 }}>
            <span>{r.category_name}</span>
            <div className="bar" style={{ width: `${(r.revenue / maxRev) * 100}%`, minWidth: 4 }} />
            <span style={{ textAlign: "right" }}>{inr(r.revenue)}</span>
          </div>
        ))}
        <p style={{ marginTop: 8 }}><Link href="/reports">Open full reports</Link></p>
      </div>

      <h2>Active and upcoming rentals</h2>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>#</th><th>Customer</th><th>Vehicle</th><th>From</th><th>To</th><th>Status</th></tr></thead>
          <tbody>
            {active.map((b) => (
              <tr key={b.booking_id}>
                <td>{b.booking_id}</td><td>{b.customer_name}</td><td>{b.vehicle} <span className="muted">{b.license_plate}</span></td>
                <td>{when(b.start_date)}</td><td>{when(b.end_date)}</td><td><Badge status={b.booking_status} /></td>
              </tr>
            ))}
            {active.length === 0 && <tr><td colSpan={6} className="muted">No active rentals.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2>Vehicles overdue for maintenance</h2>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Vehicle</th><th>Branch</th><th className="num">Mileage</th><th className="num">Since last service</th></tr></thead>
          <tbody>
            {due.map((d) => (
              <tr key={d.vehicle_id}>
                <td><Link href={`/vehicles/${d.vehicle_id}`}>{d.make} {d.model}</Link> <span className="muted">{d.license_plate}</span></td>
                <td>{d.branch_name}</td><td className="num">{km(d.current_mileage)}</td><td className="num">{km(d.miles_since_service)} mi</td>
              </tr>
            ))}
            {due.length === 0 && <tr><td colSpan={4} className="muted">All vehicles are within the service interval.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
