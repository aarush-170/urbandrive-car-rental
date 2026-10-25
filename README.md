# UrbanDrive – Car Rental and Fleet Management System

DBMS Level 3 Project (Dept. of CSE). UrbanDrive streamlines operations for distributed vehicle rental agencies: customers reserve vehicles, branch managers monitor local fleet availability, and fleet administrators audit revenue and maintenance.

## Stack
- Frontend + API: Next.js (App Router, Route Handlers) in `web/`
- SQL: MySQL 8 (`database/`)
- NoSQL: MongoDB (`mongodb/`) for vehicle inspections and customer reviews
- Auth: role-based (Admin, Branch Manager, Customer) - login screen still to do

## Core entities
Customer, Vehicle, Vehicle_Category, Branch, Rental_Booking, Payment, Maintenance_Record, User_Account.
ER diagram: `docs/er_diagram.pdf` (see `docs/phase1_report.md` for the corrected model).
Full phase 1 write-up (problem statement, ER, schema, database choice, queries, plan): [`docs/phase1_report.md`](docs/phase1_report.md).

## Setup
Prerequisites: Node.js 20+, MySQL 8, MongoDB.

```bash
# 1. MySQL: schema, sample data, views/triggers/procedures (run in this order)
mysql -u <user> -p < database/01_schema.sql
mysql -u <user> -p mini_project < database/02_seed.sql
mysql -u <user> -p mini_project < database/03_advanced.sql

# 2. MongoDB sample data (database "urbandrive")
mongosh "mongodb://localhost:27017" mongodb/seed.js

# 3. Web app
cd web
cp .env.example .env.local   # fill in MYSQL_USER / MYSQL_PASSWORD
npm install
npm run dev                  # http://localhost:3000
```

`database/tools/gen_seed.py` regenerates `02_seed.sql` (needs the `bcrypt` Python package).

## Key queries supported
1. Inventory availability by category/branch/date range (Vehicles page)
2. Revenue by vehicle category per quarter (Reports page)
3. Vehicles >10,000 miles since last maintenance (Maintenance and Reports pages)
4. Customer booking history incl. late-return penalties (Customer page)

## Requirements checklist (see `docs/project_requirements.pdf`)
- [x] ER diagram + relational schema (redraw PDF to the corrected model)
- [x] DDL: CREATE/DROP, constraints, indexes, views (ALTER examples to add)
- [x] DML + JOIN/GROUP BY/HAVING/subqueries
- [x] >=4 advanced SQL features (transactions, views, procedures, triggers, indexing, full-text)
- [x] 1 NoSQL/vector feature (MongoDB aggregation + text search)
- [x] Next.js UI + API layer, env-based config (hashed passwords stored; login pending)
- [ ] Auth with >=2 roles
- [x] DB-level validation
- [ ] Documentation, test cases, screenshots
- [ ] Commits showing each member's contribution

## Team
- aarush-170
- Abhay DB (abhaydb12)
