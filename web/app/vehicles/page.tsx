import Link from "next/link";
import ApiForm, { Field } from "@/components/ApiForm";
import Badge from "@/components/Badge";
import { inr, intParam, km, param } from "@/lib/format";
import { availableVehicles, branchOptions, categoryOptions, listVehicles } from "@/lib/queries";

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function VehiclesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = param(sp.q);
  const branch = intParam(sp.branch);
  const category = intParam(sp.category);
  const status = param(sp.status);
  const start = param(sp.start);
  const end = param(sp.end);

  const [branches, categories] = await Promise.all([branchOptions(), categoryOptions()]);
  const searching = Boolean(start && end && end > start);
  const vehicles = searching
    ? await availableVehicles({ start: start!.replace("T", " "), end: end!.replace("T", " "), branch, category })
    : await listVehicles({ q, branch, category, status });

  return (
    <>
      <h1>Vehicles</h1>
      <p className="sub">Search the fleet, check availability for a date range, and manage vehicle status.</p>

      <form method="get" className="card">
        <div className="form-grid">
          <Field label="Search make / model"><input className="input" name="q" defaultValue={q} placeholder="e.g. creta, nexon" /></Field>
          <Field label="Branch">
            <select className="input" name="branch" defaultValue={branch ?? ""}>
              <option value="">All branches</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select className="input" name="category" defaultValue={category ?? ""}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="input" name="status" defaultValue={status ?? ""}>
              <option value="">Any status</option>
              {["Available", "Rented", "In_Maintenance", "Decommissioned"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
          </Field>
          <Field label="Free from (availability)"><input className="input" type="datetime-local" name="start" defaultValue={start} /></Field>
          <Field label="Free until"><input className="input" type="datetime-local" name="end" defaultValue={end} /></Field>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button className="btn">Search</button>
          <Link className="btn ghost" href="/vehicles" style={{ textDecoration: "none" }}>Reset</Link>
        </div>
        {searching && <p className="muted" style={{ marginTop: 8 }}>Showing vehicles with no Confirmed/Ongoing booking between these dates (the status filter is ignored).</p>}
      </form>

      <h2>{searching ? "Available for the selected dates" : "Fleet"} ({vehicles.length})</h2>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Vehicle</th><th>Plate</th><th>Category</th><th>Branch</th><th className="num">Mileage</th><th className="num">Rate / day</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.vehicle_id}>
                <td><Link href={`/vehicles/${v.vehicle_id}`}>{v.make} {v.model}</Link> <span className="muted">{v.manufacture_year}</span></td>
                <td>{v.license_plate}</td><td>{v.category_name}</td><td>{v.branch_name}, {v.city}</td>
                <td className="num">{km(v.current_mileage)}</td><td className="num">{inr(v.base_rate_per_day)}</td>
                <td><Badge status={v.status} /></td>
                <td>
                  {searching && (
                    <Link href={`/bookings/new?vehicle=${v.vehicle_id}&start=${encodeURIComponent(start!)}&end=${encodeURIComponent(end!)}`}>Book</Link>
                  )}
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && <tr><td colSpan={8} className="muted">No vehicles match.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2>Add a vehicle</h2>
      <div className="card">
        <ApiForm endpoint="/api/vehicles" submitLabel="Add vehicle">
          <Field label="VIN (17 characters)"><input className="input" name="vin" required minLength={17} maxLength={17} /></Field>
          <Field label="Licence plate"><input className="input" name="license_plate" required maxLength={15} /></Field>
          <Field label="Make"><input className="input" name="make" required /></Field>
          <Field label="Model"><input className="input" name="model" required /></Field>
          <Field label="Manufacture year"><input className="input" type="number" name="manufacture_year" required min={2000} max={new Date().getFullYear() + 1} /></Field>
          <Field label="Current mileage"><input className="input" type="number" name="current_mileage" required min={0} defaultValue={0} /></Field>
          <Field label="Category">
            <select className="input" name="category_id" required>{categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
          </Field>
          <Field label="Branch">
            <select className="input" name="current_branch_id" required>{branches.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}</select>
          </Field>
        </ApiForm>
      </div>
    </>
  );
}
