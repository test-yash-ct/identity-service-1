# Identity Service Architecture

## Responsibilities

- Issue short-lived JWT access tokens after credential verification.
- Manage password reset token lifecycle.
- Expose operator admin APIs with role-based access control.

## Layers

| Layer | Location | Responsibility |
|-------|----------|----------------|
| HTTP | `src/routes/*`, `src/middleware/*` | Request-id, JSON body bounds, HTTP status mapping |
| Domain | `src/domain/auth.ts` | Credential verification, JWT issuance, login event envelope |
| Persistence | `src/db.ts` | Parameterized SQL against `users`, `password_reset_tokens`, append-only `observability_audit` |

`users.role` is read from the database at login and copied into the JWT so role changes do not require a code deploy. Payment-platform resources in sibling services authorize by object owner, not a hardcoded admin flag.

## Observability

Request-id middleware runs before JWT verification and route handlers. Auth, admin, and password-reset flows log with `requestId` for cross-service tracing with billing and webhook services.

## Cross-service event contract (v1)

Shared envelope in `src/contracts/events.ts` (`eventType`, `sourceService`, `occurredAt`, `requestId`, `payload`). Successful login emits `identity.login_success` with `{ userId }` only — never password, token, or email in the payload.

## Platform integration

- Downstream services (`billing-service`, `webhook-service`) validate JWTs signed with the shared issuer and secret configured at deploy time (`HS256`, 1h expiry).
- Browser clients: no CORS middleware; APIs are not wildcard-open.
