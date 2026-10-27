import { requireApi, STAFF } from "@/lib/auth";
import { execute, one } from "@/lib/db";
import { errorResponse, readJson } from "@/lib/errors";
import { listCustomers } from "@/lib/queries";
import { customerSchema } from "@/lib/validation";

export async function GET(req: Request) {
  try {
    await requireApi(STAFF);
    return Response.json(await listCustomers(new URL(req.url).searchParams.get("q") ?? undefined));
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireApi(STAFF);
    const c = customerSchema.parse(await readJson(req));
    const res = await execute(
      "INSERT INTO Customer (first_name, last_name, email, phone, license_number, license_expiry_date) VALUES (?, ?, ?, ?, ?, ?)",
      [c.first_name, c.last_name, c.email.toLowerCase(), c.phone, c.license_number.toUpperCase(), c.license_expiry_date],
    );
    return Response.json(await one("SELECT * FROM Customer WHERE customer_id = ?", [res.insertId]), { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
