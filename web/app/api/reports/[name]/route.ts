import { ADMIN, requireApi, STAFF } from "@/lib/auth";
import { errorResponse, HttpError } from "@/lib/errors";
import { branchAvailability, customerHistory, maintenanceDue, revenueByCategory, revenueQuarters } from "@/lib/queries";

// GET /api/reports/revenue?year=2026&quarter=3 | maintenance-due?miles=10000 | availability | customer-history?customer=1
export async function GET(req: Request, ctx: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await ctx.params;
    await requireApi(name === "revenue" ? ADMIN : name === "availability" ? undefined : STAFF);
    const p = new URL(req.url).searchParams;
    switch (name) {
      case "revenue": {
        let yr = Number(p.get("year"));
        let qtr = Number(p.get("quarter"));
        if (!yr || !qtr) {
          const latest = (await revenueQuarters())[0];
          if (!latest) return Response.json([]);
          ({ yr, qtr } = latest);
        }
        return Response.json({ year: yr, quarter: qtr, rows: await revenueByCategory({ yr, qtr }) });
      }
      case "maintenance-due":
        return Response.json(await maintenanceDue(Number(p.get("miles") ?? 10000) || 10000));
      case "availability":
        return Response.json(await branchAvailability());
      case "customer-history": {
        const id = Number(p.get("customer"));
        if (!id) throw new HttpError(400, "customer is required.");
        return Response.json(await customerHistory(id));
      }
      default:
        throw new HttpError(404, "Unknown report.");
    }
  } catch (e) {
    return errorResponse(e);
  }
}
