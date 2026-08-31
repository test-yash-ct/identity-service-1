# Identity Service Runbook

## Ownership

Platform Security owns tier-1 on-call for authentication outages.

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVICE_NAME` | `identity-service` | Log and health identity |
| `LOG_LEVEL` | `info` | Log verbosity |
| `REQUEST_ID_HEADER` | `X-Request-Id` | Correlation header name |

## Probes

- **Liveness:** `GET /health`
- **Readiness:** `GET /ready` (requires PostgreSQL)

## Incident response

Authentication outages are declared in `#pay-incidents`. Correlate logs across services using the `requestId` field from client `X-Request-Id` headers.
