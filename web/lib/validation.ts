import { z } from "zod";

// 'YYYY-MM-DDTHH:mm' (from <input type="datetime-local">) -> 'YYYY-MM-DD HH:mm:00' for MySQL
const dateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/, "must be a date and time")
  .transform((s) => {
    const v = s.replace("T", " ");
    return v.length === 16 ? `${v}:00` : v;
  });
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be a date (YYYY-MM-DD)");
const id = z.coerce.number().int().positive();
const phone = z.string().regex(/^[0-9+]{7,15}$/, "must be 7-15 digits");

export const paymentMethods = ["Credit Card", "Debit Card", "UPI", "Net Banking", "Cash"] as const;
const method = z.enum(paymentMethods);

export const customerSchema = z.object({
  first_name: z.string().trim().min(1).max(50),
  last_name: z.string().trim().min(1).max(50),
  email: z.string().trim().email().max(100),
  phone,
  license_number: z.string().trim().min(5).max(30),
  license_expiry_date: isoDate,
});

export const vehicleSchema = z.object({
  vin: z.string().trim().length(17, "VIN must be exactly 17 characters"),
  license_plate: z.string().trim().min(4).max(15),
  make: z.string().trim().min(1).max(50),
  model: z.string().trim().min(1).max(50),
  manufacture_year: z.coerce.number().int().min(2000).max(new Date().getFullYear() + 1),
  current_mileage: z.coerce.number().int().min(0),
  category_id: id,
  current_branch_id: id,
});

export const vehicleStatusSchema = z.object({
  status: z.enum(["Available", "In_Maintenance", "Decommissioned"]),
});

// 'YYYY-MM-DD HH:mm:00' for the current minute in the server's timezone (same shape as the parsed dates)
const localNow = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:00`;
};

export const bookingSchema = z
  .object({
    customer_id: id,
    vehicle_id: id,
    pickup_branch_id: id,
    dropoff_branch_id: id,
    start_date: dateTime,
    end_date: dateTime,
    payment_method: method,
  })
  .refine((b) => b.end_date > b.start_date, { message: "end_date must be after start_date", path: ["end_date"] })
  .refine((b) => b.start_date >= localNow(), { message: "start_date cannot be in the past", path: ["start_date"] });

export const returnSchema = z.object({
  return_mileage: z.coerce.number().int().min(0),
  actual_return_date: dateTime,
  payment_method: method,
});

export const maintenanceSchema = z.object({
  vehicle_id: id,
  service_date: isoDate,
  service_type: z.string().trim().min(2).max(100),
  mileage_at_service: z.coerce.number().int().min(0),
  cost: z.coerce.number().min(0),
  notes: z.string().trim().max(1000).optional().default(""),
});

export const inspectionSchema = z.object({
  booking_id: id,
  type: z.enum(["pickup", "return"]),
  odometer: z.coerce.number().int().min(0),
  fuel_level: z.string().trim().max(10).optional(),
  damage_part: z.string().trim().max(60).optional(),
  damage_severity: z.enum(["minor", "moderate", "major"]).optional(),
  damage_note: z.string().trim().max(300).optional(),
});

export const reviewSchema = z.object({
  booking_id: id,
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(500),
  tags: z.string().trim().max(100).optional().default(""),
});

export const userRoles = ["Admin", "Branch_Manager", "Customer"] as const;

// bcrypt only uses the first 72 bytes, so longer passwords are refused instead of silently truncated.
export const userSchema = z
  .object({
    username: z.string().trim().regex(/^[A-Za-z0-9_.-]{3,50}$/, "3-50 letters, digits, dot, dash or underscore"),
    email: z.string().trim().email().max(100),
    password: z.string().min(8, "at least 8 characters").max(72),
    role: z.enum(userRoles),
    customer_id: id.optional(),
    branch_id: id.optional(),
  })
  .superRefine((u, ctx) => {
    if (u.role === "Customer" && u.customer_id === undefined)
      ctx.addIssue({ code: "custom", path: ["customer_id"], message: "required for a Customer account" });
    if (u.role === "Branch_Manager" && u.branch_id === undefined)
      ctx.addIssue({ code: "custom", path: ["branch_id"], message: "required for a Branch_Manager account" });
  });
