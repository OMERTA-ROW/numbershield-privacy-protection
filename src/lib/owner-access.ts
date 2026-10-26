import { z } from "zod";

export const ownerCommand = z.discriminatedUnion("action", [
  z.object({ action: z.literal("list") }),
  z.object({ action: z.literal("create"), email: z.string().trim().email().max(255), expiresAt: z.string().datetime(), role: z.enum(["tester", "manager"]) }),
  z.object({ action: z.literal("revoke"), id: z.string().uuid() }),
  z.object({ action: z.literal("member"), id: z.string().uuid(), role: z.enum(["tester", "manager"]), active: z.boolean() }),
  z.object({ action: z.literal("accept"), token: z.string().uuid() }),
]);

/** Fail closed; this is configuration, never an identity or role source. */
export function assertIsolatedAccess(enabled: string | undefined, expected: string | undefined, actual: string | undefined) {
  if (enabled !== "true" || !expected || expected !== actual) {
    throw new Error("Owner access is unavailable until an isolated development backend is verified.");
  }
}

export function assertOwnerIdentity(user: { id: string; email_confirmed_at?: string | null; is_anonymous?: boolean }, ownerId: string | undefined) {
  if (!user.email_confirmed_at || user.is_anonymous || !ownerId || user.id !== ownerId) throw new Error("Forbidden");
}

export type OwnerState = {
  invitations: { id: string; email: string; role: "tester" | "manager"; status: string; expires_at: string }[];
  members: { id: string; role: "owner" | "tester" | "manager"; active: boolean }[];
};