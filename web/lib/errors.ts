import { ZodError } from "zod";

interface MysqlError extends Error {
  code?: string;
  errno?: number;
  sqlState?: string;
  sqlMessage?: string;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Turns validation / database errors into safe JSON responses (no stack traces or SQL leak out).
export function errorResponse(e: unknown): Response {
  if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
  if (e instanceof ZodError) {
    const msg = e.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ");
    return Response.json({ error: msg }, { status: 400 });
  }
  const m = e as MysqlError;
  if (m?.sqlState === "45000" && m.sqlMessage) {
    // business rule raised by a trigger or stored procedure (SIGNAL)
    return Response.json({ error: m.sqlMessage }, { status: 409 });
  }
  switch (m?.code) {
    case "ER_DUP_ENTRY":
      return Response.json({ error: "A record with the same unique value already exists." }, { status: 409 });
    case "ER_CHECK_CONSTRAINT_VIOLATED":
      return Response.json({ error: "The values violate a database rule (CHECK constraint)." }, { status: 400 });
    case "ER_NO_REFERENCED_ROW_2":
      return Response.json({ error: "A referenced record does not exist." }, { status: 400 });
    case "ER_ROW_IS_REFERENCED_2":
      return Response.json({ error: "This record is referenced by other records and cannot be deleted." }, { status: 409 });
  }
  console.error(e);
  return Response.json({ error: "Unexpected server error." }, { status: 500 });
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}
