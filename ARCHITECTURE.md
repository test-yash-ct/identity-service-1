# Identity Service Architecture

## Responsibilities

- Issue short-lived JWT access tokens after credential verification.
- Manage password reset token lifecycle.
- Expose operator admin APIs with role-based access control.

## Components

| Layer | Technology |
|-------|------------|
| HTTP API | Express on Node.js |
| Persistence | PostgreSQL (`users`, `password_reset_tokens`) |
| Observability | `X-Request-Id` middleware, JSON structured logs |

## Request correlation

Request-id middleware runs before JWT verification and route handlers. Auth, admin, and password-reset flows log with `requestId` for cross-service tracing with billing and webhook services.

## Platform integration

- Downstream services (`billing-service`, `webhook-service`) validate JWTs signed with the shared issuer and secret configured at deploy time.
