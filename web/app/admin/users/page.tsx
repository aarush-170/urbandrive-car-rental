import ApiForm, { Field } from "@/components/ApiForm";
import { ADMIN, requirePage } from "@/lib/auth";
import { query } from "@/lib/db";
import { branchOptions, customerOptions } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface UserRow {
  user_id: number;
  username: string;
  email: string;
  role: string;
  customer_name: string | null;
  branch_name: string | null;
  created_at: string;
}

export default async function UsersPage() {
  await requirePage(ADMIN);
  const [users, customers, branches] = await Promise.all([
    query<UserRow>(
      `SELECT u.user_id, u.username, u.email, u.role, u.created_at,
              CONCAT(c.first_name, ' ', c.last_name) AS customer_name, b.branch_name
         FROM User_Account u
         LEFT JOIN Customer c ON c.customer_id = u.customer_id
         LEFT JOIN Branch b ON b.branch_id = u.branch_id
        ORDER BY u.user_id`,
    ),
    customerOptions(),
    branchOptions(),
  ]);

  return (
    <>
      <h1>User accounts</h1>
      <p className="sub">Create logins and see who has access. Passwords are stored as bcrypt hashes and are never shown.</p>

      <h2>Create a user</h2>
      <div className="card">
        <ApiForm endpoint="/api/users" submitLabel="Create user">
          <Field label="Username"><input className="input" name="username" required minLength={3} maxLength={50} /></Field>
          <Field label="Email"><input className="input" type="email" name="email" required maxLength={100} /></Field>
          <Field label="Password (min 8)"><input className="input" type="password" name="password" required minLength={8} maxLength={72} autoComplete="new-password" /></Field>
          <Field label="Role">
            <select className="input" name="role" required defaultValue="Customer">
              <option value="Admin">Admin</option>
              <option value="Branch_Manager">Branch Manager</option>
              <option value="Customer">Customer</option>
            </select>
          </Field>
          <Field label="Customer (for Customer role)">
            <select className="input" name="customer_id" defaultValue="">
              <option value="">-</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Branch (for Branch Manager role)">
            <select className="input" name="branch_id" defaultValue="">
              <option value="">-</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </Field>
        </ApiForm>
      </div>

      <h2>All users ({users.length})</h2>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Linked to</th><th>Created</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id}>
                <td>{u.username}</td><td>{u.email}</td><td>{u.role.replace("_", " ")}</td>
                <td>{u.customer_name ?? u.branch_name ?? <span className="muted">all</span>}</td>
                <td>{u.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
