import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HttpError } from "./errors";

export type Role = "Admin" | "Branch_Manager" | "Customer";

export interface Session {
  userId: number;
  username: string;
  role: Role;
  customerId: number | null;
  branchId: number | null;
}

export const COOKIE = "ud_session";
const MAX_AGE = 60 * 60 * 8; // 8 hours

// The signing secret comes from the environment (see .env.example), never from source code.
export function secretKey(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters.");
  return new TextEncoder().encode(s);
}

export async function signSession(s: Session): Promise<string> {
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
}

export async function readToken(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function setSessionCookie(s: Session) {
  (await cookies()).set(COOKIE, await signSession(s), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  return readToken((await cookies()).get(COOKIE)?.value);
}

// Server component guard: redirects to /login, or to the role's home page when the role is not allowed.
export async function requirePage(roles?: Role[]): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  if (roles && !roles.includes(s.role)) redirect(s.role === "Customer" ? "/vehicles" : "/");
  return s;
}

// Route Handler guard: throws HttpError(401/403), which errorResponse turns into JSON.
export async function requireApi(roles?: Role[]): Promise<Session> {
  const s = await getSession();
  if (!s) throw new HttpError(401, "Please sign in.");
  if (roles && !roles.includes(s.role)) throw new HttpError(403, "Your role is not allowed to do this.");
  return s;
}

export const STAFF: Role[] = ["Admin", "Branch_Manager"];
export const ADMIN: Role[] = ["Admin"];
