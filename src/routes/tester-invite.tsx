import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ownerAccess } from "@/lib/owner-access.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/tester-invite")({ validateSearch: z.object({ token: z.string().uuid().optional().catch(undefined) }), head: () => seo("Private tester invitation", "Accept an email-bound, single-use NumberShield tester invitation."), component: Page });
function Page() {
  const { token } = Route.useSearch();
  const call = useServerFn(ownerAccess);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return <main className="mx-auto max-w-lg space-y-5 px-4 py-12"><h1 className="text-2xl font-semibold">Private tester invitation</h1><div className="flex flex-wrap gap-3"><Button asChild variant="outline"><Link to="/auth" search={{ redirect: token ? `/tester-invite?token=${token}` : "/tester-invite" }}>Sign in to your own account</Link></Button><Button disabled={!token || busy} onClick={async () => { if (!token) return; setBusy(true); try { const result = await call({ data: { action: "accept", token } }); if (result.accepted) { await navigate({ to: "/dashboard" }); } else { setMessage("Invitation was not accepted."); } } catch (error) { const detail = error instanceof Error ? error.message : ""; setMessage(detail.includes("Unauthorized") ? "Sign in to your verified account before accepting this invitation." : detail.includes("isolated") ? "Private invitations are not enabled in this preview yet." : "This invitation could not be accepted. It may be expired, revoked, already used, or linked to another email."); } finally { setBusy(false); } }}>Accept invitation</Button></div>{message && <p role="status">{message}</p>}</main>;
}