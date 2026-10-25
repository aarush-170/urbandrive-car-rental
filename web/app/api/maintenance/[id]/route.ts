import { execute } from "@/lib/db";
import { errorResponse, HttpError } from "@/lib/errors";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const res = await execute("DELETE FROM Maintenance_Record WHERE maintenance_id = ?", [Number((await ctx.params).id)]);
    if (res.affectedRows === 0) throw new HttpError(404, "Maintenance record not found.");
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
