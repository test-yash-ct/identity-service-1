import { Pool } from "pg";
import { config } from "./config";
import { log } from "./lib/logger";

export const pool = new Pool({ connectionString: config.databaseUrl });

export async function initSchema(requestId?: string): Promise<void> {
  log("info", "schema_init_start", { requestId });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer'
    );
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id),
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE
    );
    CREATE TABLE IF NOT EXISTS observability_audit (
      id SERIAL PRIMARY KEY,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      service TEXT NOT NULL,
      action TEXT NOT NULL,
      request_id TEXT,
      actor TEXT
    );
  `);
  log("info", "schema_init_complete", { requestId });
}

/** Append-only: INSERT only. Never UPDATE or DELETE audit rows. */
export async function insertAuditEvent(params: {
  action: string;
  requestId?: string;
  actor?: string;
}): Promise<void> {
  await pool.query(
    `INSERT INTO observability_audit (service, action, request_id, actor)
     VALUES ($1, $2, $3, $4)`,
    [config.serviceName, params.action, params.requestId ?? null, params.actor ?? null]
  );
}
