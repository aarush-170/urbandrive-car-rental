import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE, readToken, type Role } from "@/lib/auth";

// Optimistic role check on every request (signature + expiry only; the pages and Route Handlers
// re-check against the session and scope the data themselves).
const PAGE_ROLES: [string, Role[]][] = [
  ["/customers", ["Admin", "Branch_Manager"]],
  ["/maintenance", ["Admin", "Branch_Manager"]],
  ["/reports", ["Admin"]],
  ["/insights", ["Admin"]],
  ["/admin", ["Admin"]],
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const session = await readToken(req.cookies.get(COOKIE)?.value);

  if (pathname === "/login") {
    return session ? NextResponse.redirect(new URL("/", req.url)) : NextResponse.next();
  }
  if (pathname.startsWith("/api/auth/")) return NextResponse.next();

  if (!session) {
    return isApi
      ? Response.json({ error: "Please sign in." }, { status: 401 })
      : NextResponse.redirect(new URL("/login", req.url));
  }
  if (!isApi) {
    if (session.role === "Customer" && pathname === "/") return NextResponse.redirect(new URL("/vehicles", req.url));
    const rule = PAGE_ROLES.find(([p]) => pathname === p || pathname.startsWith(p + "/"));
    // a customer may open only their own /customers/:id, which the page itself verifies
    const ownProfile = session.role === "Customer" && pathname.startsWith("/customers/");
    if (rule && !rule[1].includes(session.role) && !ownProfile) {
      return NextResponse.redirect(new URL(session.role === "Customer" ? "/vehicles" : "/", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
