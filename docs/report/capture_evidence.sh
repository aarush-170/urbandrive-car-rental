#!/usr/bin/env bash
# Captures real command output for the report (docs/report/evidence/*.txt).
# Needs the app's databases running. Set MYSQL_PWD in your shell first (never commit it):
#   export MYSQL_PWD='your-mysql-password'
set -u
cd "$(dirname "$0")"
OUT=evidence
mkdir -p "$OUT"
MYSQL="${MYSQL_BIN:-mysql}"
MONGOSH="${MONGOSH_BIN:-mongosh}"

sql() { # name, statement(s)
  {
    echo "mysql> $2"
    "$MYSQL" -u "${MYSQL_USER:-root}" -t mini_project -e "$2" 2>&1 | grep -v "Using a password"
  } > "$OUT/$1.txt"
}

sql tables "SHOW TABLES;"
sql rowcounts "SELECT 'Branch' AS tbl, COUNT(*) AS row_count FROM Branch UNION ALL SELECT 'Vehicle_Category', COUNT(*) FROM Vehicle_Category UNION ALL SELECT 'Customer', COUNT(*) FROM Customer UNION ALL SELECT 'Vehicle', COUNT(*) FROM Vehicle UNION ALL SELECT 'Rental_Booking', COUNT(*) FROM Rental_Booking UNION ALL SELECT 'Payment', COUNT(*) FROM Payment UNION ALL SELECT 'Maintenance_Record', COUNT(*) FROM Maintenance_Record UNION ALL SELECT 'User_Account', COUNT(*) FROM User_Account;"
sql describe_vehicle "DESCRIBE Vehicle;"
sql triggers "SELECT TRIGGER_NAME, ACTION_TIMING, EVENT_MANIPULATION, EVENT_OBJECT_TABLE FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = 'mini_project';"
sql routines "SELECT ROUTINE_NAME, ROUTINE_TYPE FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = 'mini_project' ORDER BY ROUTINE_TYPE, ROUTINE_NAME;"
sql views "SELECT TABLE_NAME AS view_name FROM information_schema.VIEWS WHERE TABLE_SCHEMA = 'mini_project';"
sql indexes "SELECT TABLE_NAME, INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns_indexed, INDEX_TYPE FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'mini_project' AND TABLE_NAME IN ('rental_booking','vehicle','payment') GROUP BY TABLE_NAME, INDEX_NAME, INDEX_TYPE ORDER BY TABLE_NAME, INDEX_NAME;"
sql view_revenue "SELECT * FROM vw_revenue_by_category_quarter ORDER BY yr, qtr, revenue DESC;"
sql view_maintenance "SELECT make, model, license_plate, current_mileage, miles_since_service FROM vw_maintenance_due WHERE miles_since_service > 10000 ORDER BY miles_since_service DESC;"
sql having_query "SELECT c.customer_id, CONCAT(c.first_name,' ',c.last_name) AS customer_name, COUNT(*) AS completed_bookings, SUM(b.total_amount) AS total_spent FROM Customer c JOIN Rental_Booking b ON b.customer_id = c.customer_id WHERE b.booking_status = 'Completed' GROUP BY c.customer_id, c.first_name, c.last_name HAVING COUNT(*) >= 2 ORDER BY total_spent DESC;"
sql users_hashed "SELECT user_id, username, role, LEFT(password_hash, 7) AS hash_prefix, CHAR_LENGTH(password_hash) AS hash_length FROM User_Account;"
sql err_check "INSERT INTO Vehicle (vin, license_plate, make, model, manufacture_year, current_mileage, status, category_id, current_branch_id) VALUES ('SHORTVIN','ZZ00ZZ0000','Test','Car',2024,0,'Available',1,1);"
sql err_fk "DELETE FROM Branch WHERE branch_id = 1;"
sql err_trigger_overlap "CALL sp_create_booking(1, 11, 9, 9, '2026-11-11 10:00:00', '2026-11-12 10:00:00', 'UPI', @id);"
sql err_trigger_licence "CALL sp_create_booking(7, 4, 1, 1, '2027-01-05 10:00:00', '2027-01-08 10:00:00', 'UPI', @id);"
sql err_trigger_decommissioned "CALL sp_create_booking(1, 20, 10, 10, '2026-12-10 10:00:00', '2026-12-12 10:00:00', 'UPI', @id);"
sql err_trigger_maintenance "INSERT INTO Maintenance_Record (vehicle_id, service_date, service_type, mileage_at_service, cost) VALUES (1, '2026-11-15', 'Oil change', 99999999, 100);"

mongo() { # name, javascript
  {
    echo "urbandrive> $2"
    "$MONGOSH" "mongodb://localhost:27017/urbandrive" --quiet --eval "$2" 2>&1
  } > "$OUT/$1.txt"
}

mongo m_collections "db.getCollectionNames()"
mongo m_counts "printjson({ vehicle_inspections: db.vehicle_inspections.countDocuments(), vehicle_reviews: db.vehicle_reviews.countDocuments() })"
mongo m_findone "printjson(db.vehicle_inspections.findOne({ 'damages.0': { \$exists: true } }, { _id: 0 }))"
mongo m_indexes "printjson(db.vehicle_reviews.getIndexes().map(i => i.name).concat(db.vehicle_inspections.getIndexes().map(i => i.name)))"
mongo m_agg_rating "printjson(db.vehicle_reviews.aggregate([{ \$group: { _id: '\$category_id', avg_rating: { \$avg: '\$rating' }, reviews: { \$sum: 1 } } }, { \$sort: { avg_rating: -1 } }, { \$limit: 4 }]).toArray())"
mongo m_agg_damage "printjson(db.vehicle_inspections.aggregate([{ \$unwind: '\$damages' }, { \$group: { _id: '\$damages.severity', incidents: { \$sum: 1 } } }, { \$sort: { incidents: -1 } }]).toArray())"
mongo m_text_search "printjson(db.vehicle_reviews.find({ \$text: { \$search: 'battery' } }, { _id: 0, vehicle_id: 1, rating: 1, comment: 1 }).toArray())"
echo "evidence written to $OUT/"
