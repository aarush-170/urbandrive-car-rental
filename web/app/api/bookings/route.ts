import { requireApi } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { errorResponse, readJson } from "@/lib/errors";
import { listBookings } from "@/lib/queries";
import { bookingSchema } from "@/lib/validation";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";

export async function GET(req: Request) {
  try {
    const s = await requireApi();
    const status = new URL(req.url).searchParams.get("status") || undefined;
    // a customer only ever sees their own bookings
    return Response.json(await listBookings(status, s.role === "Customer" ? s.customerId ?? -1 : undefined));
  } catch (e) {
    return errorResponse(e);
  }
}

// POST: runs the sp_create_booking stored procedure (transaction: row lock, overlap + licence checks
// via trigger, booking insert, 30% advance payment).
export async function POST(req: Request) {
  let conn: PoolConnection | undefined;
  try {
    const s = await requireApi();
    const raw = (await readJson(req)) as Record<string, unknown>;
    // a customer can only book for themselves, whatever customer_id the request claims
    if (s.role === "Customer") raw.customer_id = s.customerId;
    const b = bookingSchema.parse(raw);
    conn = await getPool().getConnection();
    await conn.query("CALL sp_create_booking(?, ?, ?, ?, ?, ?, ?, @new_booking_id)", [
      b.customer_id, b.vehicle_id, b.pickup_branch_id, b.dropoff_branch_id, b.start_date, b.end_date, b.payment_method,
    ]);
    const [rows] = await conn.query<RowDataPacket[]>("SELECT @new_booking_id AS id");
    return Response.json({ booking_id: rows[0].id }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  } finally {
    conn?.release();
  }
}
