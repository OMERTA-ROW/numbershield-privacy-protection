import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/lib/auth";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => seo("Account settings", "Profile, password, consents, activity and data."),
  component: Page,
});

function Page() {
  const { user } = useUser();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });
  const { data: consents } = useQuery({
    queryKey: ["all-consents"],
    queryFn: async () => (await supabase.from("consents").select("*").order("granted_at", { ascending: false })).data ?? [],
  });
  const { data: audit } = useQuery({
    queryKey: ["my-audit", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("audit_events").select("*").eq("actor_id", user!.id).order("created_at", { ascending: false }).limit(50)).data ?? [],
  });
  useEffect(() => { if (profile?.display_name) setName(profile.display_name); }, [profile]);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ display_name: name.trim().slice(0, 80) }).eq("id", user.id);
    error ? toast.error(error.message) : toast.success("Saved");
  }
  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("New password must be at least 8 characters");
    const { error } = await supabase.auth.updateUser({ password: pw, current_password: cur } as never);
    if (error) return toast.error(error.message);
    setCur(""); setPw(""); toast.success("Password updated");
  }
  async function revokeConsent(id: string) {
    const { error } = await supabase.from("consents").update({ revoked_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
  }
  async function exportData() {
    const tables = ["profiles", "phone_numbers", "consents", "delisting_requests", "alerts", "legal_cases", "support_tickets"] as const;
    const out: Record<string, unknown> = {};
    for (const t of tables) out[t] = (await supabase.from(t).select("*")).data;
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "numbershield-export.json"; a.click();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold sm:text-3xl">Account settings</h1>

      <form onSubmit={saveName} className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
        <div className="space-y-1.5"><Label htmlFor="name">Display name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <Button type="submit">Save</Button>
      </form>

      <form onSubmit={changePw} className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Change password</h2>
        <div className="space-y-1.5"><Label htmlFor="cur">Current password</Label><Input id="cur" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="new">New password</Label><Input id="new" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <Button type="submit">Update password</Button>
      </form>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Consent history</h2>
        <ul className="mt-3 divide-y divide-border text-sm">
          {consents?.length === 0 && <li className="py-2 text-muted-foreground">No consents recorded.</li>}
          {consents?.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>{c.consent_type.replace(/_/g, " ")} <span className="text-muted-foreground">· v{c.version} · {new Date(c.granted_at).toLocaleDateString()}</span></span>
              {c.revoked_at ? <span className="text-muted-foreground">Revoked {new Date(c.revoked_at).toLocaleDateString()}</span> : <Button size="sm" variant="ghost" onClick={() => revokeConsent(c.id)}>Revoke</Button>}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Your activity log</h2>
        <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto font-mono text-xs text-muted-foreground">
          {audit?.map((a) => <li key={a.id}>{new Date(a.created_at).toLocaleString()} · {a.action} · {a.target_type}</li>)}
        </ul>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Your data</h2>
        <Button variant="outline" onClick={exportData}>Download my data (JSON)</Button>
        <p className="text-sm text-muted-foreground">Account deletion is handled by request during beta so nothing is lost by accident. <Link to="/support" className="text-primary underline">Request deletion</Link>.</p>
      </section>
    </div>
  );
}
