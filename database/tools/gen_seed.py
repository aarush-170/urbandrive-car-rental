import math, bcrypt
from datetime import datetime, timedelta
from decimal import Decimal as D

DEV_PW = b"UrbanDrive@123"


def lit(v):
    if v is None:
        return "NULL"
    if isinstance(v, (int, D)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


out = []


def block(table, cols, rows):
    out.append(f"-- {table}: {len(rows)} rows")
    out.append(f"INSERT INTO {table} ({', '.join(cols)}) VALUES")
    out.append(",\n".join("  (" + ", ".join(lit(v) for v in r) + ")" for r in rows) + ";\n")


branches = [
    (1, 'Downtown Hub', 'Bengaluru', '12 MG Road, Bengaluru 560001', '9845010001', 40),
    (2, 'Airport Terminal', 'Bengaluru', 'Kempegowda Intl Airport, Devanahalli 560300', '9845010002', 60),
    (3, 'Koramangala', 'Bengaluru', '80 Feet Road, Koramangala 560034', '9845010003', 25),
    (4, 'Mumbai Central', 'Mumbai', 'Dr. Ambedkar Road, Mumbai Central 400008', '9820010004', 45),
    (5, 'Andheri West', 'Mumbai', 'Link Road, Andheri West 400053', '9820010005', 30),
    (6, 'Connaught Place', 'Delhi', 'Barakhamba Road, CP, New Delhi 110001', '9810010006', 35),
    (7, 'Delhi Airport', 'Delhi', 'IGI Airport T3, New Delhi 110037', '9810010007', 55),
    (8, 'Marina Beach', 'Chennai', 'Kamarajar Salai, Chennai 600005', '9840010008', 20),
    (9, 'HITEC City', 'Hyderabad', 'Madhapur Main Road, Hyderabad 500081', '9848010009', 30),
    (10, 'Koregaon Park', 'Pune', 'North Main Road, Pune 411001', '9822010010', 22),
]
cats = [  # id, name, base/day, late/hr, deposit
    (1, 'Economy', 1200, 150, 5000), (2, 'Compact', 1500, 200, 6000), (3, 'Sedan', 2200, 250, 8000),
    (4, 'SUV', 3200, 350, 12000), (5, 'Premium SUV', 5000, 500, 20000), (6, 'Luxury', 8500, 800, 40000),
    (7, 'Minivan', 3800, 400, 12000), (8, 'Convertible', 7000, 700, 30000),
    (9, 'Pickup Truck', 3500, 350, 12000), (10, 'Electric', 3000, 300, 10000)]
catd = {c[0]: c for c in cats}
custs = [
    (1, 'Rohan', 'Mehta', 'rohan.mehta@example.com', '9900011001', 'KA01-20190012345', '2029-03-14'),
    (2, 'Ananya', 'Iyer', 'ananya.iyer@example.com', '9900011002', 'KA03-20200023456', '2030-07-21'),
    (3, 'Vikram', 'Singh', 'vikram.singh@example.com', '9900011003', 'DL05-20180034567', '2028-11-02'),
    (4, 'Priya', 'Nair', 'priya.nair@example.com', '9900011004', 'KL07-20210045678', '2031-01-30'),
    (5, 'Arjun', 'Reddy', 'arjun.reddy@example.com', '9900011005', 'TS09-20170056789', '2027-09-18'),
    (6, 'Sneha', 'Kulkarni', 'sneha.kulkarni@example.com', '9900011006', 'MH12-20220067890', '2032-05-09'),
    (7, 'Karthik', 'Subramanian', 'karthik.s@example.com', '9900011007', 'TN10-20160078901', '2026-12-31'),
    (8, 'Meera', 'Joshi', 'meera.joshi@example.com', '9900011008', 'MH14-20230089012', '2033-02-25'),
    (9, 'Aditya', 'Verma', 'aditya.verma@example.com', '9900011009', 'UP16-20190090123', '2029-08-12'),
    (10, 'Divya', 'Menon', 'divya.menon@example.com', '9900011010', 'KL01-20200101234', '2030-10-05'),
    (11, 'Rahul', 'Desai', 'rahul.desai@example.com', '9900011011', 'GJ05-20180112345', '2028-04-17'),
    (12, 'Neha', 'Kapoor', 'neha.kapoor@example.com', '9900011012', 'DL08-20210123456', '2031-06-23'),
]
# id, vin, plate, make, model, year, mileage, status, category, branch
veh = [
    (1, 'MA3EWB81S00100001', 'KA01AB1001', 'Maruti', 'Alto K10', 2023, 12480, 'Available', 1, 1),
    (2, 'MA3EWB81S00100002', 'KA01AB1002', 'Maruti', 'Swift', 2022, 21650, 'Available', 2, 3),
    (3, 'MALBM51BLNM100003', 'KA19CD2003', 'Hyundai', 'i20', 2023, 14000, 'Available', 2, 2),
    (4, 'MAKGM572HNN100004', 'KA01EF3004', 'Honda', 'City', 2022, 19120, 'Available', 3, 1),
    (5, 'MALCM81CLNM100005', 'KA03GH4005', 'Hyundai', 'Verna', 2023, 12000, 'Available', 3, 3),
    (6, 'MALCB51BLNM100006', 'KA01JK5006', 'Hyundai', 'Creta', 2023, 32500, 'Rented', 4, 1),
    (7, 'KNAPN81ABNK100007', 'KA19LM6007', 'Kia', 'Seltos', 2022, 22800, 'Available', 4, 1),
    (8, 'MA1TA2WK2N2100008', 'MH01NP7008', 'Mahindra', 'XUV700', 2023, 15800, 'In_Maintenance', 4, 5),
    (9, 'MBJBB3BC3N0100009', 'DL01QR8009', 'Toyota', 'Fortuner', 2022, 25900, 'Available', 5, 7),
    (10, 'MBJEX3GS3M0100010', 'MH02ST9010', 'Toyota', 'Innova Crysta', 2021, 45700, 'Available', 7, 5),
    (11, 'KNAKA81ANPK100011', 'TS09UV1011', 'Kia', 'Carens', 2023, 5200, 'Available', 7, 9),
    (12, 'WBA5U71010C100012', 'MH01WX2012', 'BMW', '5 Series', 2022, 11200, 'Rented', 6, 4),
    (13, 'WDD2130421A100013', 'DL01YZ3013', 'Mercedes-Benz', 'E-Class', 2023, 6350, 'Available', 6, 6),
    (14, 'WMWXR9C09M2100014', 'TN09AB4014', 'Mini', 'Cooper Convertible', 2021, 28000, 'In_Maintenance', 8, 8),
    (15, 'MPATFS86JNT100015', 'MH12CD5015', 'Isuzu', 'D-Max V-Cross', 2022, 19000, 'Available', 9, 10),
    (16, 'MZBXA6MP2NL100016', 'KA01EV6016', 'Tata', 'Nexon EV', 2023, 8100, 'Rented', 10, 1),
    (17, 'MZBXE6MP5PL100017', 'KA03EV7017', 'Tata', 'Tiago EV', 2024, 3500, 'Available', 10, 3),
    (18, 'LSJWH4094NN100018', 'TS09EV8018', 'MG', 'ZS EV', 2023, 11500, 'Available', 10, 9),
    (19, 'MA3NYF81S00100019', 'TN09EF9019', 'Maruti', 'Baleno', 2021, 33000, 'Available', 2, 8),
    (20, 'MA1NA2WK2N2100020', 'MH12GH0020', 'Mahindra', 'Thar', 2022, 41000, 'Decommissioned', 4, 10),
]
assert all(len(v[1]) == 17 for v in veh) and len({v[1] for v in veh}) == 20
vcat = {v[0]: v[8] for v in veh}


def T(s):
    return datetime.strptime(s, "%Y-%m-%d %H:%M")


# booking_id, cust, veh, pickup, dropoff, start, end, actual_return, init_mi, ret_mi, status
bk = [
    (1, 1, 1, 1, 1, '2026-07-03 10:00', '2026-07-06 10:00', '2026-07-06 09:30', 12000, 12480, 'Completed'),
    (2, 2, 2, 1, 3, '2026-07-10 09:00', '2026-07-13 09:00', '2026-07-13 13:00', 21000, 21650, 'Completed'),
    (3, 3, 4, 1, 1, '2026-07-18 08:00', '2026-07-21 08:00', '2026-07-21 07:45', 18500, 19120, 'Completed'),
    (4, 4, 6, 1, 1, '2026-07-25 10:00', '2026-07-30 10:00', '2026-07-30 10:00', 30000, 30900, 'Completed'),
    (5, 5, 8, 4, 5, '2026-08-02 09:00', '2026-08-05 09:00', '2026-08-05 15:00', 15000, 15800, 'Completed'),
    (6, 6, 9, 6, 7, '2026-08-08 09:00', '2026-08-12 09:00', '2026-08-12 09:00', 25000, 25900, 'Completed'),
    (7, 7, 10, 5, 5, '2026-08-14 09:00', '2026-08-18 09:00', '2026-08-18 08:40', 45000, 45700, 'Completed'),
    (8, 8, 12, 4, 4, '2026-08-20 09:00', '2026-08-22 09:00', '2026-08-22 11:00', 9000, 9400, 'Completed'),
    (9, 1, 16, 1, 1, '2026-09-01 09:00', '2026-09-04 09:00', '2026-09-04 09:00', 7000, 7300, 'Completed'),
    (10, 9, 7, 2, 1, '2026-09-06 09:00', '2026-09-09 09:00', '2026-09-09 14:00', 22000, 22800, 'Completed'),
    (11, 10, 13, 6, 6, '2026-09-12 09:00', '2026-09-14 09:00', '2026-09-14 09:00', 6000, 6350, 'Completed'),
    (12, 11, 18, 9, 9, '2026-09-18 09:00', '2026-09-21 09:00', '2026-09-21 09:00', 11000, 11500, 'Completed'),
    (13, 12, 6, 1, 1, '2026-10-23 10:00', '2026-10-27 10:00', None, 32500, None, 'Ongoing'),
    (14, 3, 12, 4, 6, '2026-10-24 09:00', '2026-10-28 09:00', None, 11200, None, 'Ongoing'),
    (15, 5, 16, 1, 3, '2026-10-22 09:00', '2026-10-26 18:00', None, 8100, None, 'Ongoing'),
    (16, 2, 3, 2, 2, '2026-11-01 09:00', '2026-11-04 09:00', None, 14000, None, 'Confirmed'),
    (17, 7, 19, 8, 8, '2026-11-05 09:00', '2026-11-08 09:00', None, 33000, None, 'Confirmed'),
    (18, 9, 11, 9, 9, '2026-11-10 09:00', '2026-11-15 09:00', None, 5200, None, 'Confirmed'),
    (19, 4, 5, 3, 3, '2026-10-05 09:00', '2026-10-08 09:00', None, 12000, None, 'Cancelled'),
    (20, 6, 15, 10, 10, '2026-10-15 09:00', '2026-10-18 09:00', None, 19000, None, 'Cancelled'),
]

bk_rows, total_of, late_of = [], {}, {}
for bid, cu, ve, pb, db, s, e, a, im, rm, st in bk:
    s_, e_ = T(s), T(e)
    assert e_ > s_ and (rm is None or rm >= im)
    _, _, rate, late_rate, _ = catd[vcat[ve]]
    days = math.ceil((e_ - s_) / timedelta(days=1))
    base = D(days * rate)
    late = D(0)
    if a:
        over = T(a) - e_
        if over > timedelta(0):
            late = D(math.ceil(over / timedelta(hours=1)) * late_rate)
    total = D(0) if st == 'Cancelled' else base + late
    total_of[bid], late_of[bid] = total, late
    bk_rows.append((bid, cu, ve, pb, db, s_.strftime('%Y-%m-%d %H:%M:%S'), e_.strftime('%Y-%m-%d %H:%M:%S'),
                    T(a).strftime('%Y-%m-%d %H:%M:%S') if a else None, im, rm, st, late, total))
# ongoing/confirmed vehicles must be consistent with vehicle table
for bid, cu, ve, pb, db, s, e, a, im, rm, st in bk:
    v = veh[ve - 1]
    if st == 'Ongoing':
        assert v[7] == 'Rented' and v[6] == im and v[9] == pb, bid
    if st == 'Completed':
        assert v[6] >= rm, bid

methods = ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash']
pay, pid = [], 0


def addpay(bid, when, amt, st):
    global pid
    pid += 1
    pay.append((pid, bid, when, methods[pid % 5], D(amt), st))


for bid, cu, ve, pb, db, s, e, a, im, rm, st in bk:
    tot = total_of[bid]
    sd, ed = T(s), T(e)
    if st == 'Completed':
        if tot >= 8000:
            adv = (tot * D('0.4')).quantize(D('1'))
            addpay(bid, (sd - timedelta(days=2)).strftime('%Y-%m-%d %H:%M:%S'), adv, 'Success')
            addpay(bid, T(a).strftime('%Y-%m-%d %H:%M:%S'), tot - adv, 'Success')
        else:
            addpay(bid, sd.strftime('%Y-%m-%d %H:%M:%S'), tot, 'Success')
    elif st == 'Ongoing':
        adv = (tot * D('0.5')).quantize(D('1'))
        addpay(bid, sd.strftime('%Y-%m-%d %H:%M:%S'), adv, 'Success')
        if bid == 14:
            addpay(bid, '2026-10-25 09:00:00', tot - adv, 'Pending')
    elif st == 'Confirmed':
        adv = (tot * D('0.3')).quantize(D('1'))
        addpay(bid, (sd - timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S'), adv, 'Success' if bid != 18 else 'Pending')
    elif st == 'Cancelled':
        base = D(math.ceil((ed - sd) / timedelta(days=1)) * catd[vcat[ve]][2])
        adv = (base * D('0.3')).quantize(D('1'))
        addpay(bid, (sd - timedelta(days=5)).strftime('%Y-%m-%d %H:%M:%S'), adv, 'Refunded' if bid == 19 else 'Failed')
assert all(p[4] > 0 for p in pay)

# veh, date, type, mileage_at_service, cost, notes
maint = [
    (1, '2026-06-20', 'Oil Change', 11500, 1800, 'Routine oil and filter change'),
    (2, '2026-06-25', 'Brake Pad Replacement', 20000, 4200, 'Front pads replaced'),
    (4, '2026-05-15', 'General Service', 17000, 3500, 'Periodic 15k service'),
    (6, '2026-04-10', 'Oil Change', 28000, 2500, 'Synthetic oil used'),
    (8, '2026-10-20', 'Clutch Repair', 15800, 18500, 'Clutch plate slipping after return; vehicle held in workshop'),
    (9, '2026-03-12', 'Full Service', 22000, 9000, 'Full service with brake fluid flush'),
    (10, '2026-02-05', 'Tyre Replacement', 34000, 24000, 'All four tyres replaced'),
    (12, '2026-08-30', 'Brake Inspection', 9400, 1500, 'Pads within tolerance'),
    (13, '2026-09-20', 'Detailing and Service', 6350, 4000, 'Interior detailing plus minor service'),
    (14, '2026-10-18', 'Transmission Repair', 28000, 32000, 'Gearbox rebuild in progress'),
    (15, '2026-05-01', 'Oil Change', 8000, 2800, 'Diesel oil and filter change'),
    (16, '2026-09-10', 'Battery Health Check', 7300, 1200, 'Battery health 97 percent'),
    (19, '2026-07-15', 'Tyre Rotation', 30000, 1500, 'Rotation and balancing'),
    (20, '2026-08-01', 'Engine Overhaul', 40000, 55000, 'Cost exceeds value; vehicle decommissioned'),
]
for m in maint:
    assert m[3] <= veh[m[0] - 1][6]

users_raw = [  # id, username, email, role, customer_id, branch_id
    (1, 'admin', 'admin@urbandrive.example', 'Admin', None, None),
    (2, 'mgr_downtown', 'mgr.downtown@urbandrive.example', 'Branch_Manager', None, 1),
    (3, 'mgr_mumbai', 'mgr.mumbai@urbandrive.example', 'Branch_Manager', None, 4),
] + [(3 + c[0], 'cust_' + c[1].lower(), c[3], 'Customer', c[0], None) for c in custs[:8]]
users = [(u[0], u[1], u[2], bcrypt.hashpw(DEV_PW, bcrypt.gensalt(10)).decode(), u[3], u[4], u[5]) for u in users_raw]

out.append("""-- UrbanDrive seed data (phase 1)
-- Run after 01_schema.sql:  mysql -u <user> -p mini_project < database/02_seed.sql
-- Sample "today" for the data is 2026-10-25.
-- Every seeded login uses the development password: UrbanDrive@123 (stored only as bcrypt hashes).
-- Change or delete these accounts before any real deployment.

USE mini_project;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE User_Account;
TRUNCATE TABLE Payment;
TRUNCATE TABLE Maintenance_Record;
TRUNCATE TABLE Rental_Booking;
TRUNCATE TABLE Vehicle;
TRUNCATE TABLE Vehicle_Category;
TRUNCATE TABLE Customer;
TRUNCATE TABLE Branch;
SET FOREIGN_KEY_CHECKS = 1;
""")
block('Branch', ['branch_id', 'branch_name', 'city', 'address', 'contact_number', 'capacity'], branches)
block('Vehicle_Category', ['category_id', 'category_name', 'base_rate_per_day', 'late_fee_per_hour', 'security_deposit'], cats)
block('Customer', ['customer_id', 'first_name', 'last_name', 'email', 'phone', 'license_number', 'license_expiry_date'], custs)
block('Vehicle', ['vehicle_id', 'vin', 'license_plate', 'make', 'model', 'manufacture_year', 'current_mileage', 'status', 'category_id', 'current_branch_id'], veh)
block('Rental_Booking', ['booking_id', 'customer_id', 'vehicle_id', 'pickup_branch_id', 'dropoff_branch_id', 'start_date', 'end_date', 'actual_return_date', 'initial_mileage', 'return_mileage', 'booking_status', 'late_fee', 'total_amount'], bk_rows)
block('Payment', ['payment_id', 'booking_id', 'payment_date', 'payment_method', 'amount_paid', 'payment_status'], pay)
block('Maintenance_Record', ['vehicle_id', 'service_date', 'service_type', 'mileage_at_service', 'cost', 'notes'], maint)
block('User_Account', ['user_id', 'username', 'email', 'password_hash', 'role', 'customer_id', 'branch_id'], users)

import sys
open(sys.argv[1], 'w', newline='\n', encoding='utf-8').write("\n".join(out))
print({k: n for k, n in [('payments', len(pay)), ('bookings', len(bk_rows)), ('users', len(users))]})
