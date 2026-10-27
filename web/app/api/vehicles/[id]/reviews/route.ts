import { requireApi } from "@/lib/auth";
import { one } from "@/lib/db";
import { errorResponse, HttpError, readJson } from "@/lib/errors";
import { reviewsForVehicle } from "@/lib/insights";
import { getMongoDb, Review } from "@/lib/mongo";
import { reviewSchema } from "@/lib/validation";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireApi();
    return Response.json(await reviewsForVehicle(Number((await ctx.params).id)));
  } catch (e) {
    return errorResponse(e);
  }
}

// POST: a customer review for a completed booking of this vehicle (one review per booking).
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const s = await requireApi(["Customer", "Admin"]);
    const vehicleId = Number((await ctx.params).id);
    const b = reviewSchema.parse(await readJson(req));
    const booking = await one<{ customer_id: number; category_id: number }>(
      `SELECT b.customer_id, v.category_id FROM Rental_Booking b JOIN Vehicle v ON v.vehicle_id = b.vehicle_id
       WHERE b.booking_id = ? AND b.vehicle_id = ? AND b.booking_status = 'Completed'`,
      [b.booking_id, vehicleId],
    );
    if (!booking) throw new HttpError(400, "Only a completed booking of this vehicle can be reviewed.");
    if (s.role === "Customer" && booking.customer_id !== s.customerId) throw new HttpError(403, "You can only review your own bookings.");
    const col = (await getMongoDb()).collection<Review>("vehicle_reviews");
    if (await col.findOne({ booking_id: b.booking_id })) throw new HttpError(409, "This booking already has a review.");
    await col.insertOne({
      booking_id: b.booking_id,
      vehicle_id: vehicleId,
      customer_id: booking.customer_id,
      category_id: booking.category_id,
      rating: b.rating,
      comment: b.comment,
      tags: b.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 6),
      created_at: new Date(),
    });
    return Response.json({ ok: true }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
