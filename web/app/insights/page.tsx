import { ADMIN, requirePage } from "@/lib/auth";
import { param } from "@/lib/format";
import { damageBySeverity, mostDamagedVehicles, popularTags, ratingByCategory, searchReviews } from "@/lib/insights";
import { mongoConfigured } from "@/lib/mongo";
import { inr } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InsightsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePage(ADMIN);
  const q = param((await searchParams).q);

  if (!mongoConfigured()) {
    return (
      <>
        <h1>Insights</h1>
        <p className="msg-err">MONGODB_URI is not configured. Add it to web/.env.local and seed the data with mongodb/seed.js.</p>
      </>
    );
  }

  let data;
  try {
    data = await Promise.all([
      ratingByCategory(), damageBySeverity(), mostDamagedVehicles(), popularTags(), q ? searchReviews(q) : Promise.resolve([]),
    ]);
  } catch {
    data = null;
  }
  if (!data) {
    return (
      <>
        <h1>Insights</h1>
        <p className="msg-err">MongoDB is not reachable. Check MONGODB_URI and that the server is running.</p>
      </>
    );
  }
  const [ratings, damage, damaged, tags, hits] = data;
  {
    return (
      <>
        <h1>Insights</h1>
        <p className="sub">Vehicle inspections and customer reviews are semi-structured documents stored in MongoDB and analysed with aggregation pipelines.</p>

        <h2>Average rating by category</h2>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Category</th><th className="num">Avg rating</th><th className="num">Reviews</th><th style={{ width: "40%" }}></th></tr></thead>
            <tbody>
              {ratings.map((r) => (
                <tr key={r.category}><td>{r.category}</td><td className="num">{r.avg_rating.toFixed(2)}</td><td className="num">{r.reviews}</td>
                  <td><div className="bar" style={{ width: `${(r.avg_rating / 5) * 100}%` }} /></td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          <div>
            <h2>Damage reports by severity</h2>
            <div className="tbl-wrap"><table className="tbl">
              <thead><tr><th>Severity</th><th className="num">Incidents</th><th className="num">Estimated cost</th></tr></thead>
              <tbody>
                {damage.map((d) => <tr key={d.severity}><td>{d.severity}</td><td className="num">{d.incidents}</td><td className="num">{inr(d.estimated_cost)}</td></tr>)}
                {damage.length === 0 && <tr><td colSpan={3} className="muted">No damage recorded.</td></tr>}
              </tbody>
            </table></div>
          </div>
          <div>
            <h2>Most damaged vehicles</h2>
            <div className="tbl-wrap"><table className="tbl">
              <thead><tr><th>Vehicle</th><th className="num">Incidents</th></tr></thead>
              <tbody>
                {damaged.map((d) => <tr key={d.vehicle}><td>{d.vehicle}</td><td className="num">{d.incidents}</td></tr>)}
                {damaged.length === 0 && <tr><td colSpan={2} className="muted">No damage recorded.</td></tr>}
              </tbody>
            </table></div>
          </div>
        </div>

        <h2>Popular review tags</h2>
        <div className="card">{tags.map((t) => <span className="badge" key={t.tag} style={{ marginRight: 6 }}>{t.tag} &times; {t.count}</span>)}</div>

        <h2>Search reviews</h2>
        <form method="get" className="card" style={{ display: "flex", gap: 8 }}>
          <input className="input" name="q" defaultValue={q} placeholder="e.g. battery, family, comfortable" />
          <button className="btn">Search</button>
        </form>
        {q && (
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            {hits.map((h) => (
              <div className="card" key={h.booking_id}>
                <strong>{"★".repeat(h.rating)}{"☆".repeat(5 - h.rating)}</strong>{" "}
                <Link href={`/vehicles/${h.vehicle_id}`}>vehicle #{h.vehicle_id}</Link> <span className="muted">relevance {h.score}</span>
                <p>{h.comment}</p>
              </div>
            ))}
            {hits.length === 0 && <p className="muted">No reviews match &quot;{q}&quot;.</p>}
          </div>
        )}
      </>
    );
  }
}
