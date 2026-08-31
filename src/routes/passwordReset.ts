import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pool } from "../db";
import { RequestWithId } from "../middleware/requestId";
import { log } from "../lib/logger";

const router = Router();

router.post("/request", async (req: RequestWithId, res: Response) => {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ error: "email_required" });
    return;
  }
  const user = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (user.rowCount === 0) {
    log("info", "password_reset_no_user", { requestId: req.requestId });
    res.status(202).json({ status: "if_exists_token_issued" });
    return;
  }
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [user.rows[0].id, token, expiresAt]
  );
  log("info", "password_reset_requested", { requestId: req.requestId });
  res.status(202).json({ status: "if_exists_token_issued", token });
});

router.post("/confirm", async (req: RequestWithId, res: Response) => {
  const { token, newPassword } = req.body as { token?: string; newPassword?: string };
  if (!token || !newPassword) {
    res.status(400).json({ error: "token_and_password_required" });
    return;
  }
  const row = await pool.query(
    `SELECT id, user_id, used FROM password_reset_tokens WHERE token = $1`,
    [token]
  );
  if (row.rowCount === 0) {
    res.status(400).json({ error: "invalid_token" });
    return;
  }
  const rec = row.rows[0] as { id: number; user_id: number; used: boolean };
  if (rec.used) {
    res.status(400).json({ error: "token_already_used" });
    return;
  }
  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    hash,
    rec.user_id,
  ]);
  await pool.query("UPDATE password_reset_tokens SET used = TRUE WHERE id = $1", [
    rec.id,
  ]);
  log("info", "password_reset_confirmed", { requestId: req.requestId });
  res.json({ status: "password_updated" });
});

export default router;
