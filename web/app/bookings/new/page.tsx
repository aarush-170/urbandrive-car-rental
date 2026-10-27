import Link from "next/link";
import ApiForm, { Field } from "@/components/ApiForm";
import { requirePage } from "@/lib/auth";
import { intParam, param } from "@/lib/format";
import { branchOptions, customerOptions, getVehicle, listVehicles } from "@/lib/queries";
import { paymentMethods } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default async function NewBooking({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requirePage();
  const isCustomer = session.role === "Customer";
  const sp = await searchParams;
  const vehicleId = intParam(sp.vehicle);
  const start = param(sp.start);
  const end = param(sp.end);
  const [customers, branches, vehicles, chosen] = await Promise.all([
    customerOptions(), branchOptions(), listVehicles({}), vehicleId ? getVehicle(vehicleId) : Promise.resolve(undefined),
  ]);
  const bookable = vehicles.filter((v) => v.status !== "Decommissioned");

  return (
    <>
      <p><Link href="/bookings">&larr; Bookings</Link></p>
      <h1>New booking</h1>
      <p className="sub">The booking is created by a stored procedure inside one transaction. A 30% advance payment is recorded automatically. Double bookings and expired licences are rejected by the database.</p>
      <div className="card">
        <ApiForm endpoint="/api/bookings" submitLabel="Create booking" redirectTo="/bookings">
          {isCustomer ? (
            <p className="muted">Booking as {session.username}.</p>
          ) : (
            <Field label="Customer">
              <select className="input" name="customer_id" required defaultValue="">
                <option value="" disabled>Select customer</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
          )}
          <Field label="Vehicle">
            <select className="input" name="vehicle_id" required defaultValue={vehicleId ?? ""}>
              <option value="" disabled>Select vehicle</option>
              {bookable.map((v) => <option key={v.vehicle_id} value={v.vehicle_id}>{v.make} {v.model} - {v.license_plate} ({v.branch_name}, {v.status.replace("_", " ")})</option>)}
            </select>
          </Field>
          <Field label="Pickup branch">
            <select className="input" name="pickup_branch_id" required defaultValue={chosen?.branch_id ?? ""}>
              <option value="" disabled>Select branch</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </Field>
          <Field label="Drop-off branch">
            <select className="input" name="dropoff_branch_id" required defaultValue={chosen?.branch_id ?? ""}>
              <option value="" disabled>Select branch</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </Field>
          <Field label="Start"><input className="input" type="datetime-local" name="start_date" required defaultValue={start} /></Field>
          <Field label="End"><input className="input" type="datetime-local" name="end_date" required defaultValue={end} /></Field>
          <Field label="Advance paid by">
            <select className="input" name="payment_method">{paymentMethods.map((m) => <option key={m}>{m}</option>)}</select>
          </Field>
        </ApiForm>
      </div>
    </>
  );
}
