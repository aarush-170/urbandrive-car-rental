"""Builds the final project report (docs/UrbanDrive_Final_Report.pdf).

Usage (from the repo root):   python docs/report/build_report.py
Needs: Python 3, `pip install pygments`, Google Chrome (used headless to print the PDF).
Edit the STUDENTS list below, then run again. Command output shown in the report comes from
docs/report/evidence/ (regenerate it with docs/report/capture_evidence.sh).
"""
import html
import os
import re
import subprocess
import sys
from datetime import date

from pygments import highlight
from pygments.formatters import HtmlFormatter
from pygments.lexers import get_lexer_by_name

# ---------------------------------------------------------------- edit these
TITLE = "UrbanDrive: Car Rental and Fleet Management System"
SUBTITLE = "DBMS Level 3 Project: Final Report"
STUDENTS = [
    # (name, SRN)   a value that starts with "<" is shown as a highlighted blank until it is filled in
    ("Aarush Muralidhara", "PES1UG24CS010"),
    ("Abhay Balakrishna Doddabalapur", "PES1UG24CS012"),
]
CHROME = os.environ.get("CHROME_BIN", r"C:\Program Files\Google\Chrome\Application\chrome.exe")
# -----------------------------------------------------------------------------

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
EVID = os.path.join(HERE, "evidence")
SHOTS = os.path.join(ROOT, "docs", "screenshots")
OUT_HTML = os.path.join(HERE, "report.html")
OUT_PDF = os.path.join(ROOT, "docs", "UrbanDrive_Final_Report.pdf")

fmt = HtmlFormatter(nowrap=True, style="friendly")
fig_no = 0


def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return f.read().replace("\r\n", "\n")


def esc(s):
    return html.escape(s)


def numbered(code, lang, start=1):
    lexer = get_lexer_by_name(lang)
    lines = highlight(code.rstrip("\n"), lexer, fmt).split("\n")
    rows = []
    for i, ln in enumerate(lines, start):
        rows.append(f'<span class="ln">{i}</span>{ln}')
    return "\n".join(rows)


def code_block(rel, lang, text=None, start=1, caption=None, title=None):
    """A code listing with a file-name bar and line numbers."""
    global fig_no
    body = text if text is not None else read(rel)
    fig_no += 1
    cap = caption or ""
    head = title or rel
    return (
        f'<figure class="code"><div class="bar">{esc(head)}</div>'
        f'<pre>{numbered(body, lang, start)}</pre>'
        f'<figcaption>Listing {fig_no}. {esc(cap)}</figcaption></figure>'
    )


def lines_of(rel, a, b):
    return "\n".join(read(rel).split("\n")[a - 1:b])


def between(rel, start_pat, end_pat):
    """Text from the line matching start_pat to the first later line matching end_pat (inclusive).
    Returns (text, first_line_number)."""
    ls = read(rel).split("\n")
    s = next(i for i, l in enumerate(ls) if re.search(start_pat, l))
    e = next(i for i in range(s, len(ls)) if re.search(end_pat, ls[i]))
    return "\n".join(ls[s:e + 1]), s + 1


def terminal(name, caption):
    global fig_no
    path = os.path.join(EVID, name + ".txt")
    with open(path, encoding="utf-8") as f:
        txt = f.read().replace("\r\n", "\n").rstrip("\n")
    fig_no += 1
    return (f'<figure class="term"><pre>{esc(txt)}</pre>'
            f'<figcaption>Output {fig_no}. {esc(caption)}</figcaption></figure>')


def shot(file, caption):
    global fig_no
    fig_no += 1
    return (f'<figure class="shot"><img src="../screenshots/{file}" alt="{esc(caption)}">'
            f'<figcaption>Figure {fig_no}. {esc(caption)}</figcaption></figure>')


def tree(path, prefix="", notes=None):
    skip = {"node_modules", ".next", ".git", "tsconfig.tsbuildinfo", ".env.local", "next-env.d.ts"}
    notes = notes or {}
    out = []
    entries = sorted(os.listdir(path), key=lambda n: (not os.path.isdir(os.path.join(path, n)), n.lower()))
    entries = [e for e in entries if e not in skip]
    for i, name in enumerate(entries):
        last = i == len(entries) - 1
        full = os.path.join(path, name)
        rel = os.path.relpath(full, os.path.join(ROOT, "web")).replace("\\", "/")
        note = notes.get(rel)
        out.append(f"{prefix}{'└── ' if last else '├── '}{name}{'/' if os.path.isdir(full) else ''}" + (f"   # {note}" if note else ""))
        if os.path.isdir(full):
            out.extend(tree(full, prefix + ("    " if last else "│   "), notes))
    return out


NOTES = {
    "app": "pages (App Router) and API routes",
    "app/api": "REST-style Route Handlers (the API layer)",
    "app/api/auth/login": "POST: check bcrypt hash, set session cookie",
    "app/api/bookings": "GET list, POST create (calls sp_create_booking)",
    "app/api/bookings/[id]/[action]": "POST start | return | cancel (stored procedures)",
    "app/api/customers": "GET search, POST register",
    "app/api/maintenance": "GET list, POST log a service",
    "app/api/reports/[name]": "GET revenue, maintenance-due, availability, customer-history",
    "app/api/users": "GET list, POST create user (admin only)",
    "app/api/vehicles": "GET list/search/availability, POST add vehicle",
    "app/api/vehicles/[id]/inspections": "MongoDB: inspections of a vehicle",
    "app/api/vehicles/[id]/reviews": "MongoDB: reviews of a vehicle",
    "app/admin/users": "admin page: list and create accounts",
    "app/login": "sign-in page",
    "app/insights": "MongoDB aggregation dashboard",
    "app/reports": "revenue, availability, repeat customers",
    "components": "shared UI (forms, buttons, badges)",
    "lib": "database access, validation, auth helpers",
    "lib/auth.ts": "session cookie (JWT), requirePage / requireApi",
    "lib/db.ts": "MySQL connection pool (settings from env vars)",
    "lib/mongo.ts": "MongoDB client and document types",
    "lib/queries.ts": "SQL queries used by pages and APIs",
    "lib/insights.ts": "MongoDB aggregation pipelines",
    "lib/validation.ts": "zod schemas for request bodies",
    "lib/errors.ts": "maps database errors to safe messages",
    "proxy.ts": "runs on every request: login and role check",
    "tests": "automated API tests",
    ".env.example": "template for environment variables",
}


def build():
    s = []
    css = open(os.path.join(HERE, "report.css"), encoding="utf-8").read()
    pyg = HtmlFormatter(style="friendly").get_style_defs(".code pre")
    s.append(f"<!doctype html><html><head><meta charset='utf-8'><title>{esc(TITLE)}</title><style>{css}\n{pyg}</style></head><body>")

    # 1. Title page + 2. students
    rows = "".join(
        f"<tr><td>{i}</td><td>{esc(n)}</td><td>{('<span class=blank>&nbsp;&nbsp;fill in SRN&nbsp;&nbsp;</span>' if r.startswith('<') else esc(r))}</td></tr>"
        for i, (n, r) in enumerate(STUDENTS, 1))
    s.append(f"""
<section class="cover">
  <div class="dept">Department of Computer Science and Engineering</div>
  <h1>{esc(TITLE)}</h1>
  <div class="sub">{esc(SUBTITLE)}</div>
  <h2 class="cover-h">Students' Names and SRNs</h2>
  <table class="names"><tr><th>#</th><th>Name</th><th>SRN</th></tr>{rows}</table>
  <div class="meta">Course project: Database Management Systems (Level 3)<br>{date.today().strftime('%B %Y')}</div>
  <div class="toc"><b>Contents</b>
    <ol>
      <li>Abstract</li><li>Tech Stack</li><li>SQL: Database Commands</li>
      <li>NoSQL: MongoDB Commands</li><li>Next.js: Project Tree Structure</li>
      <li>Sample Screenshots of Application Code and Demo</li>
    </ol></div>
</section>""")

    # 3. Abstract
    s.append("""
<h1>1. Abstract</h1>
<p>UrbanDrive is a car rental and fleet management system for agencies that run several branches from one shared fleet.
Customers reserve vehicles, branch managers monitor the availability of their branch, and administrators audit revenue and
maintenance. Agencies that track this in spreadsheets suffer double bookings, vehicles promised while they are in the workshop,
late fees calculated by hand, and vehicles that miss their service interval. UrbanDrive keeps one database as the single
source of truth and enforces the business rules inside the database itself.</p>
<p>The system uses two database paradigms, each chosen for the data it holds. <b>MySQL 8</b> stores the structured and strongly
related data (branches, customers, vehicles, categories, bookings, payments, maintenance records and user accounts) with primary
and foreign keys, CHECK constraints, indexes, views, triggers, a stored function and stored procedures that run as transactions.
<b>MongoDB</b> stores vehicle inspections and customer reviews as flexible documents, because their shape varies (fuel level for
petrol cars, battery percentage for electric cars, a damage list of any length); aggregation pipelines and a text index support
analytics and search.</p>
<p>A <b>Next.js</b> web application with Route Handlers provides the interface and the API layer. Users sign in with bcrypt-hashed
passwords and a signed session cookie, and three roles (Admin, Branch Manager and Customer) control what each person can see and
do; the rules are enforced in the request proxy, in every page and in every API route. An automated suite of 26 API tests checks the
role rules, input validation, triggers and transactions.</p>
""")

    # 4. Tech stack
    s.append("""
<h1>2. Tech Stack</h1>
<table class="grid">
<tr><th>Layer</th><th>Technology</th><th>Used for</th></tr>
<tr><td>Frontend</td><td>Next.js 16.4 (App Router, Turbopack), React 19, TypeScript 5, Tailwind CSS 4</td><td>Pages, forms, tables, dashboards</td></tr>
<tr><td>Backend / API</td><td>Next.js Route Handlers and a request proxy (<code>proxy.ts</code>)</td><td>REST-style endpoints, role checks</td></tr>
<tr><td>SQL database</td><td>MySQL 8 (InnoDB), <code>mysql2</code> driver</td><td>Tables, constraints, views, triggers, procedures, transactions</td></tr>
<tr><td>NoSQL database</td><td>MongoDB, <code>mongodb</code> driver 7</td><td>Inspections and reviews, aggregation, text search</td></tr>
<tr><td>Authentication</td><td><code>bcryptjs</code> (password hashing), <code>jose</code> (signed JWT session cookie)</td><td>Login and three roles</td></tr>
<tr><td>Validation</td><td><code>zod</code> in the API, CHECK constraints and triggers in MySQL</td><td>Input validation at both levels</td></tr>
<tr><td>Testing</td><td>Node.js built-in test runner (<code>node:test</code>)</td><td>26 end-to-end API tests</td></tr>
<tr><td>Tools</td><td>Git and GitHub, MySQL Workbench, MongoDB Compass, VS Code, Node.js 22</td><td>Version control, database administration</td></tr>
</table>
<p>Configuration (database host, user, password, MongoDB URI and the session-signing secret) is read from environment variables
(<code>web/.env.local</code>, template <code>web/.env.example</code>); no credentials are stored in the source code, and
<code>.env*</code> files are excluded from Git.</p>
""")

    # 5. SQL
    s.append('<h1 class="pb">3. SQL: Database Commands</h1>')
    s.append("<p>All SQL is in <code>database/</code>. Run in this order: <code>01_schema.sql</code>, <code>02_seed.sql</code>, "
             "<code>03_advanced.sql</code> (and optionally <code>04_alter_examples.sql</code>). The schema has 8 tables, 8 primary "
             "keys, 10 foreign keys, CHECK constraints on every table, 12 secondary indexes (one of them FULLTEXT) and 8 UNIQUE keys.</p>")
    s.append("<h2>3.1 Creating the database and tables (DDL)</h2>")
    s.append(code_block("database/01_schema.sql", "mysql", caption="CREATE DATABASE and CREATE TABLE with primary keys, foreign keys, UNIQUE, CHECK, indexes and FULLTEXT."))
    s.append("<h2>3.2 Sample data (DML: INSERT)</h2>")
    seed = read("database/02_seed.sql").split("\n")
    seed_ex = "\n".join(seed[0:25]) + "\n  ...\n" + "\n".join(seed[59:66]) + "\n  ...\n" + "\n".join(seed[82:88]) + "\n  ..."
    s.append(code_block("database/02_seed.sql", "mysql", text=seed_ex, caption="Excerpt of 02_seed.sql (the full file inserts 10 branches, 10 categories, 12 customers, 20 vehicles, 20 bookings, 30 payments, 14 maintenance records and 11 user accounts)."))
    s.append(terminal("rowcounts", "Row count of every table after loading the seed data."))
    s.append(terminal("tables", "Tables and views in the mini_project database."))
    s.append("<h2>3.3 ALTER and DROP</h2>")
    s.append(code_block("database/04_alter_examples.sql", "mysql", caption="ALTER TABLE (add column, constraint, index; modify column) and DROP; the script reverts itself."))
    s.append("<h2>3.4 Views, function, triggers and stored procedures (advanced features)</h2>")
    s.append(code_block("database/03_advanced.sql", "mysql", caption="4 views, 1 stored function, 3 triggers and 4 stored procedures; each procedure is one transaction with a rollback handler."))
    s.append(terminal("triggers", "The three triggers registered in MySQL."))
    s.append(terminal("routines", "The stored procedures and the stored function."))
    s.append(terminal("views", "The four views."))
    s.append(terminal("indexes", "Indexes on the booking, vehicle and payment tables (information_schema)."))
    s.append("<h2>3.5 Important queries (SELECT with JOIN, GROUP BY, HAVING, ORDER BY, subqueries)</h2>")
    av, a0 = between("web/lib/queries.ts", r"^export async function availableVehicles", r"^}")
    s.append(code_block("web/lib/queries.ts", "typescript", text=av, start=a0, caption="Availability by branch, category and dates (NOT EXISTS subquery) with full-text search in listVehicles."))
    ls_, l0 = between("web/lib/queries.ts", r"^export async function listVehicles", r"^}")
    s.append(code_block("web/lib/queries.ts", "typescript", text=ls_, start=l0, caption="Fleet search: MATCH ... AGAINST on the FULLTEXT index."))
    rp, r0 = between("web/lib/queries.ts", r"^// Repeat customers", r"^}")
    s.append(code_block("web/lib/queries.ts", "typescript", text=rp, start=r0, caption="GROUP BY with HAVING: customers with at least N completed bookings."))
    md, m0 = between("web/lib/queries.ts", r"^// Fleet maintenance", r"^}")
    s.append(code_block("web/lib/queries.ts", "typescript", text=md, start=m0, caption="Vehicles beyond 10,000 miles since the last service (reads a view)."))
    s.append(terminal("view_revenue", "Revenue by vehicle category per quarter (view with JOIN and GROUP BY)."))
    s.append(terminal("view_maintenance", "Vehicles over 10,000 miles since their last service."))
    s.append(terminal("having_query", "GROUP BY ... HAVING query (repeat customers)."))
    s.append("<h2>3.6 Constraints and triggers rejecting invalid data</h2>")
    for n, c in [("err_check", "CHECK constraint: a VIN must be 17 characters."),
                 ("err_fk", "Foreign key: a branch that still has bookings cannot be deleted."),
                 ("err_trigger_overlap", "Trigger: overlapping booking for the same vehicle is rejected."),
                 ("err_trigger_licence", "Trigger: licence expires before the rental ends."),
                 ("err_trigger_decommissioned", "Trigger: decommissioned vehicle cannot be booked."),
                 ("err_trigger_maintenance", "Trigger: service mileage above the vehicle's mileage.")]:
        s.append(terminal(n, c))
    s.append("<h2>3.7 Passwords stored as hashes</h2>")
    s.append(terminal("users_hashed", "User_Account stores bcrypt hashes ($2b$ prefix, 60 characters), never plain text."))

    # 6. NoSQL
    s.append('<h1 class="pb">4. NoSQL: MongoDB Commands</h1>')
    s.append("<p>Database <code>urbandrive</code>, collections <code>vehicle_inspections</code> and <code>vehicle_reviews</code>. "
             "Documents reference MySQL rows by id (<code>booking_id</code>, <code>vehicle_id</code>, <code>customer_id</code>, "
             "<code>category_id</code>). Load with <code>mongosh \"mongodb://localhost:27017\" mongodb/seed.js</code>.</p>")
    s.append("<h2>4.1 Inserting documents and creating indexes</h2>")
    s.append(code_block("mongodb/seed.js", "javascript", caption="insertMany into both collections and createIndex (compound, multikey and text indexes)."))
    s.append("<h2>4.2 Querying and aggregation in the shell</h2>")
    for n, c in [("m_collections", "Collections in the database."), ("m_counts", "Document counts."),
                 ("m_findone", "An inspection document with a variable-length damages array."),
                 ("m_indexes", "Indexes created on the two collections."),
                 ("m_agg_rating", "Aggregation: average rating per vehicle category ($group, $avg, $sort)."),
                 ("m_agg_damage", "Aggregation: damage incidents by severity ($unwind, $group)."),
                 ("m_text_search", "Text-index search over review comments.")]:
        s.append(terminal(n, c))
    s.append("<h2>4.3 Aggregation pipelines used by the application</h2>")
    ins = read("web/lib/insights.ts")
    rb, rb0 = between("web/lib/insights.ts", r"^export async function ratingByCategory", r"^}")
    s.append(code_block("web/lib/insights.ts", "typescript", text=rb, start=rb0, caption="Average rating by category."))
    db_, db0 = between("web/lib/insights.ts", r"^export async function damageBySeverity", r"^}")
    s.append(code_block("web/lib/insights.ts", "typescript", text=db_, start=db0, caption="Damage by severity ($unwind on the damages array)."))
    sr, sr0 = between("web/lib/insights.ts", r"^// Full-text search", r"^}")
    s.append(code_block("web/lib/insights.ts", "typescript", text=sr, start=sr0, caption="Review search with the MongoDB text index and relevance score."))

    # 7. Tree
    s.append('<h1 class="pb">5. Next.js: Project Tree Structure</h1>')
    s.append("<p>The web application is in <code>web/</code>. Pages are folders under <code>app/</code>; each folder under "
             "<code>app/api/</code> is one API endpoint. The repository also holds the database scripts and documents:</p>")
    s.append("<pre class='tree'>" + esc("urbandrive-car-rental/\n├── database/      # 01_schema, 02_seed, 03_advanced, 04_alter_examples (MySQL)\n├── mongodb/       # seed.js (MongoDB)\n├── docs/          # reports, diagrams, screenshots\n└── web/           # the Next.js application (below)") + "</pre>")
    t = "web/\n" + "\n".join(tree(os.path.join(ROOT, "web"), "", NOTES))
    s.append("<pre class='tree'>" + esc(t) + "</pre>")

    # 8. Screenshots
    s.append('<h1 class="pb">6. Sample Screenshots of Application Code and Demo</h1>')
    s.append("<h2>6.1 Application demo (screenshots)</h2>")
    for f, c in [("01-login.png", "Sign-in page."),
                 ("02-admin-dashboard.png", "Admin dashboard: live availability, revenue, upcoming rentals and vehicles due for service."),
                 ("03-vehicles.png", "Vehicles: fleet list with search and filters."),
                 ("17-fulltext-search.png", "Vehicle search using the MySQL FULLTEXT index (search: creta)."),
                 ("04-availability-search.png", "Availability search for a date range (NOT EXISTS subquery)."),
                 ("05-vehicle-detail-mongodb.png", "Vehicle detail: maintenance and booking history from MySQL, inspections and reviews from MongoDB."),
                 ("07-new-booking.png", "New booking form: created by a stored procedure inside one transaction."),
                 ("18-booking-transaction.png", "A new booking (#29) with its 30% advance payment (Paid 1,080 of 3,600) saved in the same transaction."),
                 ("19-trigger-double-booking.png", "Trigger rejects an overlapping booking: 'Vehicle is already booked for these dates'."),
                 ("20-trigger-licence-expiry.png", "Trigger rejects a rental that outlasts the customer's driving licence."),
                 ("06-bookings.png", "Bookings with lifecycle actions (start, return, cancel), late fees and payments."),
                 ("08-customer-history.png", "Customer page: booking history with late-return penalties (view)."),
                 ("09-maintenance.png", "Maintenance: service history and vehicles overdue for service."),
                 ("21-trigger-maintenance-mileage.png", "Trigger rejects a service record whose mileage exceeds the vehicle's mileage."),
                 ("10-reports.png", "Reports: revenue by category per quarter, maintenance due, availability by branch, repeat customers (GROUP BY ... HAVING)."),
                 ("11-insights-mongodb.png", "Insights: MongoDB aggregation pipelines and review text search."),
                 ("16-users-admin.png", "Admin user management: create accounts; password hashes are never shown."),
                 ("12-manager-dashboard.png", "Branch manager view: no Reports, Insights or Users in the menu."),
                 ("14-customer-vehicles.png", "Customer view: only Vehicles and Bookings."),
                 ("15-customer-own-bookings.png", "Customer view: only that customer's own bookings.")]:
        s.append(shot(f, c))

    s.append("<h2>6.2 Application code (excerpts)</h2>")
    s.append(code_block("web/proxy.ts", "typescript", caption="Request proxy: checks the signed session cookie and the role on every request."))
    s.append(code_block("web/lib/auth.ts", "typescript", caption="Session cookie (JWT) and the requirePage / requireApi role guards."))
    s.append(code_block("web/app/api/auth/login/route.ts", "typescript", caption="Login: bcrypt comparison, same error for a wrong user or password."))
    s.append(code_block("web/app/api/bookings/route.ts", "typescript", caption="Bookings API: customer scoping and the call to the sp_create_booking procedure."))
    s.append(code_block("web/app/api/users/route.ts", "typescript", caption="Admin-only user creation with bcrypt hashing."))
    tr, tr0 = between("database/03_advanced.sql", r"CREATE TRIGGER trg_booking_before_insert", r"^END\$\$")
    s.append(code_block("database/03_advanced.sql", "mysql", text=tr, start=tr0, caption="Trigger that blocks overlapping bookings, expired licences and decommissioned vehicles."))
    sp, sp0 = between("database/03_advanced.sql", r"CREATE PROCEDURE sp_create_booking", r"^END\$\$")
    s.append(code_block("database/03_advanced.sql", "mysql", text=sp, start=sp0, caption="Stored procedure: one transaction with a row lock, booking insert, advance payment and rollback handler."))
    t13, t130 = between("web/tests/api.test.mjs", r'^test\("TC13 ', r"^}\);")
    s.append(code_block("web/tests/api.test.mjs", "javascript", text=t13, start=t130, caption="Automated test: transaction, double-booking trigger and role rules through the API."))

    s.append("<h2>6.3 Test results</h2>")
    s.append(terminal("npm_test", "Output of npm test: 26 tests, 26 passed."))
    s.append("</body></html>")
    return "\n".join(s)


def main():
    css = os.path.join(HERE, "report.css")
    if not os.path.exists(css):
        sys.exit("report.css is missing next to build_report.py")
    with open(OUT_HTML, "w", encoding="utf-8") as f:
        f.write(build())
    cmd = [CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
           f"--print-to-pdf={OUT_PDF}", "--virtual-time-budget=20000", "file:///" + OUT_HTML.replace("\\", "/")]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print("wrote", OUT_PDF, f"({os.path.getsize(OUT_PDF) / 1024 / 1024:.1f} MB)")


if __name__ == "__main__":
    main()
