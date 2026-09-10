import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { insertAuditEvent, pool } from "../db";
import { config } from "../config";
import { buildServiceEvent, ServiceEvent } from "../contracts/events";

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    public readonly httpStatus: number
  ) {
    super(code);
  }
}

export function validateLoginCredentials(email: string, password: string): string {
  const normalized = email.trim();
  if (!normalized || !password) {
    throw new DomainError("email_and_password_required", 400);
  }
  if (normalized.length > 320 || password.length > 256) {
    throw new DomainError("email_and_password_required", 400);
  }
  return normalized;
}

export async function authenticateUser(params: {
  email: string;
  password: string;
  requestId: string;
}): Promise<{ accessToken: string; expiresIn: number; event: ServiceEvent }> {
  const email = validateLoginCredentials(params.email, params.password);

  const user = await pool.query(
    "SELECT id, email, password_hash, role FROM users WHERE email = $1",
    [email]
  );
  if (user.rowCount === 0) {
    throw new DomainError("invalid_credentials", 401);
  }
  const row = user.rows[0] as {
    id: number;
    email: string;
    password_hash: string;
    role: string;
  };
  const ok = await bcrypt.compare(params.password, row.password_hash);
  if (!ok) {
    throw new DomainError("invalid_credentials", 401);
  }

  const accessToken = jwt.sign(
    { sub: String(row.id), role: row.role, email: row.email },
    config.jwtSecret,
    {
      algorithm: "HS256",
      expiresIn: "1h",
      issuer: config.jwtIssuer,
      header: { alg: "HS256", typ: "JWT" },
    }
  );

  await insertAuditEvent({
    action: "login_success",
    requestId: params.requestId,
    actor: String(row.id),
  });

  const event = buildServiceEvent({
    eventType: "identity.login_success",
    sourceService: "identity-service",
    requestId: params.requestId || "unknown",
    payload: { userId: row.id },
  });

  return { accessToken, expiresIn: 3600, event };
}
