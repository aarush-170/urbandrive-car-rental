import { requireApi, STAFF } from "@/lib/auth";
import { execute } from "@/lib/db";
import { errorResponse, readJson } from "@/lib/errors";
import { listMaintenance } from "@/lib/queries";
import { maintenanceSchema } from "@/lib/validation";

export async function GET(req: Request) {
  try {
    await requireApi(STAFF);
    const v = new URL(req.url).searchParams.get("vehicle");
    return Response.json(await listMaintenance(v && /^\d+$/.test(v) ? Number(v) : undefined));
  } catch (e) {
    return errorResponse(e);
  }
}

// The trg_maintenance_before_insert trigger rejects a mileage_at_service above the vehicle's mileage.
export async function POST(req: Request) {
  try {
    await requireApi(STAFF);
    const m = maintenanceSchema.parse(await readJson(req));
    const res = await execute(
      "INSERT INTO Maintenance_Record (vehicle_id, service_date, service_type, mileage_at_service, cost, notes) VALUES (?, ?, ?, ?, ?, ?)",
      [m.vehicle_id, m.service_date, m.service_type, m.mileage_at_service, m.cost, m.notes || null],
    );
    return Response.json({ maintenance_id: res.insertId }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
