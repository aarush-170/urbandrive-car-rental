# UrbanDrive – Car Rental and Fleet Management System

DBMS Level 3 Project (Dept. of CSE). UrbanDrive streamlines operations for distributed vehicle rental agencies: customers reserve vehicles, branch managers monitor local fleet availability, and fleet administrators audit revenue and maintenance.

## Stack
- Frontend + API: Next.js (Route Handlers)
- SQL: MySQL 8 (schema in `database/schema.sql`)
- NoSQL / Vector: TBD (e.g. MongoDB or pgvector/Qdrant – must be justified)
- Auth: role-based (minimum 2 roles, e.g. Admin, Customer)

## Core entities
Customer, Vehicle, Vehicle_Category, Branch, Rental_Booking, Payment, Maintenance_Record (ER diagram: `docs/er_diagram.pdf`).

## Key queries to support
1. Inventory availability by category/branch/date range
2. Revenue by vehicle category per quarter
3. Vehicles >10,000 miles since last maintenance
4. Customer booking history incl. late-return penalties

## Setup
```bash
mysql -u <user> -p < database/schema.sql
cp .env.example .env.local   # fill in values
npm install && npm run dev
```
(Next.js app not yet scaffolded.)

## Requirements checklist (see `docs/project_requirements.pdf`)
- [ ] ER diagram + relational schema
- [ ] DDL: CREATE/ALTER/DROP, constraints, indexes, views
- [ ] DML + JOIN/GROUP BY/HAVING/subqueries
- [ ] >=4 advanced SQL features (transactions, views, procedures, triggers, indexing, full-text)
- [ ] 1 NoSQL/vector feature
- [ ] Next.js UI + API layer, env-based config, hashed passwords
- [ ] Auth with >=2 roles
- [ ] DB-level validation
- [ ] Documentation, test cases, screenshots
- [ ] Commits showing each member's contribution

## Team
- aarush-170
- Abhay DB (abhaydb12)
