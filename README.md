# UrbanDrive – Car Rental and Fleet Management System

DBMS Level 3 Project (Dept. of CSE). UrbanDrive streamlines operations for distributed vehicle rental agencies: customers reserve vehicles, branch managers monitor local fleet availability, and fleet administrators audit revenue and maintenance.

## Stack
- Frontend + API: Next.js (App Router, Route Handlers) in `web/`
- SQL: MySQL 8 (`database/`)
- NoSQL: MongoDB (`mongodb/`) for vehicle inspections and customer reviews
- Auth: login with bcrypt-hashed passwords and a signed session cookie; role-based access (Admin, Branch Manager, Customer)

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
mysql -u <user> -p mini_project < database/04_alter_examples.sql   # optional: ALTER/DROP demo, reverts itself

# 2. MongoDB sample data (database "urbandrive")
mongosh "mongodb://localhost:27017" mongodb/seed.js

# 3. Web app
cd web
cp .env.example .env.local   # fill in MYSQL_USER / MYSQL_PASSWORD and AUTH_SECRET (random 32+ chars)
npm install
npm run dev                  # http://localhost:3000
npm test                     # API test suite (18 tests); run while the app is up
```

Demo logins (development password `UrbanDrive@123`, stored only as bcrypt hashes):

| Role | Username |
|---|---|
| Admin | `admin` |
| Branch Manager | `mgr_downtown`, `mgr_mumbai` |
| Customer | `cust_rohan`, `cust_ananya`, `cust_vikram`, ... |

`database/tools/gen_seed.py` regenerates `02_seed.sql` (needs the `bcrypt` Python package).

## Key queries supported
1. Inventory availability by category/branch/date range (Vehicles page)
2. Revenue by vehicle category per quarter (Reports page)
3. Vehicles >10,000 miles since last maintenance (Maintenance and Reports pages)
4. Customer booking history incl. late-return penalties (Customer page)

## Requirements checklist (see `docs/project_requirements.pdf`)
- [x] ER diagram + relational schema (redraw PDF to the corrected model)
- [x] DDL: CREATE/ALTER/DROP, constraints, indexes, views (`database/04_alter_examples.sql`)
- [x] DML + JOIN/GROUP BY/HAVING/subqueries
- [x] >=4 advanced SQL features (transactions, views, procedures, triggers, indexing, full-text)
- [x] 1 NoSQL/vector feature (MongoDB aggregation + text search)
- [x] Next.js UI + API layer, env-based config
- [x] Auth with >=2 roles (3 roles, enforced in proxy, pages and API)
- [x] DB-level validation
- [x] Documentation, test cases, screenshots: [`docs/final_report.md`](docs/final_report.md), `web/tests/api.test.mjs`, `docs/screenshots/`
- [ ] Commits showing each member's contribution (each member must commit their own work)

## Team
- aarush-170
- Abhay DB (abhaydb12)
