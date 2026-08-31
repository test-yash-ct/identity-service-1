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
  `);
  log("info", "schema_init_complete", { requestId });
}
