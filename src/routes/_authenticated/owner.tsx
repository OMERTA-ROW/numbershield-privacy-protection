import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ownerAccess } from "@/lib/owner-access.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/owner")({ head: () => seo("Private owner access", "Verified NumberShield owner invitations and private tester membership."), component: Page });

function Page() {
  const call = useServerFn(ownerAccess);
  const qc = useQueryClient();
  const state = useQuery({ queryKey: ["owner-access"], queryFn: () => call({ data: { action: "list" } }), retry: false });
  const [email, setEmail] = useState("");
  const [expiry, setExpiry] = useState("");
  const [role, setRole] = useState<"tester" | "manager">("tester");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  async function run(data: Parameters<typeof call>[0]["data"]) {
    setBusy(true);
    try { const result = await call({ data }); await qc.invalidateQueries({ queryKey: ["owner-access"] }); return result; }
    catch (error) { toast.error(error instanceof Error ? error.message : "Access unavailable"); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6">
    <h1 className="text-2xl font-semibold">Private owner access</h1>
    {state.isPending ? <p role="status">Checking access…</p> : state.error ? <p role="alert" className="text-warning">{state.error.message}</p> : <>
      <form className="grid gap-4" onSubmit={async (event) => { event.preventDefault(); if (!expiry) return; const result = await run({ action: "create", email, expiresAt: new Date(expiry).toISOString(), role }); if (result?.token) { setLink(`${window.location.origin}/tester-invite?token=${result.token}`); setEmail(""); } }}>
        <div><Label htmlFor="tester-email">Tester email</Label><Input id="tester-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div><Label htmlFor="tester-expiry">Expires at</Label><Input id="tester-expiry" type="datetime-local" required value={expiry} onChange={e => setExpiry(e.target.value)} /></div>
        <select aria-label="Tester role" value={role} onChange={e => setRole(e.target.value === "manager" ? "manager" : "tester")} className="rounded-md border border-input bg-background p-2"><option value="tester">Tester</option><option value="manager">Membership manager</option></select>
        <Button disabled={busy} type="submit">Create single-use invitation</Button>
      </form>
      {link && <div className="space-y-2"><Input aria-label="New invitation link" readOnly value={link} /><Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(link); toast.success("Link copied; no email sent"); } catch { toast.error("Copy the link from the field"); } }}>Copy link</Button></div>}
      <section className="space-y-3"><h2 className="text-lg font-semibold">Invitations</h2>{!state.data?.invitations.length && <p className="text-muted-foreground">No tester invitations.</p>}{state.data?.invitations.map(i => <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3"><span>{i.email} · {i.role} · {i.status} · {new Date(i.expires_at).toLocaleString()}</span><Button variant="outline" disabled={busy || i.status !== "pending"} onClick={() => run({ action: "revoke", id: i.id })}>Revoke</Button></div>)}</section>
      <section className="space-y-3"><h2 className="text-lg font-semibold">Members</h2>{!state.data?.members.length && <p className="text-muted-foreground">No members.</p>}{state.data?.members.map(m => <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3"><span className="break-all">{m.id} · {m.role} · {m.active ? "Active" : "Suspended"}</span>{m.role !== "owner" && <span className="flex gap-2"><select aria-label={`Role for ${m.id}`} className="rounded-md border border-input bg-background p-2" disabled={busy} value={m.role} onChange={e => run({ action: "member", id: m.id, role: e.target.value === "manager" ? "manager" : "tester", active: m.active })}><option value="tester">Tester</option><option value="manager">Membership manager</option></select><Button variant="outline" disabled={busy} onClick={() => run({ action: "member", id: m.id, role: m.role === "manager" ? "manager" : "tester", active: !m.active })}>{m.active ? "Suspend" : "Restore"}</Button></span>}</div>)}</section>
    </>}
  </div>;
}