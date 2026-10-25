import Link from "next/link";
import ApiForm, { Field } from "@/components/ApiForm";
import { inr, param } from "@/lib/format";
import { listCustomers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = param((await searchParams).q);
  const customers = await listCustomers(q);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <h1>Customers</h1>
      <p className="sub">Renter profiles and driving-licence validity.</p>
      <form method="get" className="card" style={{ display: "flex", gap: 8 }}>
        <input className="input" name="q" defaultValue={q} placeholder="Search name, email or licence number" />
        <button className="btn">Search</button>
      </form>

      <h2>{customers.length} customer(s)</h2>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Licence</th><th>Licence expiry</th><th className="num">Bookings</th><th className="num">Spent</th></tr></thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.customer_id}>
                <td><Link href={`/customers/${c.customer_id}`}>{c.first_name} {c.last_name}</Link></td>
                <td>{c.email}</td><td>{c.phone}</td><td>{c.license_number}</td>
                <td>{c.license_expiry_date} {c.license_expiry_date < today && <span className="badge bad">Expired</span>}</td>
                <td className="num">{c.bookings}</td><td className="num">{inr(c.total_spent)}</td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td colSpan={7} className="muted">No customers match.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2>Register a customer</h2>
      <div className="card">
        <ApiForm endpoint="/api/customers" submitLabel="Add customer">
          <Field label="First name"><input className="input" name="first_name" required maxLength={50} /></Field>
          <Field label="Last name"><input className="input" name="last_name" required maxLength={50} /></Field>
          <Field label="Email"><input className="input" type="email" name="email" required /></Field>
          <Field label="Phone (digits)"><input className="input" name="phone" required pattern="[0-9+]{7,15}" /></Field>
          <Field label="Licence number"><input className="input" name="license_number" required maxLength={30} /></Field>
          <Field label="Licence expiry"><input className="input" type="date" name="license_expiry_date" required min={today} /></Field>
        </ApiForm>
      </div>
    </>
  );
}
