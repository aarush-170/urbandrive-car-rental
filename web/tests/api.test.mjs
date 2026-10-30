// End-to-end API tests. Start the app first (npm run dev), then run: npm test
// Uses the seeded accounts (password UrbanDrive@123). Bookings it creates are cancelled again.
import test from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PW = "UrbanDrive@123";

async function api(path, { method = "GET", body, cookie } = {}) {
  const res = await fetch(BASE + path, {
    method,
    redirect: "manual",
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* HTML page or redirect */ }
  return { status: res.status, json, setCookie: res.headers.get("set-cookie") };
}

async function login(username, password = PW) {
  const r = await api("/api/auth/login", { method: "POST", body: { username, password } });
  return { ...r, cookie: r.setCookie ? r.setCookie.split(";")[0] : undefined };
}

let admin, manager, customer;
test.before(async () => {
  admin = await login("admin");
  manager = await login("mgr_downtown");
  customer = await login("cust_rohan"); // customer_id 1
});

test("TC01 login succeeds with a valid password and returns the role", () => {
  assert.equal(admin.status, 200);
  assert.equal(admin.json.role, "Admin");
  assert.equal(customer.json.role, "Customer");
});

test("TC02 login fails with a wrong password or unknown user (same message)", async () => {
  const a = await login("admin", "wrong-password");
  const b = await login("nobody");
  assert.equal(a.status, 401);
  assert.equal(b.status, 401);
  assert.equal(a.json.error, b.json.error);
});

test("TC03 session cookie is HttpOnly and the password hash is never returned", () => {
  assert.match(admin.setCookie, /HttpOnly/i);
  assert.ok(!JSON.stringify(admin.json).includes("$2"));
});

test("TC04 API without a session is rejected with 401, pages redirect to /login", async () => {
  assert.equal((await api("/api/vehicles")).status, 401);
  const page = await api("/bookings");
  assert.equal(page.status, 307);
});

test("TC05 forged session cookie is rejected", async () => {
  const r = await api("/api/vehicles", { cookie: "ud_session=eyJhbGciOiJIUzI1NiJ9.e30.invalid" });
  assert.equal(r.status, 401);
});

test("TC06 role matrix: customers cannot reach staff or admin resources", async () => {
  for (const p of ["/api/customers", "/api/maintenance", "/api/reports/revenue", "/api/reports/maintenance-due"]) {
    assert.equal((await api(p, { cookie: customer.cookie })).status, 403, p);
  }
  assert.equal((await api("/reports", { cookie: customer.cookie })).status, 307);
});

test("TC07 role matrix: branch manager can run staff operations but not revenue reports", async () => {
  assert.equal((await api("/api/customers", { cookie: manager.cookie })).status, 200);
  assert.equal((await api("/api/maintenance", { cookie: manager.cookie })).status, 200);
  assert.equal((await api("/api/reports/revenue", { cookie: manager.cookie })).status, 403);
  assert.equal((await api("/api/maintenance/999999", { method: "DELETE", cookie: manager.cookie })).status, 403);
});

test("TC08 admin can read the revenue report (GROUP BY on a view)", async () => {
  const r = await api("/api/reports/revenue", { cookie: admin.cookie });
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.json.rows));
});

test("TC09 a customer sees only their own bookings; admin sees all", async () => {
  const mine = await api("/api/bookings", { cookie: customer.cookie });
  const all = await api("/api/bookings", { cookie: admin.cookie });
  assert.ok(mine.json.length > 0 && mine.json.length < all.json.length);
  assert.ok(mine.json.every((b) => b.customer_name === "Rohan Mehta"));
});

test("TC10 only admins can add vehicles; customers cannot change vehicle status", async () => {
  const v = { vin: "TESTVIN0000000001", license_plate: "KA00TEST1", make: "T", model: "T", manufacture_year: 2024, current_mileage: 0, category_id: 1, current_branch_id: 1 };
  assert.equal((await api("/api/vehicles", { method: "POST", body: v, cookie: manager.cookie })).status, 403);
  assert.equal((await api("/api/vehicles/1", { method: "PATCH", body: { status: "Decommissioned" }, cookie: customer.cookie })).status, 403);
});

test("TC11 input validation: bad phone number and short VIN are rejected (400)", async () => {
  const c = await api("/api/customers", {
    method: "POST", cookie: admin.cookie,
    body: { first_name: "A", last_name: "B", email: "a@b.co", phone: "12ab", license_number: "KA0120250001", license_expiry_date: "2031-01-01" },
  });
  assert.equal(c.status, 400);
  const v = await api("/api/vehicles", { method: "POST", cookie: admin.cookie, body: { vin: "SHORT", license_plate: "X", make: "a", model: "b", manufacture_year: 2024, current_mileage: 0, category_id: 1, current_branch_id: 1 } });
  assert.equal(v.status, 400);
});

test("TC12 trigger: maintenance mileage above the vehicle's mileage is rejected (409)", async () => {
  const r = await api("/api/maintenance", {
    method: "POST", cookie: admin.cookie,
    body: { vehicle_id: 1, service_date: "2026-01-01", service_type: "Oil change", mileage_at_service: 9999999, cost: 100 },
  });
  assert.equal(r.status, 409);
});

test("TC13 transaction + trigger: booking, double booking rejected, customer cancel", async () => {
  const booking = { vehicle_id: 3, pickup_branch_id: 2, dropoff_branch_id: 2, start_date: "2027-05-01T10:00", end_date: "2027-05-03T10:00", payment_method: "UPI" };
  // customer_id in the body is ignored: the server books for the signed-in customer
  const first = await api("/api/bookings", { method: "POST", cookie: customer.cookie, body: { ...booking, customer_id: 2 } });
  assert.equal(first.status, 201, JSON.stringify(first.json));
  const id = first.json.booking_id;

  const mine = await api("/api/bookings", { cookie: customer.cookie });
  const created = mine.json.find((b) => b.booking_id === id);
  assert.ok(created, "booking is attributed to the signed-in customer");
  assert.equal(created.paid > 0, true, "30% advance payment recorded in the same transaction");

  const clash = await api("/api/bookings", { method: "POST", cookie: customer.cookie, body: { ...booking, start_date: "2027-05-02T10:00", end_date: "2027-05-04T10:00" } });
  assert.equal(clash.status, 409);
  assert.match(clash.json.error, /already booked/i);

  assert.equal((await api(`/api/bookings/${id}/start`, { method: "POST", cookie: customer.cookie })).status, 403, "customers cannot start rentals");
  assert.equal((await api(`/api/bookings/${id}/cancel`, { method: "POST", cookie: customer.cookie })).status, 200);
});

test("TC13b a booking that starts in the past is rejected (400)", async () => {
  const r = await api("/api/bookings", { method: "POST", cookie: customer.cookie, body: { vehicle_id: 3, pickup_branch_id: 2, dropoff_branch_id: 2, start_date: "2020-01-01T10:00", end_date: "2020-01-02T10:00", payment_method: "UPI" } });
  assert.equal(r.status, 400);
  assert.match(r.json.error, /past/i);
});

test("TC14 a customer cannot cancel someone else's booking", async () => {
  const all = await api("/api/bookings?status=Confirmed", { cookie: admin.cookie });
  const other = all.json.find((b) => b.customer_name !== "Rohan Mehta");
  assert.ok(other);
  assert.equal((await api(`/api/bookings/${other.booking_id}/cancel`, { method: "POST", cookie: customer.cookie })).status, 403);
});

test("TC15 vehicle availability search for a date range (JOIN + subquery)", async () => {
  const r = await api("/api/vehicles?available=1&start=2031-06-01T10:00&end=2031-06-03T10:00", { cookie: customer.cookie });
  assert.equal(r.status, 200);
  assert.ok(r.json.length > 0);
  const bad = await api("/api/vehicles?available=1&start=2031-06-03T10:00&end=2031-06-01T10:00", { cookie: customer.cookie });
  assert.equal(bad.status, 400);
});

test("TC16 MongoDB reviews: only completed bookings of the vehicle can be reviewed", async () => {
  const r = await api("/api/vehicles/1/reviews", { method: "POST", cookie: customer.cookie, body: { booking_id: 999999, rating: 5, comment: "great car", tags: "clean" } });
  assert.equal(r.status, 400);
  const list = await api("/api/vehicles/1/reviews", { cookie: customer.cookie });
  assert.equal(list.status, 200);
  assert.ok(Array.isArray(list.json));
});

test("TC17 logout clears the session cookie", async () => {
  const s = await login("mgr_mumbai");
  const out = await api("/api/auth/logout", { method: "POST", cookie: s.cookie });
  assert.equal(out.status, 200);
  assert.match(out.setCookie, /ud_session=;|Max-Age=0|Expires=Thu, 01 Jan 1970/i);
});

// ---- admin user management ----
// Each run creates users with a unique name; there is no delete endpoint, so they stay in User_Account.
const stamp = Date.now();
const newUser = (suffix, extra = {}) => ({
  username: `t_${suffix}_${stamp}`, email: `t_${suffix}_${stamp}@urbandrive.example`,
  password: "Sup3rSecret!", role: "Branch_Manager", branch_id: 1, ...extra,
});

test("TC18 admin creates a user; the new account can log in and the hash is never exposed", async () => {
  const u = newUser("ok");
  const r = await api("/api/users", { method: "POST", body: u, cookie: admin.cookie });
  assert.equal(r.status, 201);
  assert.ok(!JSON.stringify(r.json).includes("$2"));
  const again = await login(u.username, u.password);
  assert.equal(again.status, 200);
  assert.equal(again.json.role, "Branch_Manager");
  const list = await api("/api/users", { cookie: admin.cookie });
  assert.equal(list.status, 200);
  assert.ok(list.json.some((x) => x.username === u.username));
  assert.ok(!JSON.stringify(list.json).includes("password_hash"));
  // chk_user_link: a Customer account must name a customer
  const bad = await api("/api/users", { method: "POST", body: newUser("nolink", { role: "Customer", branch_id: undefined }), cookie: admin.cookie });
  assert.equal(bad.status, 400);
});

test("TC19 branch managers and customers cannot create or list users (403)", async () => {
  for (const who of [manager, customer]) {
    assert.equal((await api("/api/users", { method: "POST", body: newUser("denied"), cookie: who.cookie })).status, 403);
    assert.equal((await api("/api/users", { cookie: who.cookie })).status, 403);
  }
  assert.equal((await api("/admin/users", { cookie: manager.cookie })).status, 307);
});

test("TC20 a duplicate username is rejected with 409", async () => {
  const u = newUser("dup");
  assert.equal((await api("/api/users", { method: "POST", body: u, cookie: admin.cookie })).status, 201);
  const second = await api("/api/users", { method: "POST", body: { ...u, email: `other_${u.email}` }, cookie: admin.cookie });
  assert.equal(second.status, 409);
});
