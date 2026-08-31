import packageJson from "../package.json";

export const config = {
  serviceName: process.env.SERVICE_NAME || "identity-service",
  logLevel: process.env.LOG_LEVEL || "info",
  requestIdHeader: process.env.REQUEST_ID_HEADER || "X-Request-Id",
  version: packageJson.version,
  port: parseInt(process.env.PORT || "3001", 10),
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgres://northwind:northwind@localhost:5432/identity",
  jwtSecret: process.env.JWT_SECRET || "northwind-dev-jwt-secret",
  jwtIssuer: process.env.JWT_ISSUER || "northwind-pay-identity",
};
