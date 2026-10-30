# UrbanDrive – Normalization Analysis

This document lists the functional dependencies (FDs) of each of the 8 tables in `database/01_schema.sql` and the highest normal form each one reaches.

**Method.** For each table I first list the candidate keys (the primary key plus every `UNIQUE` column). Then I list the FDs that hold under the business rules. A table is in:

- **1NF** if every column is atomic and there are no repeating groups;
- **2NF** if it is in 1NF and no non-key attribute depends on only part of a composite key;
- **3NF** if it is in 2NF and no non-key attribute depends on another non-key attribute;
- **BCNF** if the left side of every non-trivial FD is a superkey.

Every table below has a single-column primary key, so 2NF holds automatically: a partial dependency needs a composite key. The real checks are 3NF and BCNF. The FDs come from the schema and the business rules. They are not proven from the data, because sample data cannot prove an FD.

---

## 1. Branch

Candidate key: `branch_id`.

```
branch_id -> branch_name, city, address, contact_number, capacity
```

Two branches may share a name, address or phone number (the schema has no `UNIQUE` on them), so no other FD is guaranteed. The only determinant is the key.

**Highest form: BCNF.** All columns are atomic, and the only determinant is a key.

## 2. Vehicle_Category

Candidate keys: `category_id`, `category_name`.

```
category_id   -> category_name, base_rate_per_day, late_fee_per_hour, security_deposit
category_name -> category_id, base_rate_per_day, late_fee_per_hour, security_deposit
```

Both determinants are candidate keys.

**Highest form: BCNF.** This table is also the reason `Vehicle` and `Rental_Booking` are normalized. Rates and fees are stored once per category and not repeated on every vehicle or booking.

## 3. Customer

Candidate keys: `customer_id`, `email`, `license_number`.

```
customer_id    -> first_name, last_name, email, phone, license_number, license_expiry_date
email          -> customer_id, (all other columns)
license_number -> customer_id, (all other columns)
```

Every determinant is a candidate key. `first_name` and `last_name` are kept separate on purpose, so each column is atomic. `phone` is not unique, because two customers can share a family number, so `phone` determines nothing.

**Highest form: BCNF.**

## 4. Vehicle

Candidate keys: `vehicle_id`, `vin`, `license_plate`.

```
vehicle_id    -> vin, license_plate, make, model, manufacture_year,
                 current_mileage, status, category_id, current_branch_id
vin           -> vehicle_id, (all other columns)
license_plate -> vehicle_id, (all other columns)
```

`make` and `model` do not determine `category_id`. The same model can be offered in different categories (for example by trim), and the schema does not enforce otherwise. If a business rule said "model determines category", `Vehicle(model -> category_id)` would be a 3NF violation and we would split it out. With the current rules it is not.

`category_id` and `current_branch_id` are foreign keys, so branch and category details are not repeated here.

**Highest form: BCNF.**

## 5. Rental_Booking

Candidate key: `booking_id`.

```
booking_id -> customer_id, vehicle_id, pickup_branch_id, dropoff_branch_id,
              start_date, end_date, actual_return_date, initial_mileage,
              return_mileage, booking_status, late_fee, total_amount
```

The pickup and drop-off branch are two foreign keys to the same `Branch` table. This is not a repeating group. The two columns have different meanings.

`initial_mileage` looks like a copy of `Vehicle.current_mileage`, but it is a snapshot of the mileage at the start of this rental. The vehicle's mileage changes later, so the booking needs its own value. It is not redundant data.

`late_fee` and `total_amount` are derivable, which is covered in section 9.

**Highest form: BCNF**, treating `total_amount` and `late_fee` as recorded facts at the time of the transaction, which is how the application uses them. If you instead treat them as always derivable from other columns and `Vehicle_Category`, the table carries a deliberate redundancy that breaks 3NF; section 9 explains why we keep it.

## 6. Payment

Candidate key: `payment_id`.

```
payment_id -> booking_id, payment_date, payment_method, amount_paid, payment_status
```

A booking has many payments (advance, balance, refund). Putting them in their own table, one row each, keeps `Rental_Booking` free of repeating groups such as `advance_amount` and `balance_amount`.

**Highest form: BCNF.**

## 7. Maintenance_Record

Candidate key: `maintenance_id`.

```
maintenance_id -> vehicle_id, service_date, service_type, mileage_at_service, cost, notes
```

`mileage_at_service` is the odometer at that service, so it is a fact about the event and not about the vehicle's current state. It does not depend on `vehicle_id` alone.

**Highest form: BCNF.**

## 8. User_Account

Candidate keys: `user_id`, `username`, `email`, `customer_id` (unique, nullable).

```
user_id     -> username, email, password_hash, role, customer_id, branch_id, created_at
username    -> user_id, (all other columns)
email       -> user_id, (all other columns)
customer_id -> user_id, (all other columns)     (where customer_id is not NULL)
```

The rule "a Customer has `customer_id`, a Branch_Manager has `branch_id`" is a check constraint (`chk_user_link`). It is a constraint on which columns may be NULL, not a functional dependency, so it does not break any normal form.

One point that is outside single-table normalization: for a customer login, `User_Account.email` can duplicate `Customer.email`. It is a login identifier, and it is allowed to differ from the customer contact email, so we keep it. If the two had to always match, the right design would be to drop `User_Account.email` and read it through `customer_id`.

**Highest form: BCNF.**

---

## 9. Deliberate denormalization: `Rental_Booking.total_amount` and `late_fee`

`total_amount` can be computed:

```
total_amount = ceil(days between start_date and end_date) x Vehicle_Category.base_rate_per_day + late_fee
late_fee     = fn_late_fee(booking_id, actual_return_date)
```

So strictly it is not independent data, and a purist design would calculate it in a view each time. We store it for three reasons.

1. **Prices change.** If an admin changes `base_rate_per_day` for a category next month, a recalculated total for an old booking would silently change history and no longer match what the customer paid. The stored value is the agreed price at booking time. This is the main reason, and it is a correctness reason, not just speed.
2. **Reporting is cheaper.** The audit and revenue pages read the amount directly instead of joining three tables and repeating the day-rounding logic.
3. **The procedures keep it consistent.** Only `sp_create_booking` (initial total), `sp_return_vehicle` (adds the late fee) and `sp_cancel_booking` (sets 0) write it, each inside one transaction, so the stored value cannot drift from the rules by accident.

**Cost.** If someone edits `start_date`, `end_date` or `late_fee` by hand with plain `UPDATE`, `total_amount` is not updated. We accept that risk because bookings are changed through the stored procedures. A `CHECK (total_amount >= 0)` guards the obvious bad values. The same reasoning applies to `late_fee`.

The same idea, a snapshot that should not follow later changes, applies to `initial_mileage` (section 5).

## Summary

| Table | Candidate keys | Highest normal form | Note |
|---|---|---|---|
| Branch | branch_id | BCNF | |
| Vehicle_Category | category_id, category_name | BCNF | Holds the rates once |
| Customer | customer_id, email, license_number | BCNF | |
| Vehicle | vehicle_id, vin, license_plate | BCNF | Assumes model does not determine category |
| Rental_Booking | booking_id | BCNF as stored | `total_amount` and `late_fee` are a deliberate denormalization |
| Payment | payment_id | BCNF | |
| Maintenance_Record | maintenance_id | BCNF | |
| User_Account | user_id, username, email, customer_id | BCNF | Login email may duplicate Customer email |
