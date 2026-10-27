import { requireApi, STAFF } from "@/lib/auth";
import { execute } from "@/lib/db";
import { errorResponse, HttpError, readJson } from "@/lib/errors";
import { vehicleStatusSchema } from "@/lib/validation";

// PATCH /api/vehicles/:id  { status } -> move a vehicle in/out of the workshop or decommission it.
// A Rented vehicle can only change through its booking (return/cancel), never directly.
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireApi(STAFF);
    const { id } = await ctx.params;
    const { status } = vehicleStatusSchema.parse(await readJson(req));
    const res = await execute("UPDATE Vehicle SET status = ? WHERE vehicle_id = ? AND status <> 'Rented'", [status, Number(id)]);
    if (res.affectedRows === 0) throw new HttpError(409, "Vehicle not found, unchanged, or currently rented.");
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
