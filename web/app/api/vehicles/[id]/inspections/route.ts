import { one } from "@/lib/db";
import { errorResponse, HttpError, readJson } from "@/lib/errors";
import { inspectionsForVehicle } from "@/lib/insights";
import { getMongoDb, Inspection } from "@/lib/mongo";
import { inspectionSchema } from "@/lib/validation";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    return Response.json(await inspectionsForVehicle(Number((await ctx.params).id)));
  } catch (e) {
    return errorResponse(e);
  }
}

// POST: store a pickup/return inspection (flexible document: damages list, fuel or battery level).
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const vehicleId = Number((await ctx.params).id);
    const b = inspectionSchema.parse(await readJson(req));
    const booking = await one("SELECT booking_id FROM Rental_Booking WHERE booking_id = ? AND vehicle_id = ?", [b.booking_id, vehicleId]);
    if (!booking) throw new HttpError(400, "That booking does not belong to this vehicle.");
    const doc: Inspection = {
      booking_id: b.booking_id,
      vehicle_id: vehicleId,
      type: b.type,
      inspected_at: new Date(),
      odometer: b.odometer,
      damages: b.damage_part && b.damage_severity ? [{ part: b.damage_part, severity: b.damage_severity, note: b.damage_note || undefined }] : [],
      photos: [],
    };
    if (b.fuel_level) doc.fuel_level = b.fuel_level;
    const db = await getMongoDb();
    await db.collection<Inspection>("vehicle_inspections").insertOne(doc);
    return Response.json({ ok: true }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
