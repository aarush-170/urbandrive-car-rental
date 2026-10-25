-- UrbanDrive advanced SQL features: views, function, stored procedures (with
-- transactions) and triggers. Indexes and the FULLTEXT index are in 01_schema.sql.
-- Run after 01_schema.sql and 02_seed.sql (so the seed is not affected by triggers):
--   mysql -u <user> -p mini_project < database/03_advanced.sql

USE mini_project;

-- ---------------------------------------------------------------------------
-- VIEWS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_customer_booking_history AS
SELECT c.customer_id,
       CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
       b.booking_id, b.booking_status,
       CONCAT(v.make, ' ', v.model) AS vehicle, v.license_plate,
       pb.branch_name AS pickup_branch, db.branch_name AS dropoff_branch,
       b.start_date, b.end_date, b.actual_return_date,
       b.late_fee, b.total_amount
FROM Customer c
JOIN Rental_Booking b ON b.customer_id = c.customer_id
JOIN Vehicle v        ON v.vehicle_id = b.vehicle_id
JOIN Branch pb        ON pb.branch_id = b.pickup_branch_id
JOIN Branch db        ON db.branch_id = b.dropoff_branch_id;

CREATE OR REPLACE VIEW vw_revenue_by_category_quarter AS
SELECT vc.category_id, vc.category_name,
       YEAR(p.payment_date)    AS yr,
       QUARTER(p.payment_date) AS qtr,
       COUNT(DISTINCT b.booking_id) AS bookings,
       SUM(p.amount_paid)           AS revenue
FROM Payment p
JOIN Rental_Booking b   ON b.booking_id = p.booking_id
JOIN Vehicle v          ON v.vehicle_id = b.vehicle_id
JOIN Vehicle_Category vc ON vc.category_id = v.category_id
WHERE p.payment_status = 'Success'
GROUP BY vc.category_id, vc.category_name, YEAR(p.payment_date), QUARTER(p.payment_date);

CREATE OR REPLACE VIEW vw_maintenance_due AS
SELECT v.vehicle_id, v.make, v.model, v.license_plate, v.status,
       br.branch_name, v.current_mileage,
       COALESCE(m.last_service_mileage, 0) AS last_service_mileage,
       m.last_service_date,
       v.current_mileage - COALESCE(m.last_service_mileage, 0) AS miles_since_service
FROM Vehicle v
JOIN Branch br ON br.branch_id = v.current_branch_id
LEFT JOIN (SELECT vehicle_id,
                  MAX(mileage_at_service) AS last_service_mileage,
                  MAX(service_date)       AS last_service_date
           FROM Maintenance_Record
           GROUP BY vehicle_id) m ON m.vehicle_id = v.vehicle_id
WHERE v.status <> 'Decommissioned';

CREATE OR REPLACE VIEW vw_branch_availability AS
SELECT br.branch_id, br.branch_name, br.city,
       vc.category_id, vc.category_name,
       COUNT(v.vehicle_id) AS available_vehicles
FROM Branch br
JOIN Vehicle v           ON v.current_branch_id = br.branch_id AND v.status = 'Available'
JOIN Vehicle_Category vc ON vc.category_id = v.category_id
GROUP BY br.branch_id, br.branch_name, br.city, vc.category_id, vc.category_name;

DELIMITER $$

-- ---------------------------------------------------------------------------
-- FUNCTION: late-return penalty for a booking returned at p_actual
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_late_fee$$
CREATE FUNCTION fn_late_fee(p_booking_id INT, p_actual DATETIME)
RETURNS DECIMAL(10,2)
READS SQL DATA
BEGIN
  DECLARE v_end DATETIME;
  DECLARE v_rate DECIMAL(10,2);
  DECLARE v_hours INT;

  SELECT b.end_date, vc.late_fee_per_hour INTO v_end, v_rate
  FROM Rental_Booking b
  JOIN Vehicle v ON v.vehicle_id = b.vehicle_id
  JOIN Vehicle_Category vc ON vc.category_id = v.category_id
  WHERE b.booking_id = p_booking_id;

  IF v_end IS NULL OR p_actual <= v_end THEN
    RETURN 0;
  END IF;
  SET v_hours = CEILING(TIMESTAMPDIFF(MINUTE, v_end, p_actual) / 60);
  RETURN v_hours * v_rate;
END$$

-- ---------------------------------------------------------------------------
-- TRIGGERS (cross-table integrity rules that CHECK constraints cannot express)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_booking_before_insert$$
CREATE TRIGGER trg_booking_before_insert BEFORE INSERT ON Rental_Booking
FOR EACH ROW
BEGIN
  DECLARE v_license_expiry DATE;
  DECLARE v_status VARCHAR(20);

  IF NEW.booking_status IN ('Confirmed', 'Ongoing') THEN
    SELECT license_expiry_date INTO v_license_expiry
      FROM Customer WHERE customer_id = NEW.customer_id;
    IF v_license_expiry < DATE(NEW.end_date) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Driving licence expires before the rental ends';
    END IF;

    SELECT status INTO v_status FROM Vehicle WHERE vehicle_id = NEW.vehicle_id;
    IF v_status = 'Decommissioned' THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vehicle is decommissioned';
    END IF;

    IF EXISTS (SELECT 1 FROM Rental_Booking
               WHERE vehicle_id = NEW.vehicle_id
                 AND booking_status IN ('Confirmed', 'Ongoing')
                 AND start_date < NEW.end_date
                 AND end_date   > NEW.start_date) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vehicle is already booked for these dates';
    END IF;
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_booking_after_update$$
CREATE TRIGGER trg_booking_after_update AFTER UPDATE ON Rental_Booking
FOR EACH ROW
BEGIN
  IF NEW.booking_status = 'Ongoing' AND OLD.booking_status <> 'Ongoing' THEN
    UPDATE Vehicle SET status = 'Rented' WHERE vehicle_id = NEW.vehicle_id;
  ELSEIF NEW.booking_status = 'Completed' AND OLD.booking_status <> 'Completed' THEN
    UPDATE Vehicle
       SET status = 'Available',
           current_mileage = GREATEST(current_mileage, COALESCE(NEW.return_mileage, current_mileage)),
           current_branch_id = NEW.dropoff_branch_id
     WHERE vehicle_id = NEW.vehicle_id;
  ELSEIF NEW.booking_status = 'Cancelled' AND OLD.booking_status = 'Ongoing' THEN
    UPDATE Vehicle SET status = 'Available' WHERE vehicle_id = NEW.vehicle_id;
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_maintenance_before_insert$$
CREATE TRIGGER trg_maintenance_before_insert BEFORE INSERT ON Maintenance_Record
FOR EACH ROW
BEGIN
  DECLARE v_mileage INT;
  SELECT current_mileage INTO v_mileage FROM Vehicle WHERE vehicle_id = NEW.vehicle_id;
  IF NEW.mileage_at_service > v_mileage THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mileage at service exceeds the vehicle current mileage';
  END IF;
END$$

-- ---------------------------------------------------------------------------
-- STORED PROCEDURES (each runs as one transaction)
-- ---------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_create_booking$$
CREATE PROCEDURE sp_create_booking(
  IN  p_customer INT, IN p_vehicle INT, IN p_pickup INT, IN p_dropoff INT,
  IN  p_start DATETIME, IN p_end DATETIME, IN p_method VARCHAR(30),
  OUT p_booking_id INT)
BEGIN
  DECLARE v_mileage INT;
  DECLARE v_category INT;
  DECLARE v_rate DECIMAL(10,2);
  DECLARE v_total DECIMAL(10,2);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  -- lock the vehicle row so two clients cannot book the same car at once
  SELECT current_mileage, category_id INTO v_mileage, v_category
    FROM Vehicle WHERE vehicle_id = p_vehicle FOR UPDATE;
  IF v_category IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vehicle not found';
  END IF;

  SELECT base_rate_per_day INTO v_rate FROM Vehicle_Category WHERE category_id = v_category;
  SET v_total = CEILING(TIMESTAMPDIFF(MINUTE, p_start, p_end) / 1440) * v_rate;

  INSERT INTO Rental_Booking
    (customer_id, vehicle_id, pickup_branch_id, dropoff_branch_id, start_date, end_date,
     initial_mileage, booking_status, late_fee, total_amount)
  VALUES
    (p_customer, p_vehicle, p_pickup, p_dropoff, p_start, p_end,
     v_mileage, 'Confirmed', 0, v_total);
  SET p_booking_id = LAST_INSERT_ID();

  -- 30 percent advance is collected at booking time
  INSERT INTO Payment (booking_id, payment_date, payment_method, amount_paid, payment_status)
  VALUES (p_booking_id, NOW(), p_method, ROUND(v_total * 0.3, 2), 'Success');

  COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_start_rental$$
CREATE PROCEDURE sp_start_rental(IN p_booking INT)
BEGIN
  DECLARE v_vehicle INT;
  DECLARE v_status VARCHAR(20);
  DECLARE v_vstatus VARCHAR(20);
  DECLARE v_mileage INT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT vehicle_id, booking_status INTO v_vehicle, v_status
    FROM Rental_Booking WHERE booking_id = p_booking FOR UPDATE;
  IF v_status IS NULL OR v_status <> 'Confirmed' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only a Confirmed booking can be started';
  END IF;

  SELECT status, current_mileage INTO v_vstatus, v_mileage
    FROM Vehicle WHERE vehicle_id = v_vehicle FOR UPDATE;
  IF v_vstatus <> 'Available' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vehicle is not available for pickup';
  END IF;

  UPDATE Rental_Booking
     SET booking_status = 'Ongoing', initial_mileage = v_mileage
   WHERE booking_id = p_booking;   -- trigger marks the vehicle Rented
  COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_return_vehicle$$
CREATE PROCEDURE sp_return_vehicle(
  IN p_booking INT, IN p_return_mileage INT, IN p_actual DATETIME, IN p_method VARCHAR(30))
BEGIN
  DECLARE v_status VARCHAR(20);
  DECLARE v_start DATETIME;
  DECLARE v_end DATETIME;
  DECLARE v_vehicle INT;
  DECLARE v_rate DECIMAL(10,2);
  DECLARE v_late DECIMAL(10,2);
  DECLARE v_total DECIMAL(10,2);
  DECLARE v_paid DECIMAL(10,2);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT booking_status, start_date, end_date, vehicle_id INTO v_status, v_start, v_end, v_vehicle
    FROM Rental_Booking WHERE booking_id = p_booking FOR UPDATE;
  IF v_status IS NULL OR v_status <> 'Ongoing' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only an Ongoing booking can be returned';
  END IF;

  SELECT vc.base_rate_per_day INTO v_rate
    FROM Vehicle v JOIN Vehicle_Category vc ON vc.category_id = v.category_id
   WHERE v.vehicle_id = v_vehicle;

  SET v_late  = fn_late_fee(p_booking, p_actual);
  SET v_total = CEILING(TIMESTAMPDIFF(MINUTE, v_start, v_end) / 1440) * v_rate + v_late;

  UPDATE Rental_Booking
     SET actual_return_date = p_actual, return_mileage = p_return_mileage,
         late_fee = v_late, total_amount = v_total, booking_status = 'Completed'
   WHERE booking_id = p_booking;   -- trigger frees the vehicle, updates mileage and branch

  SELECT COALESCE(SUM(amount_paid), 0) INTO v_paid
    FROM Payment WHERE booking_id = p_booking AND payment_status = 'Success';
  IF v_total > v_paid THEN
    INSERT INTO Payment (booking_id, payment_date, payment_method, amount_paid, payment_status)
    VALUES (p_booking, p_actual, p_method, v_total - v_paid, 'Success');
  END IF;
  COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_cancel_booking$$
CREATE PROCEDURE sp_cancel_booking(IN p_booking INT)
BEGIN
  DECLARE v_status VARCHAR(20);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT booking_status INTO v_status
    FROM Rental_Booking WHERE booking_id = p_booking FOR UPDATE;
  IF v_status IS NULL OR v_status <> 'Confirmed' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only a Confirmed booking can be cancelled';
  END IF;

  UPDATE Payment SET payment_status = 'Refunded'
   WHERE booking_id = p_booking AND payment_status = 'Success';
  UPDATE Rental_Booking SET booking_status = 'Cancelled', total_amount = 0
   WHERE booking_id = p_booking;
  COMMIT;
END$$

DELIMITER ;
