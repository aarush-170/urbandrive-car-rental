# Demo guide: feature, where to see it, code to show

How to use: for each feature, show it in the app (or Workbench / Compass), then open the file at the line given. Line numbers are for the current `main`.
Logins (password `UrbanDrive@123`): `admin`, `mgr_downtown`, `cust_rohan`.

## A. Database design (requirement 4)
| Feature | Show | Code |
|---|---|---|
| ER diagram | `docs/diagrams/er_diagram_generated.png` | – |
| Entities, PK, FK, constraints | Workbench: tables and relationships | `database/01_schema.sql`: `Vehicle` line 54, `Rental_Booking` line 81, `User_Account` line 151 |
| Normalization | `docs/normalization.md` | – |
| NoSQL data model, indexes | Compass: `urbandrive` database | `mongodb/seed.js` lines 11 and 26 (documents), 41-46 (indexes) |

## B. SQL implementation (requirement 5)
| Feature | Show | Code |
|---|---|---|
| CREATE, primary and foreign keys | run `01_schema.sql` (wipes data) or show the file | `database/01_schema.sql`: foreign key `fk_booking_customer` line 101 |
| Constraints | try to insert a vehicle with a short VIN in Workbench: error 3819 | `01_schema.sql`: `chk_vehicle_vin` line 75, `chk_booking_dates` line 109 |
| Indexes | `SHOW INDEX FROM Rental_Booking;` | `01_schema.sql`: `idx_booking_vehicle_dates` line 99, FULLTEXT line 70 |
| ALTER and DROP | run `04_alter_examples.sql` (reverts itself) | `database/04_alter_examples.sql`: ALTER lines 9-16, DROP lines 36-40 |
| Views | `SELECT * FROM vw_revenue_by_category_quarter;` | `database/03_advanced.sql`: views at lines 11, 25, 38, 53 |

## C. Database operations (requirement 6)
| Feature | Show in app | Code |
|---|---|---|
| INSERT | Customers page: Register a customer | `web/app/api/customers/route.ts` line 21 |
| INSERT through a procedure | Bookings, New booking | `web/app/api/bookings/route.ts` line 30 (calls `sp_create_booking`) |
| UPDATE | Vehicle page: Send to workshop | `web/app/api/vehicles/[id]/route.ts` line 13 |
| DELETE | Maintenance page: Delete (admin only) | `web/app/api/maintenance/[id]/route.ts` line 8 |
| SELECT with JOIN, GROUP BY, ORDER BY | Customers list | `web/lib/queries.ts` lines 108-116 (`listCustomers`) |
| GROUP BY ... HAVING | Reports page, "Repeat customers" | `web/lib/queries.ts` lines 128-141 (`repeatCustomers`) |
| Subquery (NOT EXISTS) | Vehicles page: free from / free until, Search | `web/lib/queries.ts` line 85 (`availableVehicles`) |
| Full-text search | Vehicles page: search "creta" | `web/lib/queries.ts` line 62 (`MATCH ... AGAINST`) |

## D. The four key queries
| Query | Show | Code |
|---|---|---|
| Availability by branch, category, dates | Vehicles page: date range, Search | `web/lib/queries.ts` line 77 |
| Revenue by category per quarter | Reports page | view `database/03_advanced.sql` line 25; `web/lib/queries.ts` line 270 |
| Over 10,000 miles since service | Maintenance and Reports pages | view `database/03_advanced.sql` line 38; `web/lib/queries.ts` line 253 |
| Customer history with late fees | Customers, open a customer | view `database/03_advanced.sql` line 11; `web/lib/queries.ts` line 161 |

## E. Advanced database features (requirement 7: four SQL plus one NoSQL)
| Feature | Show | Code |
|---|---|---|
| Transactions | create a booking, then see the 30% advance payment appear in the same step | `database/03_advanced.sql`: `sp_create_booking` line 153, `START TRANSACTION` line 169, row lock `FOR UPDATE` line 173 |
| Stored procedures | Bookings: Start rental, Return vehicle, Cancel | lines 153, 197, 230, 277 |
| Stored function | Return a vehicle late: late fee is calculated | `fn_late_fee` line 68 |
| Triggers | book the same car for overlapping dates: "Vehicle is already booked" | `trg_booking_before_insert` line 93, `trg_booking_after_update` line 122, `trg_maintenance_before_insert` line 139 |
| Views | Workbench query on a view | lines 11, 25, 38, 53 |
| Indexing, full-text | see section B | – |
| NoSQL aggregation | Insights page (admin) | `web/lib/insights.ts`: rating by category line 49, damage by severity line 67, most damaged line 83, tags line 106 |
| NoSQL text search | Insights: Search reviews | `web/lib/insights.ts` lines 115-118 (`$text`) |

## F. Web interface (requirement 9)
Tables, forms, search, filters and dashboard: Dashboard (admin), Vehicles (search and filters), Bookings (status filter, action buttons), Customers (search), Reports, Insights.
Code: pages are in `web/app/*/page.tsx`; the shared form is `web/components/ApiForm.tsx`.

## G. Database and application integration (requirement 10)
| Feature | Code |
|---|---|
| API layer | Route Handlers in `web/app/api/` |
| Connection pool, settings from environment variables | `web/lib/db.ts` lines 10-14; template `web/.env.example` |
| Nothing secret in the code | show `.gitignore` (excludes `.env*`) and `web/.env.example` |

## H. Authentication and authorization (requirement 11)
| Feature | Show | Code |
|---|---|---|
| Login with hashed passwords | log in at `/login` | `web/app/api/auth/login/route.ts` line 28 (`bcrypt.compare`) |
| Signed session cookie | browser dev tools, Application, Cookies | `web/lib/auth.ts` lines 26-33 and 44-52 (`HttpOnly`) |
| Three roles | log in as `cust_rohan`: only Vehicles and Bookings in the menu | `web/proxy.ts` lines 7-13 and 32; `web/lib/auth.ts` lines 63 (`requirePage`) and 71 (`requireApi`) |
| Customers see only their own data | cust_rohan: Bookings shows 2 rows | `web/app/api/bookings/route.ts` lines 13 and 27 |
| Admin creates users | admin: Users page | `web/app/api/users/route.ts` (`bcrypt.hash`), `web/app/admin/users/page.tsx` |

## I. Validation and integrity (requirement 12)
| Feature | Show | Code |
|---|---|---|
| Validation in the database | Workbench: insert a bad row | CHECK and UNIQUE in `01_schema.sql`; triggers in `03_advanced.sql` |
| Validation in the app | Customers form: phone "12ab" | `web/lib/validation.ts` lines 18, 27, 49 |
| Database errors turned into safe messages | try double booking: a clean message, no SQL | `web/lib/errors.ts` lines 17-31 |
| Consistency | transaction rollback on failure | `sp_create_booking` exit handler: `database/03_advanced.sql` lines 163-166 |

## J. Security (requirement 13)
Passwords stored as bcrypt hashes: show `User_Account.password_hash` in Workbench (the `$2b$...` values), and `web/app/api/auth/login/route.ts`.
Credentials in environment variables: `web/lib/db.ts`, `web/.env.example`.
Parameterised SQL: every query in `web/lib/queries.ts` uses `?` placeholders.

## K. Tests (requirement 16)
Run `npm test` in `web/` with the app running: 26 tests pass. Code: `web/tests/api.test.mjs`. Results: `docs/final_report.md` section 10.

## L. Documentation and Git (requirements 14 and 15)
`docs/final_report.md` (problem, objectives, scope, requirements, schema, data dictionary, queries, architecture, screenshots, tests, conclusion), `docs/phase1_report.md`, `README.md`. Show `git log` with both members' commits.
