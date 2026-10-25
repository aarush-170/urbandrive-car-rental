-- UrbanDrive seed data (phase 1)
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

-- Branch: 10 rows
INSERT INTO Branch (branch_id, branch_name, city, address, contact_number, capacity) VALUES
  (1, 'Downtown Hub', 'Bengaluru', '12 MG Road, Bengaluru 560001', '9845010001', 40),
  (2, 'Airport Terminal', 'Bengaluru', 'Kempegowda Intl Airport, Devanahalli 560300', '9845010002', 60),
  (3, 'Koramangala', 'Bengaluru', '80 Feet Road, Koramangala 560034', '9845010003', 25),
  (4, 'Mumbai Central', 'Mumbai', 'Dr. Ambedkar Road, Mumbai Central 400008', '9820010004', 45),
  (5, 'Andheri West', 'Mumbai', 'Link Road, Andheri West 400053', '9820010005', 30),
  (6, 'Connaught Place', 'Delhi', 'Barakhamba Road, CP, New Delhi 110001', '9810010006', 35),
  (7, 'Delhi Airport', 'Delhi', 'IGI Airport T3, New Delhi 110037', '9810010007', 55),
  (8, 'Marina Beach', 'Chennai', 'Kamarajar Salai, Chennai 600005', '9840010008', 20),
  (9, 'HITEC City', 'Hyderabad', 'Madhapur Main Road, Hyderabad 500081', '9848010009', 30),
  (10, 'Koregaon Park', 'Pune', 'North Main Road, Pune 411001', '9822010010', 22);

-- Vehicle_Category: 10 rows
INSERT INTO Vehicle_Category (category_id, category_name, base_rate_per_day, late_fee_per_hour, security_deposit) VALUES
  (1, 'Economy', 1200, 150, 5000),
  (2, 'Compact', 1500, 200, 6000),
  (3, 'Sedan', 2200, 250, 8000),
  (4, 'SUV', 3200, 350, 12000),
  (5, 'Premium SUV', 5000, 500, 20000),
  (6, 'Luxury', 8500, 800, 40000),
  (7, 'Minivan', 3800, 400, 12000),
  (8, 'Convertible', 7000, 700, 30000),
  (9, 'Pickup Truck', 3500, 350, 12000),
  (10, 'Electric', 3000, 300, 10000);

-- Customer: 12 rows
INSERT INTO Customer (customer_id, first_name, last_name, email, phone, license_number, license_expiry_date) VALUES
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
  (12, 'Neha', 'Kapoor', 'neha.kapoor@example.com', '9900011012', 'DL08-20210123456', '2031-06-23');

-- Vehicle: 20 rows
INSERT INTO Vehicle (vehicle_id, vin, license_plate, make, model, manufacture_year, current_mileage, status, category_id, current_branch_id) VALUES
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
  (20, 'MA1NA2WK2N2100020', 'MH12GH0020', 'Mahindra', 'Thar', 2022, 41000, 'Decommissioned', 4, 10);

-- Rental_Booking: 20 rows
INSERT INTO Rental_Booking (booking_id, customer_id, vehicle_id, pickup_branch_id, dropoff_branch_id, start_date, end_date, actual_return_date, initial_mileage, return_mileage, booking_status, late_fee, total_amount) VALUES
  (1, 1, 1, 1, 1, '2026-07-03 10:00:00', '2026-07-06 10:00:00', '2026-07-06 09:30:00', 12000, 12480, 'Completed', 0, 3600),
  (2, 2, 2, 1, 3, '2026-07-10 09:00:00', '2026-07-13 09:00:00', '2026-07-13 13:00:00', 21000, 21650, 'Completed', 800, 5300),
  (3, 3, 4, 1, 1, '2026-07-18 08:00:00', '2026-07-21 08:00:00', '2026-07-21 07:45:00', 18500, 19120, 'Completed', 0, 6600),
  (4, 4, 6, 1, 1, '2026-07-25 10:00:00', '2026-07-30 10:00:00', '2026-07-30 10:00:00', 30000, 30900, 'Completed', 0, 16000),
  (5, 5, 8, 4, 5, '2026-08-02 09:00:00', '2026-08-05 09:00:00', '2026-08-05 15:00:00', 15000, 15800, 'Completed', 2100, 11700),
  (6, 6, 9, 6, 7, '2026-08-08 09:00:00', '2026-08-12 09:00:00', '2026-08-12 09:00:00', 25000, 25900, 'Completed', 0, 20000),
  (7, 7, 10, 5, 5, '2026-08-14 09:00:00', '2026-08-18 09:00:00', '2026-08-18 08:40:00', 45000, 45700, 'Completed', 0, 15200),
  (8, 8, 12, 4, 4, '2026-08-20 09:00:00', '2026-08-22 09:00:00', '2026-08-22 11:00:00', 9000, 9400, 'Completed', 1600, 18600),
  (9, 1, 16, 1, 1, '2026-09-01 09:00:00', '2026-09-04 09:00:00', '2026-09-04 09:00:00', 7000, 7300, 'Completed', 0, 9000),
  (10, 9, 7, 2, 1, '2026-09-06 09:00:00', '2026-09-09 09:00:00', '2026-09-09 14:00:00', 22000, 22800, 'Completed', 1750, 11350),
  (11, 10, 13, 6, 6, '2026-09-12 09:00:00', '2026-09-14 09:00:00', '2026-09-14 09:00:00', 6000, 6350, 'Completed', 0, 17000),
  (12, 11, 18, 9, 9, '2026-09-18 09:00:00', '2026-09-21 09:00:00', '2026-09-21 09:00:00', 11000, 11500, 'Completed', 0, 9000),
  (13, 12, 6, 1, 1, '2026-10-23 10:00:00', '2026-10-27 10:00:00', NULL, 32500, NULL, 'Ongoing', 0, 12800),
  (14, 3, 12, 4, 6, '2026-10-24 09:00:00', '2026-10-28 09:00:00', NULL, 11200, NULL, 'Ongoing', 0, 34000),
  (15, 5, 16, 1, 3, '2026-10-22 09:00:00', '2026-10-26 18:00:00', NULL, 8100, NULL, 'Ongoing', 0, 15000),
  (16, 2, 3, 2, 2, '2026-11-01 09:00:00', '2026-11-04 09:00:00', NULL, 14000, NULL, 'Confirmed', 0, 4500),
  (17, 7, 19, 8, 8, '2026-11-05 09:00:00', '2026-11-08 09:00:00', NULL, 33000, NULL, 'Confirmed', 0, 4500),
  (18, 9, 11, 9, 9, '2026-11-10 09:00:00', '2026-11-15 09:00:00', NULL, 5200, NULL, 'Confirmed', 0, 19000),
  (19, 4, 5, 3, 3, '2026-10-05 09:00:00', '2026-10-08 09:00:00', NULL, 12000, NULL, 'Cancelled', 0, 0),
  (20, 6, 15, 10, 10, '2026-10-15 09:00:00', '2026-10-18 09:00:00', NULL, 19000, NULL, 'Cancelled', 0, 0);

-- Payment: 30 rows
INSERT INTO Payment (payment_id, booking_id, payment_date, payment_method, amount_paid, payment_status) VALUES
  (1, 1, '2026-07-03 10:00:00', 'Credit Card', 3600, 'Success'),
  (2, 2, '2026-07-10 09:00:00', 'Debit Card', 5300, 'Success'),
  (3, 3, '2026-07-18 08:00:00', 'Net Banking', 6600, 'Success'),
  (4, 4, '2026-07-23 10:00:00', 'Cash', 6400, 'Success'),
  (5, 4, '2026-07-30 10:00:00', 'UPI', 9600, 'Success'),
  (6, 5, '2026-07-31 09:00:00', 'Credit Card', 4680, 'Success'),
  (7, 5, '2026-08-05 15:00:00', 'Debit Card', 7020, 'Success'),
  (8, 6, '2026-08-06 09:00:00', 'Net Banking', 8000, 'Success'),
  (9, 6, '2026-08-12 09:00:00', 'Cash', 12000, 'Success'),
  (10, 7, '2026-08-12 09:00:00', 'UPI', 6080, 'Success'),
  (11, 7, '2026-08-18 08:40:00', 'Credit Card', 9120, 'Success'),
  (12, 8, '2026-08-18 09:00:00', 'Debit Card', 7440, 'Success'),
  (13, 8, '2026-08-22 11:00:00', 'Net Banking', 11160, 'Success'),
  (14, 9, '2026-08-30 09:00:00', 'Cash', 3600, 'Success'),
  (15, 9, '2026-09-04 09:00:00', 'UPI', 5400, 'Success'),
  (16, 10, '2026-09-04 09:00:00', 'Credit Card', 4540, 'Success'),
  (17, 10, '2026-09-09 14:00:00', 'Debit Card', 6810, 'Success'),
  (18, 11, '2026-09-10 09:00:00', 'Net Banking', 6800, 'Success'),
  (19, 11, '2026-09-14 09:00:00', 'Cash', 10200, 'Success'),
  (20, 12, '2026-09-16 09:00:00', 'UPI', 3600, 'Success'),
  (21, 12, '2026-09-21 09:00:00', 'Credit Card', 5400, 'Success'),
  (22, 13, '2026-10-23 10:00:00', 'Debit Card', 6400, 'Success'),
  (23, 14, '2026-10-24 09:00:00', 'Net Banking', 17000, 'Success'),
  (24, 14, '2026-10-25 09:00:00', 'Cash', 17000, 'Pending'),
  (25, 15, '2026-10-22 09:00:00', 'UPI', 7500, 'Success'),
  (26, 16, '2026-10-25 09:00:00', 'Credit Card', 1350, 'Success'),
  (27, 17, '2026-10-29 09:00:00', 'Debit Card', 1350, 'Success'),
  (28, 18, '2026-11-03 09:00:00', 'Net Banking', 5700, 'Pending'),
  (29, 19, '2026-09-30 09:00:00', 'Cash', 1980, 'Refunded'),
  (30, 20, '2026-10-10 09:00:00', 'UPI', 3150, 'Failed');

-- Maintenance_Record: 14 rows
INSERT INTO Maintenance_Record (vehicle_id, service_date, service_type, mileage_at_service, cost, notes) VALUES
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
  (20, '2026-08-01', 'Engine Overhaul', 40000, 55000, 'Cost exceeds value; vehicle decommissioned');

-- User_Account: 11 rows
INSERT INTO User_Account (user_id, username, email, password_hash, role, customer_id, branch_id) VALUES
  (1, 'admin', 'admin@urbandrive.example', '$2b$10$K88pTQSixH/i/6LyxQ807eJ.JTDDk.hns74mKyuyjqHt9G1P.2cC6', 'Admin', NULL, NULL),
  (2, 'mgr_downtown', 'mgr.downtown@urbandrive.example', '$2b$10$z0FhC.IelO34nic9US9rKOSSxAKht8nlijEdujQT8pxoVozPW4MB6', 'Branch_Manager', NULL, 1),
  (3, 'mgr_mumbai', 'mgr.mumbai@urbandrive.example', '$2b$10$X/4PbFp/yigyxt.Xec3WmuC7MAijtFsCGJjXXygx/cGr4CzcwApKi', 'Branch_Manager', NULL, 4),
  (4, 'cust_rohan', 'rohan.mehta@example.com', '$2b$10$Rr6wuH9jM0K2BY2duoFUTeTp/9.JxR1BkKmIcc4yi6ro9A1AG11ee', 'Customer', 1, NULL),
  (5, 'cust_ananya', 'ananya.iyer@example.com', '$2b$10$RmrgV3sSi1avEYsEG90bM.r0epnJdaickm2F0maHmmere6CHLDqC.', 'Customer', 2, NULL),
  (6, 'cust_vikram', 'vikram.singh@example.com', '$2b$10$HcY2FiSip7bWJMYl1PcA1O.RZRaH1JiFvvm/f306j0FqAPbtYc70y', 'Customer', 3, NULL),
  (7, 'cust_priya', 'priya.nair@example.com', '$2b$10$ZeqrOVfB0yidGOjjD4jAk.kk59sJl.yKAL5G4UaPtrGzVLSMFDHue', 'Customer', 4, NULL),
  (8, 'cust_arjun', 'arjun.reddy@example.com', '$2b$10$Hqbfj2X/639nbL00eQx3PuWX/pbhD7QGjVJjEKjc.rBr3me3H5Ol.', 'Customer', 5, NULL),
  (9, 'cust_sneha', 'sneha.kulkarni@example.com', '$2b$10$cP/df0kUjkeQcdi32qm.2.9CFr8c97VvAIf0e6vms.hZBkAQ5/AY2', 'Customer', 6, NULL),
  (10, 'cust_karthik', 'karthik.s@example.com', '$2b$10$CUWiojeMeq8vuxgvdFJaHuZSA0V2UycnyT/QryRDLr52NyU1ToAUm', 'Customer', 7, NULL),
  (11, 'cust_meera', 'meera.joshi@example.com', '$2b$10$K9TwkkAzVazAjCgyWOT7/uo/kueaeg2F3Zami.2ppiU.hoC.GT8KS', 'Customer', 8, NULL);
