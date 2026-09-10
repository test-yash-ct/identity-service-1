# Identity Service

User identity, authentication, session tokens, and account lifecycle APIs for the Northwind Pay fintech platform.

## Overview

The identity service issues JWT access tokens, manages user profiles, enforces role-based access for platform operators, and coordinates password recovery flows integrated with customer support tooling.

## Local development

```bash
npm install
npm run dev
```

Service listens on `http://localhost:3001` by default.

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — system boundaries and data flows
- [API.md](./API.md) — HTTP routes and payloads
- [RUNBOOK.md](./RUNBOOK.md) — operations and incident response

## Testing

```bash
npm test
```

## Observability

Requests are correlated with `X-Request-Id` (override via `REQUEST_ID_HEADER`). Structured JSON logs include `requestId` and `service`. Configure `SERVICE_NAME` and `LOG_LEVEL` for deployment environments.

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Liveness — `{ status, service, version, requestId }` |
| `GET /ready` | Readiness — verifies PostgreSQL connectivity |
