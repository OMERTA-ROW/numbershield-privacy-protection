import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/lib/auth";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => seo("Team & family", "Invite members and manage roles."),
  component: Page,
});

type Role = "owner" | "admin" | "member";

function Page() {
  const { user } = useUser();
  const qc = useQueryClient();
  const [newOrg, setNewOrg] = useState("");
  const { data: orgs } = useQuery({
    queryKey: ["orgs"],
    queryFn: async () => (await supabase.from("organizations").select("id,name,memberships(id,user_id,role)").order("created_at")).data ?? [],
  });

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    const name = newOrg.trim();
    if (!name || name.length > 120 || !user) return;
    const { error } = await supabase.from("organizations").insert({ name, created_by: user.id });
    if (error) return toast.error(error.message);
    setNewOrg("");
    qc.invalidateQueries({ queryKey: ["orgs"] });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Team & family</h1>
        <p className="mt-1 text-muted-foreground">Members never see each other’s numbers. Owners and admins manage membership only.</p>
      </div>
      <form onSubmit={createOrg} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5"><Label htmlFor="org">New group name</Label><Input id="org" placeholder="e.g. The Rivera family" value={newOrg} onChange={(e) => setNewOrg(e.target.value)} /></div>
        <Button type="submit">Create group</Button>
      </form>
      {orgs?.map((o) => {
        const me = o.memberships.find((m) => m.user_id === user?.id);
        return <OrgCard key={o.id} org={o} myRole={(me?.role ?? "member") as Role} userId={user?.id} />;
      })}
    </div>
  );
}

function OrgCard({ org, myRole, userId }: { org: { id: string; name: string; memberships: { id: string; user_id: string; role: Role }[] }; myRole: Role; userId?: string }) {
  const qc = useQueryClient();
  const canManage = myRole === "owner" || myRole === "admin";
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const { data: invites } = useQuery({
    queryKey: ["invites", org.id],
    enabled: canManage,
    queryFn: async () => (await supabase.from("invitations").select("*").eq("org_id", org.id).eq("status", "pending")).data ?? [],
  });

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    const p = z.string().trim().email().max(255).safeParse(email);
    if (!p.success || !userId) return toast.error("Enter a valid email");
    const { error } = await supabase.from("invitations").insert({ org_id: org.id, email: p.data.toLowerCase(), role, invited_by: userId });
    if (error) return toast.error(error.message);
    setEmail("");
    toast.success("Invitation created. Copy the link and share it — no email is sent in beta.");
    qc.invalidateQueries({ queryKey: ["invites", org.id] });
  }
  async function revokeInvite(id: string) {
    await supabase.from("invitations").update({ status: "revoked" }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["invites", org.id] });
  }
  async function setMemberRole(id: string, r: Role) {
    const { error } = await supabase.from("memberships").update({ role: r }).eq("id", id);
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["orgs"] });
  }
  async function removeMember(id: string) {
    if (!confirm("Remove this member?")) return;
    const { error } = await supabase.from("memberships").delete().eq("id", id);
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["orgs"] });
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{org.name}</h2>
        <span className="text-xs text-muted-foreground">Your role: {myRole}</span>
      </div>
      <ul className="mt-4 divide-y divide-border">
        {org.memberships.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
            <span>{m.user_id === userId ? "You" : `Member ${m.user_id.slice(0, 8)}`}</span>
            {canManage && m.role !== "owner" && m.user_id !== userId ? (
              <span className="flex items-center gap-2">
                <select aria-label="Role" value={m.role} onChange={(e) => setMemberRole(m.id, e.target.value as Role)} className="h-8 rounded-md border border-input bg-background px-2 text-sm">
                  <option value="member">member</option><option value="admin">admin</option>
                </select>
                <Button size="sm" variant="ghost" onClick={() => removeMember(m.id)}>Remove</Button>
              </span>
            ) : <span className="text-muted-foreground">{m.role}</span>}
          </li>
        ))}
      </ul>
      {canManage && (
        <>
          <form onSubmit={invite} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <div className="space-y-1.5"><Label htmlFor={`inv-${org.id}`}>Invite by email</Label><Input id={`inv-${org.id}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <select aria-label="Invite role" value={role} onChange={(e) => setRole(e.target.value as Role)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option value="member">member</option><option value="admin">admin</option>
            </select>
            <Button type="submit">Create invite</Button>
          </form>
          {invites && invites.length > 0 && (
            <ul className="mt-4 space-y-2">
              {invites.map((i) => {
                const link = `${window.location.origin}/invite/${i.token}`;
                return (
                  <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                    <span>{i.email} · {i.role} · pending</span>
                    <span className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(link); toast.success("Invite link copied"); }}><Copy />Copy link</Button>
                      <Button size="sm" variant="ghost" onClick={() => revokeInvite(i.id)}>Revoke</Button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
