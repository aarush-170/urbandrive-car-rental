import Link from "next/link";
import { ADMIN, requirePage } from "@/lib/auth";
import { inr, intParam, km } from "@/lib/format";
import { branchAvailability, maintenanceDue, repeatCustomers, revenueByCategory, revenueQuarters } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePage(ADMIN);
  const sp = await searchParams;
  const miles = intParam(sp.miles) ?? 10000;
  const quarters = await revenueQuarters();
  const yr = intParam(sp.year) ?? quarters[0]?.yr;
  const qtr = intParam(sp.quarter) ?? quarters[0]?.qtr;
  const [revenue, due, availability, repeat] = await Promise.all([
    yr && qtr ? revenueByCategory({ yr, qtr }) : Promise.resolve([]),
    maintenanceDue(miles),
    branchAvailability(),
    repeatCustomers(intParam(sp.repeat) ?? 2),
  ]);
  const total = revenue.reduce((s, r) => s + r.revenue, 0);
  const max = Math.max(1, ...revenue.map((r) => r.revenue));

  // pivot availability: branch x category
  const cats = [...new Set(availability.map((a) => a.category_name))];
  const branches = [...new Map(availability.map((a) => [a.branch_name, a.city])).entries()];
  const cell = new Map(availability.map((a) => [`${a.branch_name}|${a.category_name}`, a.available_vehicles]));

  return (
    <>
      <h1>Reports</h1>
      <p className="sub">Operational queries backed by SQL views and aggregate queries.</p>

      <h2>Revenue by vehicle category</h2>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {quarters.map((q) => (
          <Link key={`${q.yr}-${q.qtr}`} className={`btn sm ${q.yr === yr && q.qtr === qtr ? "" : "ghost"}`} style={{ textDecoration: "none" }} href={`/reports?year=${q.yr}&quarter=${q.qtr}`}>
            Q{q.qtr} {q.yr}
          </Link>
        ))}
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Category</th><th className="num">Bookings</th><th className="num">Revenue</th><th style={{ width: "40%" }}></th></tr></thead>
          <tbody>
            {revenue.map((r) => (
              <tr key={r.category_name}>
                <td>{r.category_name}</td><td className="num">{r.bookings}</td><td className="num">{inr(r.revenue)}</td>
                <td><div className="bar" style={{ width: `${(r.revenue / max) * 100}%`, minWidth: 4 }} /></td>
              </tr>
            ))}
            {revenue.length > 0 && <tr><td><strong>Total</strong></td><td></td><td className="num"><strong>{inr(total)}</strong></td><td></td></tr>}
            {revenue.length === 0 && <tr><td colSpan={4} className="muted">No successful payments in this quarter.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2>Vehicles beyond {km(miles)} miles since last service</h2>
      <form method="get" style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
        {yr && <input type="hidden" name="year" value={yr} />}
        {qtr && <input type="hidden" name="quarter" value={qtr} />}
        <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>Threshold (miles)
          <input className="input" type="number" name="miles" min={1} defaultValue={miles} style={{ width: 120 }} />
        </label>
        <button className="btn sm">Apply</button>
      </form>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Vehicle</th><th>Branch</th><th>Last service</th><th className="num">Mileage</th><th className="num">Since service</th></tr></thead>
          <tbody>
            {due.map((d) => (
              <tr key={d.vehicle_id}>
                <td><Link href={`/vehicles/${d.vehicle_id}`}>{d.make} {d.model}</Link> <span className="muted">{d.license_plate}</span></td>
                <td>{d.branch_name}</td><td>{d.last_service_date ?? "never"}</td><td className="num">{km(d.current_mileage)}</td><td className="num">{km(d.miles_since_service)}</td>
              </tr>
            ))}
            {due.length === 0 && <tr><td colSpan={5} className="muted">No vehicles over the threshold.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2>Available vehicles now, by branch and category</h2>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Branch</th>{cats.map((c) => <th key={c} className="num">{c}</th>)}</tr></thead>
          <tbody>
            {branches.map(([name, city]) => (
              <tr key={name}>
                <td>{name} <span className="muted">{city}</span></td>
                {cats.map((c) => <td key={c} className="num">{cell.get(`${name}|${c}`) ?? "-"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>Repeat customers (2 or more completed bookings)</h2>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Customer</th><th className="num">Completed bookings</th><th className="num">Spent</th><th className="num">Late fees</th></tr></thead>
          <tbody>
            {repeat.map((r) => (
              <tr key={r.customer_id}>
                <td><Link href={`/customers/${r.customer_id}`}>{r.customer_name}</Link></td>
                <td className="num">{r.completed_bookings}</td><td className="num">{inr(r.total_spent)}</td><td className="num">{r.total_late_fees ? inr(r.total_late_fees) : "-"}</td>
              </tr>
            ))}
            {repeat.length === 0 && <tr><td colSpan={4} className="muted">No repeat customers yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ marginTop: 8 }}>For a specific weekend, use <Link href="/vehicles">Vehicles</Link> and enter a date range. For a customer&apos;s history including late penalties, open the customer from <Link href="/customers">Customers</Link>.</p>
    </>
  );
}
