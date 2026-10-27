import { ADMIN, requireApi } from "@/lib/auth";
import { execute, one } from "@/lib/db";
import { errorResponse, HttpError, readJson } from "@/lib/errors";
import { availableVehicles, listVehicles } from "@/lib/queries";
import { vehicleSchema } from "@/lib/validation";

const num = (v: string | null) => (v && /^\d+$/.test(v) ? Number(v) : undefined);

// GET /api/vehicles?q=&branch=&category=&status=            -> fleet list (FULLTEXT search on make/model)
// GET /api/vehicles?available=1&start=...&end=...           -> inventory availability for a date range
export async function GET(req: Request) {
  try {
    await requireApi();
    const p = new URL(req.url).searchParams;
    if (p.get("available")) {
      const start = p.get("start");
      const end = p.get("end");
      if (!start || !end || end <= start) throw new HttpError(400, "start and end are required and end must be after start.");
      return Response.json(await availableVehicles({
        start: start.replace("T", " "), end: end.replace("T", " "), branch: num(p.get("branch")), category: num(p.get("category")),
      }));
    }
    return Response.json(await listVehicles({
      q: p.get("q") ?? undefined, branch: num(p.get("branch")), category: num(p.get("category")), status: p.get("status") || undefined,
    }));
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireApi(ADMIN);
    const v = vehicleSchema.parse(await readJson(req));
    const res = await execute(
      `INSERT INTO Vehicle (vin, license_plate, make, model, manufacture_year, current_mileage, status, category_id, current_branch_id)
       VALUES (?, ?, ?, ?, ?, ?, 'Available', ?, ?)`,
      [v.vin.toUpperCase(), v.license_plate.toUpperCase(), v.make, v.model, v.manufacture_year, v.current_mileage, v.category_id, v.current_branch_id],
    );
    return Response.json(await one("SELECT * FROM Vehicle WHERE vehicle_id = ?", [res.insertId]), { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
