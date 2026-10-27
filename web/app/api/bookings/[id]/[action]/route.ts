import { requireApi } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { errorResponse, HttpError, readJson } from "@/lib/errors";
import { returnSchema } from "@/lib/validation";

// POST /api/bookings/:id/start | return | cancel  -> sp_start_rental / sp_return_vehicle / sp_cancel_booking
export async function POST(req: Request, ctx: { params: Promise<{ id: string; action: string }> }) {
  try {
    const s = await requireApi();
    const { id, action } = await ctx.params;
    const bookingId = Number(id);
    if (!Number.isInteger(bookingId) || bookingId <= 0) throw new HttpError(400, "Invalid booking id.");
    if (s.role === "Customer") {
      // customers may only cancel their own bookings; start and return are counter operations for staff
      const own = await one("SELECT booking_id FROM Rental_Booking WHERE booking_id = ? AND customer_id = ?", [bookingId, s.customerId]);
      if (action !== "cancel" || !own) throw new HttpError(403, "Your role is not allowed to do this.");
    }

    if (action === "start") {
      await query("CALL sp_start_rental(?)", [bookingId]);
    } else if (action === "cancel") {
      await query("CALL sp_cancel_booking(?)", [bookingId]);
    } else if (action === "return") {
      const b = returnSchema.parse(await readJson(req));
      await query("CALL sp_return_vehicle(?, ?, ?, ?)", [bookingId, b.return_mileage, b.actual_return_date, b.payment_method]);
    } else {
      throw new HttpError(404, "Unknown action.");
    }
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
