import Link from "next/link";
import { notFound } from "next/navigation";
import ActionButton from "@/components/ActionButton";
import ApiForm, { Field } from "@/components/ApiForm";
import Badge from "@/components/Badge";
import { inr, km, when } from "@/lib/format";
import { inspectionsForVehicle, reviewsForVehicle, InspectionView, ReviewView } from "@/lib/insights";
import { mongoConfigured } from "@/lib/mongo";
import { getVehicle, listBookings, listMaintenance } from "@/lib/queries";

export const dynamic = "force-dynamic";

async function loadDocs(id: number): Promise<{ reviews: ReviewView[]; inspections: InspectionView[]; error?: string }> {
  if (!mongoConfigured()) return { reviews: [], inspections: [], error: "MONGODB_URI is not configured." };
  try {
    const [reviews, inspections] = await Promise.all([reviewsForVehicle(id), inspectionsForVehicle(id)]);
    return { reviews, inspections };
  } catch {
    return { reviews: [], inspections: [], error: "MongoDB is not reachable." };
  }
}

export default async function VehicleDetail({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const vehicle = await getVehicle(id);
  if (!vehicle) notFound();

  const [maintenance, allBookings, docs] = await Promise.all([listMaintenance(id), listBookings(), loadDocs(id)]);
  const bookings = allBookings.filter((b) => b.license_plate === vehicle.license_plate);
  const completed = (await Promise.resolve(bookings)).filter((b) => b.booking_status === "Completed");
  const avg = docs.reviews.length ? docs.reviews.reduce((s, r) => s + r.rating, 0) / docs.reviews.length : null;

  return (
    <>
      <p><Link href="/vehicles">&larr; All vehicles</Link></p>
      <h1>{vehicle.make} {vehicle.model} <Badge status={vehicle.status} /></h1>
      <p className="sub">
        {vehicle.license_plate} &middot; VIN {vehicle.vin} &middot; {vehicle.manufacture_year} &middot; {vehicle.category_name} ({inr(vehicle.base_rate_per_day)}/day)
        &middot; {vehicle.branch_name}, {vehicle.city} &middot; {km(vehicle.current_mileage)} mi
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {vehicle.status !== "Rented" && vehicle.status !== "In_Maintenance" && (
          <ActionButton endpoint={`/api/vehicles/${id}`} method="PATCH" body={{ status: "In_Maintenance" }} label="Send to workshop" />
        )}
        {vehicle.status === "In_Maintenance" && (
          <ActionButton endpoint={`/api/vehicles/${id}`} method="PATCH" body={{ status: "Available" }} label="Mark available" />
        )}
        {vehicle.status !== "Rented" && vehicle.status !== "Decommissioned" && (
          <ActionButton endpoint={`/api/vehicles/${id}`} method="PATCH" body={{ status: "Decommissioned" }} label="Decommission" variant="danger" confirmText="Decommission this vehicle? It can no longer be booked." />
        )}
        {vehicle.status === "Decommissioned" && (
          <ActionButton endpoint={`/api/vehicles/${id}`} method="PATCH" body={{ status: "Available" }} label="Reinstate" />
        )}
      </div>

      <h2>Maintenance history</h2>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Date</th><th>Service</th><th className="num">Mileage</th><th className="num">Cost</th><th>Notes</th></tr></thead>
          <tbody>
            {maintenance.map((m) => (
              <tr key={m.maintenance_id}><td>{m.service_date}</td><td>{m.service_type}</td><td className="num">{km(m.mileage_at_service)}</td><td className="num">{inr(m.cost)}</td><td>{m.notes}</td></tr>
            ))}
            {maintenance.length === 0 && <tr><td colSpan={5} className="muted">No services logged.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2>Booking history</h2>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>#</th><th>Customer</th><th>From</th><th>To</th><th>Status</th><th className="num">Late fee</th><th className="num">Total</th></tr></thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.booking_id}><td>{b.booking_id}</td><td>{b.customer_name}</td><td>{when(b.start_date)}</td><td>{when(b.end_date)}</td><td><Badge status={b.booking_status} /></td><td className="num">{inr(b.late_fee)}</td><td className="num">{inr(b.total_amount)}</td></tr>
            ))}
            {bookings.length === 0 && <tr><td colSpan={7} className="muted">No bookings yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2>Inspections and reviews <span className="muted" style={{ fontWeight: 400 }}>(MongoDB documents)</span></h2>
      {docs.error && <p className="msg-err">{docs.error} Inspection and review data is unavailable.</p>}
      {!docs.error && (
        <>
          <p className="sub">{avg ? `Average rating ${avg.toFixed(1)} / 5 from ${docs.reviews.length} review(s).` : "No reviews yet."}</p>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>When</th><th>Booking</th><th>Type</th><th className="num">Odometer</th><th>Fuel / battery</th><th>Damages</th></tr></thead>
              <tbody>
                {docs.inspections.map((i, n) => (
                  <tr key={n}>
                    <td>{i.inspected_at}</td><td>{i.booking_id}</td><td>{i.type}</td><td className="num">{km(i.odometer)}</td>
                    <td>{i.fuel_level ?? (i.battery_percent != null ? `${i.battery_percent}%` : "-")}</td>
                    <td>{i.damages.length ? i.damages.map((d) => `${d.part} (${d.severity})${d.note ? ": " + d.note : ""}`).join("; ") : "None"}</td>
                  </tr>
                ))}
                {docs.inspections.length === 0 && <tr><td colSpan={6} className="muted">No inspections recorded.</td></tr>}
              </tbody>
            </table>
          </div>

          <h2>Reviews</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {docs.reviews.map((r) => (
              <div className="card" key={r.booking_id}>
                <strong>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</strong> <span className="muted">booking {r.booking_id} &middot; {r.created_at}</span>
                <p>{r.comment}</p>
                {r.tags.map((t) => <span key={t} className="badge" style={{ marginRight: 4 }}>{t}</span>)}
              </div>
            ))}
          </div>

          <h2>Record an inspection</h2>
          <div className="card">
            <ApiForm endpoint={`/api/vehicles/${id}/inspections`} submitLabel="Save inspection">
              <Field label="Booking">
                <select className="input" name="booking_id" required>{bookings.map((b) => <option key={b.booking_id} value={b.booking_id}>#{b.booking_id} - {b.customer_name}</option>)}</select>
              </Field>
              <Field label="Type">
                <select className="input" name="type"><option value="pickup">Pickup</option><option value="return">Return</option></select>
              </Field>
              <Field label="Odometer"><input className="input" type="number" name="odometer" required min={0} defaultValue={vehicle.current_mileage} /></Field>
              <Field label="Fuel level (e.g. 3/4)"><input className="input" name="fuel_level" maxLength={10} /></Field>
              <Field label="Damaged part (optional)"><input className="input" name="damage_part" /></Field>
              <Field label="Severity">
                <select className="input" name="damage_severity"><option value="">-</option><option>minor</option><option>moderate</option><option>major</option></select>
              </Field>
              <Field label="Damage note"><input className="input" name="damage_note" /></Field>
            </ApiForm>
          </div>

          <h2>Add a review</h2>
          <div className="card">
            {completed.length === 0 ? <p className="muted">Reviews can be added once a booking of this vehicle is completed.</p> : (
              <ApiForm endpoint={`/api/vehicles/${id}/reviews`} submitLabel="Save review">
                <Field label="Completed booking">
                  <select className="input" name="booking_id" required>{completed.map((b) => <option key={b.booking_id} value={b.booking_id}>#{b.booking_id} - {b.customer_name}</option>)}</select>
                </Field>
                <Field label="Rating (1-5)"><input className="input" type="number" name="rating" min={1} max={5} required /></Field>
                <Field label="Comment"><input className="input" name="comment" required minLength={3} maxLength={500} /></Field>
                <Field label="Tags (comma separated)"><input className="input" name="tags" /></Field>
              </ApiForm>
            )}
          </div>
        </>
      )}
    </>
  );
}
