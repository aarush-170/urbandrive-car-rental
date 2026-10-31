import { one, query } from "./db";

export interface Option {
  id: number;
  label: string;
}

export async function branchOptions(): Promise<Option[]> {
  return query<Option>("SELECT branch_id AS id, CONCAT(branch_name, ' (', city, ')') AS label FROM Branch ORDER BY city, branch_name");
}
export async function categoryOptions(): Promise<Option[]> {
  return query<Option>("SELECT category_id AS id, category_name AS label FROM Vehicle_Category ORDER BY base_rate_per_day");
}
export async function customerOptions(): Promise<Option[]> {
  return query<Option>("SELECT customer_id AS id, CONCAT(first_name, ' ', last_name, ' - ', license_number) AS label FROM Customer ORDER BY first_name, last_name");
}

// ---------- vehicles ----------
export interface VehicleRow {
  vehicle_id: number;
  vin: string;
  license_plate: string;
  make: string;
  model: string;
  manufacture_year: number;
  current_mileage: number;
  status: string;
  category_id: number;
  category_name: string;
  base_rate_per_day: number;
  branch_id: number;
  branch_name: string;
  city: string;
}

const VEHICLE_SELECT = `
  SELECT v.vehicle_id, v.vin, v.license_plate, v.make, v.model, v.manufacture_year, v.current_mileage, v.status,
         vc.category_id, vc.category_name, vc.base_rate_per_day,
         br.branch_id, br.branch_name, br.city
  FROM Vehicle v
  JOIN Vehicle_Category vc ON vc.category_id = v.category_id
  JOIN Branch br ON br.branch_id = v.current_branch_id`;

export interface VehicleFilter {
  q?: string;
  branch?: number;
  category?: number;
  status?: string;
}

// Search uses the FULLTEXT index (make, model) in boolean mode with prefix matching.
function fulltextTerm(q: string): string {
  const words = q.match(/[\p{L}\p{N}]{2,}/gu) ?? [];
  return words.map((w) => `+${w}*`).join(" ");
}

export async function listVehicles(f: VehicleFilter): Promise<VehicleRow[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  const term = f.q ? fulltextTerm(f.q) : "";
  if (term) {
    where.push("MATCH(v.make, v.model) AGAINST (? IN BOOLEAN MODE)");
    params.push(term);
  }
  if (f.branch) { where.push("v.current_branch_id = ?"); params.push(f.branch); }
  if (f.category) { where.push("v.category_id = ?"); params.push(f.category); }
  if (f.status) { where.push("v.status = ?"); params.push(f.status); }
  return query<VehicleRow>(`${VEHICLE_SELECT} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY br.city, vc.category_name, v.make, v.model`, params);
}

export async function getVehicle(id: number): Promise<VehicleRow | undefined> {
  return one<VehicleRow>(`${VEHICLE_SELECT} WHERE v.vehicle_id = ?`, [id]);
}

// Inventory availability: vehicles that are not decommissioned / in the workshop and have
// no Confirmed or Ongoing booking overlapping [start, end).
export async function availableVehicles(opts: { start: string; end: string; branch?: number; category?: number }): Promise<VehicleRow[]> {
  const params: unknown[] = [opts.end, opts.start];
  let extra = "";
  if (opts.branch) { extra += " AND v.current_branch_id = ?"; params.push(opts.branch); }
  if (opts.category) { extra += " AND v.category_id = ?"; params.push(opts.category); }
  return query<VehicleRow>(
    `${VEHICLE_SELECT}
     WHERE v.status NOT IN ('Decommissioned', 'In_Maintenance')
       AND NOT EXISTS (SELECT 1 FROM Rental_Booking b
                       WHERE b.vehicle_id = v.vehicle_id
                         AND b.booking_status IN ('Confirmed', 'Ongoing')
                         AND b.start_date < ? AND b.end_date > ?)
       ${extra}
     ORDER BY vc.base_rate_per_day, v.make, v.model`,
    params,
  );
}

// ---------- customers ----------
export interface CustomerRow {
  customer_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  license_number: string;
  license_expiry_date: string;
  bookings: number;
  total_spent: number;
}

export async function listCustomers(q?: string): Promise<CustomerRow[]> {
  const like = `%${q ?? ""}%`;
  return query<CustomerRow>(
    `SELECT c.*, COUNT(b.booking_id) AS bookings,
            COALESCE(SUM(CASE WHEN b.booking_status = 'Completed' THEN b.total_amount END), 0) AS total_spent
     FROM Customer c LEFT JOIN Rental_Booking b ON b.customer_id = c.customer_id
     WHERE ? = '%%' OR CONCAT(c.first_name, ' ', c.last_name) LIKE ? OR c.email LIKE ? OR c.license_number LIKE ?
     GROUP BY c.customer_id ORDER BY c.first_name, c.last_name`,
    [like, like, like, like],
  );
}

export interface RepeatCustomer {
  customer_id: number;
  customer_name: string;
  completed_bookings: number;
  total_spent: number;
  total_late_fees: number;
}

// Repeat customers: GROUP BY customer, HAVING filters the groups (at least `min` completed bookings).
export async function repeatCustomers(min = 2): Promise<RepeatCustomer[]> {
  return query<RepeatCustomer>(
    `SELECT c.customer_id, CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
            COUNT(*) AS completed_bookings, SUM(b.total_amount) AS total_spent, SUM(b.late_fee) AS total_late_fees
     FROM Customer c JOIN Rental_Booking b ON b.customer_id = c.customer_id
     WHERE b.booking_status = 'Completed'
     GROUP BY c.customer_id, c.first_name, c.last_name
     HAVING COUNT(*) >= ?
     ORDER BY total_spent DESC`,
    [min],
  );
}

export async function getCustomer(id: number): Promise<CustomerRow | undefined> {
  return (await listCustomers()).find((c) => c.customer_id === id);
}

export interface HistoryRow {
  booking_id: number;
  booking_status: string;
  vehicle: string;
  license_plate: string;
  pickup_branch: string;
  dropoff_branch: string;
  start_date: string;
  end_date: string;
  actual_return_date: string | null;
  late_fee: number;
  total_amount: number | null;
}

// Customer audit: full booking history including late-return penalties (uses the view).
export async function customerHistory(id: number): Promise<HistoryRow[]> {
  return query<HistoryRow>("SELECT * FROM vw_customer_booking_history WHERE customer_id = ? ORDER BY start_date DESC", [id]);
}

// ---------- bookings ----------
export interface BookingRow {
  booking_id: number;
  customer_name: string;
  vehicle: string;
  license_plate: string;
  pickup_branch: string;
  dropoff_branch: string;
  start_date: string;
  end_date: string;
  actual_return_date: string | null;
  booking_status: string;
  late_fee: number;
  total_amount: number | null;
  paid: number;
  initial_mileage: number;
}

export async function listBookings(status?: string, customerId?: number): Promise<BookingRow[]> {
  const params: unknown[] = [];
  const conds: string[] = [];
  if (status) { conds.push("b.booking_status = ?"); params.push(status); }
  if (customerId) { conds.push("b.customer_id = ?"); params.push(customerId); }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  return query<BookingRow>(
    `SELECT b.booking_id, CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
            CONCAT(v.make, ' ', v.model) AS vehicle, v.license_plate,
            pb.branch_name AS pickup_branch, db.branch_name AS dropoff_branch,
            b.start_date, b.end_date, b.actual_return_date, b.booking_status,
            b.late_fee, b.total_amount, b.initial_mileage,
            COALESCE((SELECT SUM(p.amount_paid) FROM Payment p
                      WHERE p.booking_id = b.booking_id AND p.payment_status = 'Success'), 0) AS paid
     FROM Rental_Booking b
     JOIN Customer c ON c.customer_id = b.customer_id
     JOIN Vehicle v ON v.vehicle_id = b.vehicle_id
     JOIN Branch pb ON pb.branch_id = b.pickup_branch_id
     JOIN Branch db ON db.branch_id = b.dropoff_branch_id
     ${where}
     ORDER BY b.start_date DESC`,
    params,
  );
}

// ---------- maintenance ----------
export interface MaintenanceRow {
  maintenance_id: number;
  vehicle_id: number;
  vehicle: string;
  license_plate: string;
  service_date: string;
  service_type: string;
  mileage_at_service: number;
  cost: number;
  notes: string | null;
}

export async function listMaintenance(vehicleId?: number): Promise<MaintenanceRow[]> {
  const params: unknown[] = [];
  let where = "";
  if (vehicleId) { where = "WHERE m.vehicle_id = ?"; params.push(vehicleId); }
  return query<MaintenanceRow>(
    `SELECT m.maintenance_id, m.vehicle_id, CONCAT(v.make, ' ', v.model) AS vehicle, v.license_plate,
            m.service_date, m.service_type, m.mileage_at_service, m.cost, m.notes
     FROM Maintenance_Record m JOIN Vehicle v ON v.vehicle_id = m.vehicle_id
     ${where} ORDER BY m.service_date DESC, m.maintenance_id DESC`,
    params,
  );
}

export async function vehicleOptions(): Promise<Option[]> {
  return query<Option>("SELECT vehicle_id AS id, CONCAT(make, ' ', model, ' - ', license_plate) AS label FROM Vehicle ORDER BY make, model");
}

// ---------- reports ----------
export interface DueRow {
  vehicle_id: number;
  make: string;
  model: string;
  license_plate: string;
  status: string;
  branch_name: string;
  current_mileage: number;
  last_service_mileage: number;
  last_service_date: string | null;
  miles_since_service: number;
}

// Fleet maintenance: vehicles beyond `threshold` miles since the last logged service.
export async function maintenanceDue(threshold = 10000): Promise<DueRow[]> {
  return query<DueRow>("SELECT * FROM vw_maintenance_due WHERE miles_since_service > ? ORDER BY miles_since_service DESC", [threshold]);
}

export interface Quarter {
  yr: number;
  qtr: number;
}
export async function revenueQuarters(): Promise<Quarter[]> {
  return query<Quarter>("SELECT DISTINCT yr, qtr FROM vw_revenue_by_category_quarter ORDER BY yr DESC, qtr DESC");
}

export interface RevenueRow {
  category_name: string;
  bookings: number;
  revenue: number;
}
export async function revenueByCategory(q: Quarter): Promise<RevenueRow[]> {
  return query<RevenueRow>(
    "SELECT category_name, bookings, revenue FROM vw_revenue_by_category_quarter WHERE yr = ? AND qtr = ? ORDER BY revenue DESC",
    [q.yr, q.qtr],
  );
}

export interface BranchAvailability {
  branch_name: string;
  city: string;
  category_name: string;
  available_vehicles: number;
}
export async function branchAvailability(): Promise<BranchAvailability[]> {
  return query<BranchAvailability>("SELECT branch_name, city, category_name, available_vehicles FROM vw_branch_availability ORDER BY city, branch_name, category_name");
}

// ---------- dashboard ----------
export interface DashboardStats {
  total: number;
  available: number;
  rented: number;
  in_maintenance: number;
  decommissioned: number;
  active_bookings: number;
  upcoming_bookings: number;
  month_revenue: number;
  late_fees: number;
}
export async function dashboardStats(): Promise<DashboardStats> {
  const row = await one<DashboardStats>(
    `SELECT COUNT(*) AS total,
            SUM(status = 'Available') AS available, SUM(status = 'Rented') AS rented,
            SUM(status = 'In_Maintenance') AS in_maintenance, SUM(status = 'Decommissioned') AS decommissioned,
            (SELECT COUNT(*) FROM Rental_Booking WHERE booking_status = 'Ongoing') AS active_bookings,
            (SELECT COUNT(*) FROM Rental_Booking WHERE booking_status = 'Confirmed') AS upcoming_bookings,
            (SELECT COALESCE(SUM(amount_paid), 0) FROM Payment
              WHERE payment_status = 'Success' AND payment_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')) AS month_revenue,
            (SELECT COALESCE(SUM(late_fee), 0) FROM Rental_Booking WHERE booking_status = 'Completed') AS late_fees
     FROM Vehicle`,
  );
  return row!;
}
