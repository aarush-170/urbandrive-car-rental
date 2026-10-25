import { getMongoDb, Inspection, Review } from "./mongo";
import { query } from "./db";

// Plain-object copies so server components can safely render / pass them on.
export interface ReviewView {
  booking_id: number;
  vehicle_id: number;
  rating: number;
  comment: string;
  tags: string[];
  created_at: string;
}
export interface InspectionView {
  booking_id: number;
  type: string;
  inspected_at: string;
  odometer: number;
  fuel_level?: string;
  battery_percent?: number;
  damages: Inspection["damages"];
}

const iso = (d: Date) => new Date(d).toISOString().slice(0, 16).replace("T", " ");

export async function reviewsForVehicle(vehicleId: number): Promise<ReviewView[]> {
  const db = await getMongoDb();
  const docs = await db.collection<Review>("vehicle_reviews").find({ vehicle_id: vehicleId }).sort({ created_at: -1 }).toArray();
  return docs.map((r) => ({ booking_id: r.booking_id, vehicle_id: r.vehicle_id, rating: r.rating, comment: r.comment, tags: r.tags, created_at: iso(r.created_at) }));
}

export async function inspectionsForVehicle(vehicleId: number): Promise<InspectionView[]> {
  const db = await getMongoDb();
  const docs = await db.collection<Inspection>("vehicle_inspections").find({ vehicle_id: vehicleId }).sort({ inspected_at: -1 }).toArray();
  return docs.map((i) => ({
    booking_id: i.booking_id, type: i.type, inspected_at: iso(i.inspected_at), odometer: i.odometer,
    fuel_level: i.fuel_level, battery_percent: i.battery_percent, damages: i.damages ?? [],
  }));
}

// ---- aggregation pipelines ----
export interface CategoryRating {
  category: string;
  avg_rating: number;
  reviews: number;
}
export async function ratingByCategory(): Promise<CategoryRating[]> {
  const db = await getMongoDb();
  const groups = await db.collection<Review>("vehicle_reviews")
    .aggregate<{ _id: number; avg: number; n: number }>([
      { $group: { _id: "$category_id", avg: { $avg: "$rating" }, n: { $sum: 1 } } },
      { $sort: { avg: -1 } },
    ])
    .toArray();
  const names = await query<{ category_id: number; category_name: string }>("SELECT category_id, category_name FROM Vehicle_Category");
  const byId = new Map(names.map((n) => [n.category_id, n.category_name]));
  return groups.map((g) => ({ category: byId.get(g._id) ?? `Category ${g._id}`, avg_rating: Math.round(g.avg * 100) / 100, reviews: g.n }));
}

export interface DamageSummary {
  severity: string;
  incidents: number;
  estimated_cost: number;
}
export async function damageBySeverity(): Promise<DamageSummary[]> {
  const db = await getMongoDb();
  const rows = await db.collection<Inspection>("vehicle_inspections")
    .aggregate<{ _id: string; n: number; cost: number }>([
      { $unwind: "$damages" },
      { $group: { _id: "$damages.severity", n: { $sum: 1 }, cost: { $sum: { $ifNull: ["$damages.estimated_cost", 0] } } } },
      { $sort: { n: -1 } },
    ])
    .toArray();
  return rows.map((r) => ({ severity: r._id, incidents: r.n, estimated_cost: r.cost }));
}

export interface DamagedVehicle {
  vehicle: string;
  incidents: number;
}
export async function mostDamagedVehicles(): Promise<DamagedVehicle[]> {
  const db = await getMongoDb();
  const rows = await db.collection<Inspection>("vehicle_inspections")
    .aggregate<{ _id: number; n: number }>([
      { $unwind: "$damages" },
      { $group: { _id: "$vehicle_id", n: { $sum: 1 } } },
      { $sort: { n: -1 } },
      { $limit: 5 },
    ])
    .toArray();
  if (!rows.length) return [];
  const vs = await query<{ vehicle_id: number; label: string }>(
    "SELECT vehicle_id, CONCAT(make, ' ', model, ' - ', license_plate) AS label FROM Vehicle WHERE vehicle_id IN (?)",
    [rows.map((r) => r._id)],
  );
  const byId = new Map(vs.map((v) => [v.vehicle_id, v.label]));
  return rows.map((r) => ({ vehicle: byId.get(r._id) ?? `Vehicle ${r._id}`, incidents: r.n }));
}

export interface TagCount {
  tag: string;
  count: number;
}
export async function popularTags(): Promise<TagCount[]> {
  const db = await getMongoDb();
  const rows = await db.collection<Review>("vehicle_reviews")
    .aggregate<{ _id: string; n: number }>([{ $unwind: "$tags" }, { $group: { _id: "$tags", n: { $sum: 1 } } }, { $sort: { n: -1, _id: 1 } }, { $limit: 12 }])
    .toArray();
  return rows.map((r) => ({ tag: r._id, count: r.n }));
}

export interface ReviewHit extends ReviewView {
  score: number;
}
// Full-text search over review comments and tags (MongoDB text index).
export async function searchReviews(text: string): Promise<ReviewHit[]> {
  const db = await getMongoDb();
  const docs = await db.collection<Review>("vehicle_reviews")
    .find({ $text: { $search: text } }, { projection: { score: { $meta: "textScore" } } })
    .sort({ score: { $meta: "textScore" } })
    .limit(10)
    .toArray();
  return docs.map((r) => ({
    booking_id: r.booking_id, vehicle_id: r.vehicle_id, rating: r.rating, comment: r.comment, tags: r.tags,
    created_at: iso(r.created_at), score: Math.round(((r as unknown as { score: number }).score ?? 0) * 100) / 100,
  }));
}
