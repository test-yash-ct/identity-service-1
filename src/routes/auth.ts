import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { insertAuditEvent, pool } from "../db";
import { config } from "../config";
import { RequestWithId } from "../middleware/requestId";
import { log } from "../lib/logger";

const router = Router();

router.post("/login", async (req: RequestWithId, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: "email_and_password_required" });
    return;
  }
  const user = await pool.query(
    "SELECT id, email, password_hash, role FROM users WHERE email = $1",
    [email]
  );
  if (user.rowCount === 0) {
    log("warn", "login_failed", { requestId: req.requestId, reason: "unknown_user" });
    res.status(401).json({ error: "invalid_credentials" });
    return;
  }
  const row = user.rows[0] as {
    id: number;
    email: string;
    password_hash: string;
    role: string;
  };
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) {
    log("warn", "login_failed", { requestId: req.requestId, reason: "bad_password" });
    res.status(401).json({ error: "invalid_credentials" });
    return;
  }
  const accessToken = jwt.sign(
    { sub: String(row.id), role: row.role, email: row.email },
    config.jwtSecret,
    { algorithm: "HS256", expiresIn: "1h", issuer: config.jwtIssuer }
  );
  log("info", "login_success", { requestId: req.requestId, userId: row.id });
  await insertAuditEvent({
    action: "login_success",
    requestId: req.requestId,
    actor: String(row.id),
  });
  res.json({ accessToken, expiresIn: 3600 });
});

export default router;
