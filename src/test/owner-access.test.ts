import { describe, expect, it } from "vitest";
import { assertIsolatedAccess, assertOwnerIdentity, ownerCommand } from "@/lib/owner-access";

const owner = "00000000-0000-4000-8000-000000000001";
describe("Private owner access safeguards", () => {
  it("rejects disabled private access", () => {
    expect(() => assertIsolatedAccess(undefined, "isolated", "isolated")).toThrow();
  });
  it("rejects a shared or mismatched backend binding", () => {
    expect(() => assertIsolatedAccess("true", "isolated", "shared")).toThrow();
  });
  it("requires an explicit matching isolated backend", () => {
    expect(() => assertIsolatedAccess("true", undefined, undefined)).toThrow();
    expect(() => assertIsolatedAccess("true", "isolated", "isolated")).not.toThrow();
  });
  it("rejects an unverified owner account", () => {
    expect(() => assertOwnerIdentity({ id: owner }, owner)).toThrow("Forbidden");
  });
  it("rejects anonymous identities even with a configured ID", () => {
    expect(() => assertOwnerIdentity({ id: owner, email_confirmed_at: "2026-10-26", is_anonymous: true }, owner)).toThrow();
  });
  it("rejects self-appointed or non-owner identities", () => {
    expect(() => assertOwnerIdentity({ id: "another-user", email_confirmed_at: "2026-10-26" }, owner)).toThrow();
    expect(() => assertOwnerIdentity({ id: owner, email_confirmed_at: "2026-10-26" }, undefined)).toThrow();
  });
  it("accepts only the explicitly configured verified identity", () => {
    expect(() => assertOwnerIdentity({ id: owner, email_confirmed_at: "2026-10-26" }, owner)).not.toThrow();
  });
  it("never grants owner via an invitation", () => {
    expect(ownerCommand.safeParse({ action: "create", email: "fixture@example.test", expiresAt: "2026-10-27T16:00:00Z", role: "owner" }).success).toBe(false);
  });
  it("never promotes a membership to owner", () => {
    expect(ownerCommand.safeParse({ action: "member", id: owner, role: "owner", active: true }).success).toBe(false);
  });
  it("allows invitations to distinct accounts without a count cap", () => {
    for (let i = 0; i < 150; i++) expect(ownerCommand.safeParse({ action: "create", email: `fixture${i}@example.test`, expiresAt: "2026-10-27T16:00:00Z", role: "tester" }).success).toBe(true);
  });
  it("requires an email-bound invitation and explicit expiration", () => {
    expect(ownerCommand.safeParse({ action: "create", email: "not-an-email", role: "tester" }).success).toBe(false);
  });
  it("rejects malformed invitation tokens", () => {
    expect(ownerCommand.safeParse({ action: "accept", token: "arbitrary" }).success).toBe(false);
  });
});