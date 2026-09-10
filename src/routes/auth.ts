import { Router, Response } from "express";
import { RequestWithId } from "../middleware/requestId";
import { log } from "../lib/logger";
import { authenticateUser, DomainError } from "../domain/auth";

const router = Router();

router.post("/login", async (req: RequestWithId, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: "email_and_password_required" });
    return;
  }
  try {
    const result = await authenticateUser({
      email,
      password,
      requestId: req.requestId || "unknown",
    });
    log("info", "login_success", { requestId: req.requestId, userId: result.event.payload.userId });
    res.json({
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      event: result.event,
    });
  } catch (err) {
    if (err instanceof DomainError) {
      if (err.code === "invalid_credentials") {
        log("warn", "login_failed", {
          requestId: req.requestId,
          reason: "rejected",
        });
      }
      res.status(err.httpStatus).json({ error: err.code });
      return;
    }
    throw err;
  }
});

export default router;
