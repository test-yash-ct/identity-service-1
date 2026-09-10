import test from "node:test";
import assert from "node:assert";
import { buildServiceEvent, isValidEventType } from "../src/contracts/events";
import { DomainError, validateLoginCredentials } from "../src/domain/auth";

test("validateLoginCredentials enforces presence and length bounds", () => {
  assert.strictEqual(validateLoginCredentials("  user@example.com  ", "pw"), "user@example.com");
  assert.throws(
    () => validateLoginCredentials("", "pw"),
    (err: unknown) => err instanceof DomainError && err.httpStatus === 400
  );
  assert.throws(
    () => validateLoginCredentials("user@example.com", "x".repeat(257)),
    (err: unknown) => err instanceof DomainError && err.code === "email_and_password_required"
  );
});

test("identity.login_success event payload contains userId only", () => {
  assert.strictEqual(isValidEventType("identity.login_success"), true);
  const event = buildServiceEvent({
    eventType: "identity.login_success",
    sourceService: "identity-service",
    requestId: "req-login",
    payload: { userId: 7 },
  });
  assert.strictEqual(event.sourceService, "identity-service");
  assert.deepStrictEqual(Object.keys(event.payload), ["userId"]);
  assert.strictEqual("password" in event.payload, false);
  assert.strictEqual("email" in event.payload, false);
});
