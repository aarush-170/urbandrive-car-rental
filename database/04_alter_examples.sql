-- UrbanDrive: ALTER / DROP demonstration (requirement: CREATE, ALTER, DROP)
-- Safe to run any number of times: every change made here is reverted at the end,
-- so the schema used by the web application is left exactly as 01_schema.sql created it.
-- Usage: mysql -u <user> -p mini_project < database/04_alter_examples.sql

USE mini_project;

-- 1. Add a column with a default, then constrain it
ALTER TABLE Customer ADD COLUMN loyalty_points INT NOT NULL DEFAULT 0 AFTER license_expiry_date;
ALTER TABLE Customer ADD CONSTRAINT chk_customer_loyalty CHECK (loyalty_points >= 0);

-- 2. Add a secondary index to speed up the "vehicles by age" filter
ALTER TABLE Vehicle ADD INDEX idx_vehicle_year (manufacture_year);

-- 3. Widen a column
ALTER TABLE Branch MODIFY address VARCHAR(300) NOT NULL;

-- 4. CREATE a throw-away table with a primary key and CHECK constraint (dropped again below)
CREATE TABLE Promo_Code (
  code        VARCHAR(20)  NOT NULL,
  percent_off TINYINT      NOT NULL,
  valid_until DATE         NOT NULL,
  PRIMARY KEY (code),
  CONSTRAINT chk_promo_percent CHECK (percent_off BETWEEN 1 AND 90)
) ENGINE=InnoDB;

-- Show the effect of the changes
SHOW COLUMNS FROM Customer LIKE 'loyalty_points';
SHOW INDEX FROM Vehicle WHERE Key_name = 'idx_vehicle_year';
SHOW CREATE TABLE Promo_Code;

-- The new CHECK constraint is enforced by the database (this statement must fail):
-- UPDATE Customer SET loyalty_points = -5 WHERE customer_id = 1;

-- 5. Revert everything: DROP COLUMN / CONSTRAINT / INDEX / TABLE
ALTER TABLE Customer DROP CONSTRAINT chk_customer_loyalty;
ALTER TABLE Customer DROP COLUMN loyalty_points;
ALTER TABLE Vehicle  DROP INDEX idx_vehicle_year;
ALTER TABLE Branch   MODIFY address VARCHAR(255) NOT NULL;
DROP TABLE Promo_Code;
