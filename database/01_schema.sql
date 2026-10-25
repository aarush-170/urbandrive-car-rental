-- UrbanDrive Car Rental and Fleet Management System
-- Phase 1: database + table creation (DDL)
-- Usage: mysql -u <user> -p < database/01_schema.sql

CREATE DATABASE IF NOT EXISTS mini_project
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE mini_project;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS User_Account, Payment, Maintenance_Record, Rental_Booking,
                     Vehicle, Vehicle_Category, Customer, Branch;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE Branch (
  branch_id      INT NOT NULL AUTO_INCREMENT,
  branch_name    VARCHAR(100) NOT NULL,
  city           VARCHAR(50)  NOT NULL,
  address        VARCHAR(255) NOT NULL,
  contact_number VARCHAR(15)  NOT NULL,
  capacity       INT DEFAULT NULL,
  PRIMARY KEY (branch_id),
  CONSTRAINT chk_branch_capacity CHECK (capacity > 0),
  CONSTRAINT chk_branch_contact  CHECK (contact_number REGEXP '^[0-9+]{7,15}$')
) ENGINE=InnoDB;

CREATE TABLE Customer (
  customer_id         INT NOT NULL AUTO_INCREMENT,
  first_name          VARCHAR(50)  NOT NULL,
  last_name           VARCHAR(50)  NOT NULL,
  email               VARCHAR(100) NOT NULL,
  phone               VARCHAR(15)  NOT NULL,
  license_number      VARCHAR(30)  NOT NULL,
  license_expiry_date DATE NOT NULL,
  PRIMARY KEY (customer_id),
  UNIQUE KEY uq_customer_email (email),
  UNIQUE KEY uq_customer_license (license_number),
  CONSTRAINT chk_customer_email CHECK (email LIKE '%_@_%._%'),
  CONSTRAINT chk_customer_phone CHECK (phone REGEXP '^[0-9+]{7,15}$')
) ENGINE=InnoDB;

CREATE TABLE Vehicle_Category (
  category_id       INT NOT NULL AUTO_INCREMENT,
  category_name     VARCHAR(50)   NOT NULL,
  base_rate_per_day DECIMAL(10,2) NOT NULL,
  late_fee_per_hour DECIMAL(10,2) NOT NULL,
  security_deposit  DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (category_id),
  UNIQUE KEY uq_category_name (category_name),
  CONSTRAINT chk_cat_rate    CHECK (base_rate_per_day > 0),
  CONSTRAINT chk_cat_late    CHECK (late_fee_per_hour >= 0),
  CONSTRAINT chk_cat_deposit CHECK (security_deposit >= 0)
) ENGINE=InnoDB;

CREATE TABLE Vehicle (
  vehicle_id        INT NOT NULL AUTO_INCREMENT,
  vin               VARCHAR(17) NOT NULL,
  license_plate     VARCHAR(15) NOT NULL,
  make              VARCHAR(50) NOT NULL,
  model             VARCHAR(50) NOT NULL,
  manufacture_year  INT DEFAULT NULL,
  current_mileage   INT NOT NULL DEFAULT 0,
  status            VARCHAR(20) NOT NULL DEFAULT 'Available',
  category_id       INT NOT NULL,
  current_branch_id INT NOT NULL,
  PRIMARY KEY (vehicle_id),
  UNIQUE KEY uq_vehicle_vin (vin),
  UNIQUE KEY uq_vehicle_plate (license_plate),
  KEY idx_vehicle_category (category_id),
  KEY idx_vehicle_branch_status (current_branch_id, status, category_id),
  FULLTEXT KEY ft_vehicle_search (make, model),
  CONSTRAINT fk_vehicle_category FOREIGN KEY (category_id)
    REFERENCES Vehicle_Category (category_id) ON UPDATE CASCADE,
  CONSTRAINT fk_vehicle_branch FOREIGN KEY (current_branch_id)
    REFERENCES Branch (branch_id) ON UPDATE CASCADE,
  CONSTRAINT chk_vehicle_vin     CHECK (CHAR_LENGTH(vin) = 17),
  CONSTRAINT chk_vehicle_year    CHECK (manufacture_year >= 2000),
  CONSTRAINT chk_vehicle_mileage CHECK (current_mileage >= 0),
  CONSTRAINT chk_vehicle_status  CHECK (status IN ('Available','Rented','In_Maintenance','Decommissioned'))
) ENGINE=InnoDB;

CREATE TABLE Rental_Booking (
  booking_id         INT NOT NULL AUTO_INCREMENT,
  customer_id        INT NOT NULL,
  vehicle_id         INT NOT NULL,
  pickup_branch_id   INT NOT NULL,
  dropoff_branch_id  INT NOT NULL,
  start_date         DATETIME NOT NULL,
  end_date           DATETIME NOT NULL,
  actual_return_date DATETIME DEFAULT NULL,
  initial_mileage    INT NOT NULL,
  return_mileage     INT DEFAULT NULL,
  booking_status     VARCHAR(20) NOT NULL DEFAULT 'Confirmed',
  late_fee           DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount       DECIMAL(10,2) DEFAULT NULL,
  PRIMARY KEY (booking_id),
  KEY idx_booking_customer (customer_id),
  KEY idx_booking_pickup (pickup_branch_id),
  KEY idx_booking_dropoff (dropoff_branch_id),
  KEY idx_booking_vehicle_dates (vehicle_id, start_date, end_date),
  KEY idx_booking_status (booking_status),
  CONSTRAINT fk_booking_customer FOREIGN KEY (customer_id)
    REFERENCES Customer (customer_id) ON DELETE CASCADE,
  CONSTRAINT fk_booking_vehicle FOREIGN KEY (vehicle_id)
    REFERENCES Vehicle (vehicle_id) ON UPDATE CASCADE,
  CONSTRAINT fk_booking_pickup FOREIGN KEY (pickup_branch_id)
    REFERENCES Branch (branch_id),
  CONSTRAINT fk_booking_dropoff FOREIGN KEY (dropoff_branch_id)
    REFERENCES Branch (branch_id),
  CONSTRAINT chk_booking_dates   CHECK (end_date > start_date),
  CONSTRAINT chk_booking_mileage CHECK (return_mileage IS NULL OR return_mileage >= initial_mileage),
  CONSTRAINT chk_booking_status  CHECK (booking_status IN ('Confirmed','Ongoing','Completed','Cancelled')),
  CONSTRAINT chk_booking_late    CHECK (late_fee >= 0),
  CONSTRAINT chk_booking_total   CHECK (total_amount >= 0)
) ENGINE=InnoDB;

CREATE TABLE Payment (
  payment_id     INT NOT NULL AUTO_INCREMENT,
  booking_id     INT NOT NULL,
  payment_date   DATETIME NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  amount_paid    DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'Success',
  PRIMARY KEY (payment_id),
  KEY idx_payment_booking (booking_id),
  KEY idx_payment_status_date (payment_status, payment_date),
  CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id)
    REFERENCES Rental_Booking (booking_id) ON DELETE CASCADE,
  CONSTRAINT chk_payment_method CHECK (payment_method IN ('Credit Card','Debit Card','UPI','Net Banking','Cash')),
  CONSTRAINT chk_payment_amount CHECK (amount_paid > 0),
  CONSTRAINT chk_payment_status CHECK (payment_status IN ('Pending','Success','Refunded','Failed'))
) ENGINE=InnoDB;

CREATE TABLE Maintenance_Record (
  maintenance_id     INT NOT NULL AUTO_INCREMENT,
  vehicle_id         INT NOT NULL,
  service_date       DATE NOT NULL,
  service_type       VARCHAR(100) NOT NULL,
  mileage_at_service INT NOT NULL,
  cost               DECIMAL(10,2) NOT NULL,
  notes              TEXT,
  PRIMARY KEY (maintenance_id),
  KEY idx_maint_vehicle_date (vehicle_id, service_date),
  CONSTRAINT fk_maint_vehicle FOREIGN KEY (vehicle_id)
    REFERENCES Vehicle (vehicle_id) ON DELETE CASCADE,
  CONSTRAINT chk_maint_cost    CHECK (cost >= 0),
  CONSTRAINT chk_maint_mileage CHECK (mileage_at_service >= 0)
) ENGINE=InnoDB;

-- Application login accounts for role-based access in the web app.
-- password_hash holds a bcrypt hash; plain-text passwords are never stored.
CREATE TABLE User_Account (
  user_id       INT NOT NULL AUTO_INCREMENT,
  username      VARCHAR(50)  NOT NULL,
  email         VARCHAR(100) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  role          VARCHAR(20)  NOT NULL,
  customer_id   INT DEFAULT NULL,
  branch_id     INT DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_user_username (username),
  UNIQUE KEY uq_user_email (email),
  UNIQUE KEY uq_user_customer (customer_id),
  KEY idx_user_branch (branch_id),
  CONSTRAINT fk_user_customer FOREIGN KEY (customer_id) REFERENCES Customer (customer_id),
  CONSTRAINT fk_user_branch   FOREIGN KEY (branch_id)   REFERENCES Branch (branch_id),
  CONSTRAINT chk_user_role CHECK (role IN ('Admin','Branch_Manager','Customer')),
  CONSTRAINT chk_user_link CHECK (
    (role = 'Customer'       AND customer_id IS NOT NULL) OR
    (role = 'Branch_Manager' AND branch_id   IS NOT NULL) OR
    (role = 'Admin')
  )
) ENGINE=InnoDB;
