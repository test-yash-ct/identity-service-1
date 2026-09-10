import express from "express";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import passwordResetRoutes from "./routes/passwordReset";
import { initSchema, pool } from "./db";
import { config } from "./config";
import { requestIdMiddleware, RequestWithId } from "./middleware/requestId";
import { log } from "./lib/logger";

async function main(): Promise<void> {
  await initSchema();
  const app = express();
  app.use(requestIdMiddleware);
  app.use(express.json({ limit: "256kb" }));

  app.get("/health", (req: RequestWithId, res) => {
    res.json({
      status: "ok",
      service: config.serviceName,
      version: config.version,
      requestId: req.requestId,
    });
  });

  app.get("/ready", async (req: RequestWithId, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({
        status: "ready",
        service: config.serviceName,
        version: config.version,
        requestId: req.requestId,
      });
    } catch (err) {
      log("error", "readiness_check_failed", {
        requestId: req.requestId,
        error: err instanceof Error ? err.message : String(err),
      });
      res.status(503).json({
        status: "not_ready",
        service: config.serviceName,
        version: config.version,
        requestId: req.requestId,
      });
    }
  });

  app.use("/v1/auth", authRoutes);
  app.use("/v1/auth/password-reset", passwordResetRoutes);
  app.use("/v1/admin", adminRoutes);

  app.listen(config.port, () => {
    log("info", "service_started", { port: config.port });
  });
}

main().catch((e) => {
  process.stderr.write(String(e));
  process.exit(1);
});
