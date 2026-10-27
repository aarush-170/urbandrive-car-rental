import bcrypt from "bcryptjs";
import { z } from "zod";
import { setSessionCookie, type Role } from "@/lib/auth";
import { one } from "@/lib/db";
import { errorResponse, HttpError, readJson } from "@/lib/errors";

const loginSchema = z.object({ username: z.string().trim().min(1).max(50), password: z.string().min(1).max(100) });

// Compared against when the username does not exist, so response time does not reveal valid usernames.
const DUMMY_HASH = "$2b$10$K88pTQSixH/i/6LyxQ807eJ.JTDDk.hns74mKyuyjqHt9G1P.2cC6";

interface UserRow {
  user_id: number;
  username: string;
  password_hash: string;
  role: Role;
  customer_id: number | null;
  branch_id: number | null;
}

export async function POST(req: Request) {
  try {
    const { username, password } = loginSchema.parse(await readJson(req));
    const user = await one<UserRow>(
      "SELECT user_id, username, password_hash, role, customer_id, branch_id FROM User_Account WHERE username = ?",
      [username],
    );
    const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
    if (!user || !ok) throw new HttpError(401, "Invalid username or password.");
    await setSessionCookie({
      userId: user.user_id, username: user.username, role: user.role, customerId: user.customer_id, branchId: user.branch_id,
    });
    return Response.json({ ok: true, role: user.role });
  } catch (e) {
    return errorResponse(e);
  }
}
