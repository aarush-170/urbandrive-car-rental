import Link from "next/link";
import ActionButton from "@/components/ActionButton";
import ApiForm, { Field } from "@/components/ApiForm";
import { requirePage, STAFF } from "@/lib/auth";
import { inr, km } from "@/lib/format";
import { listMaintenance, maintenanceDue, vehicleOptions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const session = await requirePage(STAFF);
  const [records, due, vehicles] = await Promise.all([listMaintenance(), maintenanceDue(), vehicleOptions()]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <h1>Maintenance</h1>
      <p className="sub">Service history and vehicles that have run more than 10,000 miles since their last logged service.</p>

      <h2>Overdue for service ({due.length})</h2>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Vehicle</th><th>Branch</th><th>Last service</th><th className="num">Mileage now</th><th className="num">Since last service</th></tr></thead>
          <tbody>
            {due.map((d) => (
              <tr key={d.vehicle_id}>
                <td><Link href={`/vehicles/${d.vehicle_id}`}>{d.make} {d.model}</Link> <span className="muted">{d.license_plate}</span></td>
                <td>{d.branch_name}</td><td>{d.last_service_date ?? "never"}</td>
                <td className="num">{km(d.current_mileage)}</td><td className="num">{km(d.miles_since_service)} mi</td>
              </tr>
            ))}
            {due.length === 0 && <tr><td colSpan={5} className="muted">Nothing overdue.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2>Log a service</h2>
      <div className="card">
        <ApiForm endpoint="/api/maintenance" submitLabel="Save record">
          <Field label="Vehicle">
            <select className="input" name="vehicle_id" required>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}</select>
          </Field>
          <Field label="Service date"><input className="input" type="date" name="service_date" required defaultValue={today} /></Field>
          <Field label="Service type"><input className="input" name="service_type" required minLength={2} maxLength={100} placeholder="Oil change, brakes..." /></Field>
          <Field label="Mileage at service"><input className="input" type="number" name="mileage_at_service" required min={0} /></Field>
          <Field label="Cost (INR)"><input className="input" type="number" name="cost" required min={0} step="0.01" /></Field>
          <Field label="Notes"><input className="input" name="notes" maxLength={1000} /></Field>
        </ApiForm>
      </div>

      <h2>All service records ({records.length})</h2>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Date</th><th>Vehicle</th><th>Service</th><th className="num">Mileage</th><th className="num">Cost</th><th>Notes</th><th></th></tr></thead>
          <tbody>
            {records.map((m) => (
              <tr key={m.maintenance_id}>
                <td>{m.service_date}</td><td>{m.vehicle} <span className="muted">{m.license_plate}</span></td><td>{m.service_type}</td>
                <td className="num">{km(m.mileage_at_service)}</td><td className="num">{inr(m.cost)}</td><td>{m.notes}</td>
                <td>{session.role === "Admin" && <ActionButton endpoint={`/api/maintenance/${m.maintenance_id}`} method="DELETE" label="Delete" variant="danger" confirmText="Delete this service record?" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
