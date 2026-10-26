import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertIsolatedAccess, assertOwnerIdentity, ownerCommand, type OwnerState } from "./owner-access";

export const ownerAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ownerCommand.parse(input))
  .handler(async ({ data, context }) => {
    assertIsolatedAccess(process.env["NUMBERSHIELD_DEV_ACCESS_ENABLED"], process.env["NUMBERSHIELD_ISOLATED_BACKEND_URL"], process.env["SUPABASE_URL"]);
    const { data: auth, error } = await context.supabase.auth.getUser();
    if (error || !auth.user || !auth.user.email_confirmed_at || auth.user.is_anonymous) throw new Error("Unauthorized");
    if (data.action !== "accept") assertOwnerIdentity(auth.user, process.env["NUMBERSHIELD_VERIFIED_OWNER_ID"]);
    // Prepared RPC is deliberately absent from generated types until isolated installation.
    const rpc = context.supabase.rpc.bind(context.supabase) as unknown as (name: string, args: { command: unknown }) => Promise<{ data: unknown; error: { message: string } | null }>;
    const result = await rpc("ns_owner_access", { command: data });
    if (result.error) throw new Error(result.error.message);
    return result.data as OwnerState & { token?: string; accepted?: boolean };
  });