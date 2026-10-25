import mysql, { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";

declare global {
  var __mysqlPool: Pool | undefined;
}

// All connection settings come from environment variables (see .env.example).
export function getPool(): Pool {
  if (!globalThis.__mysqlPool) {
    const user = process.env.MYSQL_USER;
    if (!user) throw new Error("MYSQL_USER is not set. Copy .env.example to .env.local and fill it in.");
    globalThis.__mysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST ?? "localhost",
      port: Number(process.env.MYSQL_PORT ?? 3306),
      user,
      password: process.env.MYSQL_PASSWORD ?? "",
      database: process.env.MYSQL_DATABASE ?? "mini_project",
      waitForConnections: true,
      connectionLimit: 10,
      decimalNumbers: true, // DECIMAL columns come back as numbers
      dateStrings: true, // DATE/DATETIME stay as 'YYYY-MM-DD HH:mm:ss' strings (no timezone shifts)
    });
  }
  return globalThis.__mysqlPool;
}

export async function query<T = RowDataPacket>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(sql, params);
  return rows as unknown as T[];
}

export async function one<T = RowDataPacket>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  return (await query<T>(sql, params))[0];
}

export async function execute(sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
  const [res] = await getPool().query<ResultSetHeader>(sql, params);
  return res;
}
