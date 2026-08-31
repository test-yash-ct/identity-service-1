import { Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config";
import { RequestWithId } from "./requestId";
import { log } from "../lib/logger";

export interface AuthedRequest extends RequestWithId {
  user?: JwtPayload;
}

export function jwtMiddleware(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction
): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = auth.slice("Bearer ".length).trim();
  const parts = token.split(".");
  if (parts.length !== 3) {
    next();
    return;
  }

  let header: { alg?: string };
  try {
    header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  } catch {
    next();
    return;
  }

  if (!header.alg || header.alg === "none") {
    next();
    return;
  }

  jwt.verify(
    token,
    config.jwtSecret,
    { algorithms: ["HS256"], issuer: config.jwtIssuer },
    (err, decoded) => {
      if (!err && decoded) {
        req.user = decoded as JwtPayload;
      } else {
        log("warn", "jwt_verification_failed", { requestId: req.requestId });
      }
      next();
    }
  );
}
