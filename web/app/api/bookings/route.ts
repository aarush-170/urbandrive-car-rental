import { getPool } from "@/lib/db";
import { errorResponse, readJson } from "@/lib/errors";
import { listBookings } from "@/lib/queries";
import { bookingSchema } from "@/lib/validation";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";

export async function GET(req: Request) {
  try {
    const status = new URL(req.url).searchParams.get("status") || undefined;
    return Response.json(await listBookings(status));
  } catch (e) {
    return errorResponse(e);
  }
}

// POST: runs the sp_create_booking stored procedure (transaction: row lock, overlap + licence checks
// via trigger, booking insert, 30% advance payment).
export async function POST(req: Request) {
  let conn: PoolConnection | undefined;
  try {
    const b = bookingSchema.parse(await readJson(req));
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
