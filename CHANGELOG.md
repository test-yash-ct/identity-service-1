# Changelog

## 1.0.1

- Add request correlation via `X-Request-Id` middleware and structured logging
- Health and readiness endpoints return `service`, `version`, and `requestId`
- Configurable `SERVICE_NAME`, `LOG_LEVEL`, and `REQUEST_ID_HEADER`
