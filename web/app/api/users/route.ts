import bcrypt from "bcryptjs";
import { ADMIN, requireApi } from "@/lib/auth";
import { execute, query } from "@/lib/db";
import { errorResponse, readJson } from "@/lib/errors";
import { userSchema } from "@/lib/validation";

// password_hash is never selected, so it cannot leak through the list.
export async function GET() {
  try {
    await requireApi(ADMIN);
    return Response.json(await query(
      `SELECT u.user_id, u.username, u.email, u.role, u.customer_id, u.branch_id, u.created_at,
              CONCAT(c.first_name, ' ', c.last_name) AS customer_name, b.branch_name
         FROM User_Account u
         LEFT JOIN Customer c ON c.customer_id = u.customer_id
         LEFT JOIN Branch b ON b.branch_id = u.branch_id
        ORDER BY u.user_id`,
    ));
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireApi(ADMIN);
    const u = userSchema.parse(await readJson(req));
    const hash = await bcrypt.hash(u.password, 10);
    // only the link that belongs to the role is stored (chk_user_link allows an Admin with none)
    const customerId = u.role === "Customer" ? u.customer_id : null;
    const branchId = u.role === "Branch_Manager" ? u.branch_id : null;
    const res = await execute(
      "INSERT INTO User_Account (username, email, password_hash, role, customer_id, branch_id) VALUES (?, ?, ?, ?, ?, ?)",
      [u.username, u.email.toLowerCase(), hash, u.role, customerId, branchId],
    );
    return Response.json({ user_id: res.insertId, username: u.username, role: u.role }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
