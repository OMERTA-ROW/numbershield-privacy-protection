import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/site";
import { maskPhone } from "@/lib/auth";
import { seo } from "@/lib/seo";

type Coverage = Database["public"]["Enums"]["coverage_status"];
type ReqStatus = Database["public"]["Enums"]["request_status"];

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => seo("Admin console", "Staff tools for providers, verification, tickets, requests, legal and logs."),
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("is_staff", { _user_id: (context as { user: { id: string } }).user.id });
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Admin console</h1>
        <p className="mt-1 text-muted-foreground">Every action here is permission-checked by the database and written to the audit log.</p>
      </div>
      <Tabs defaultValue="providers">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="verify">Verification</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="legal">Legal cases</TabsTrigger>
          <TabsTrigger value="logs">Audit log</TabsTrigger>
        </TabsList>
        <TabsContent value="providers"><Providers /></TabsContent>
        <TabsContent value="verify"><Verification /></TabsContent>
        <TabsContent value="requests"><Requests /></TabsContent>
        <TabsContent value="tickets"><Tickets /></TabsContent>
        <TabsContent value="legal"><Legal /></TabsContent>
        <TabsContent value="logs"><Logs /></TabsContent>
      </Tabs>
    </div>
  );
}

const sel = "h-8 rounded-md border border-input bg-background px-2 text-sm";

function Providers() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [cat, setCat] = useState("");
  const { data } = useQuery({ queryKey: ["admin-providers"], queryFn: async () => (await supabase.from("providers").select("*").order("name")).data ?? [] });
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !cat.trim()) return;
    const { error } = await supabase.from("providers").insert({ name: name.trim().slice(0, 120), category: cat.trim().slice(0, 60) });
    if (error) return toast.error(error.message);
    setName(""); setCat(""); qc.invalidateQueries();
  }
  async function upd(id: string, patch: Database["public"]["Tables"]["providers"]["Update"]) {
    const { error } = await supabase.from("providers").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    qc.invalidateQueries();
  }
  return (
    <div className="mt-4 space-y-4">
      <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Provider name" aria-label="Provider name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Category" aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)} />
        <Button type="submit">Add provider</Button>
      </form>
      <p className="text-xs text-muted-foreground">Integration mode “api” should only be set once a signed contract or authorized API exists.</p>
      <ul className="space-y-2">
        {data?.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-3 text-sm">
            <span className="font-medium">{p.name} <span className="font-normal text-muted-foreground">· {p.category}</span></span>
            <span className="flex flex-wrap gap-2">
              <select aria-label="Coverage" className={sel} value={p.coverage} onChange={(e) => upd(p.id, { coverage: e.target.value as Coverage })}>
                {["supported", "partial", "unsupported", "planned"].map((c) => <option key={c}>{c}</option>)}
              </select>
              <select aria-label="Integration mode" className={sel} value={p.integration_mode} onChange={(e) => upd(p.id, { integration_mode: e.target.value as Database["public"]["Enums"]["integration_mode"] })}>
                {["demo", "manual", "api"].map((c) => <option key={c}>{c}</option>)}
              </select>
              <Button size="sm" variant="outline" onClick={() => upd(p.id, { active: !p.active })}>{p.active ? "Deactivate" : "Activate"}</Button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Verification() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-phones"], queryFn: async () => (await supabase.from("phone_numbers").select("*").order("created_at", { ascending: false })).data ?? [] });
  async function set(id: string, status: Database["public"]["Enums"]["verification_status"]) {
    const note = prompt("Describe the out-of-band ownership evidence reviewed (required):");
    if (!note || note.trim().length < 5) return toast.error("A review note is required");
    const { error } = await supabase.rpc("admin_set_verification", { _phone_id: id, _status: status, _note: note.trim().slice(0, 500) });
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
  }
  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm text-warning">Manual verification is for exceptional, documented cases only. Admin role required; every change is audited.</p>
      <ul className="space-y-2">
        {data?.map((n) => (
          <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-3 text-sm">
            <span>{maskPhone(n.e164)} · owner {n.user_id.slice(0, 8)}</span>
            <span className="flex items-center gap-2">
              <StatusBadge status={n.verification_status} />
              <Button size="sm" variant="outline" onClick={() => set(n.id, "verified")}>Mark verified</Button>
              <Button size="sm" variant="ghost" onClick={() => set(n.id, "rejected")}>Reject</Button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Requests() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-requests"], queryFn: async () => (await supabase.from("delisting_requests").select("id,status,is_demo,status_note,providers(name)").order("updated_at", { ascending: false }).limit(200)).data ?? [] });
  async function set(id: string, status: ReqStatus, isDemo: boolean) {
    if (isDemo && (status === "pending" || status === "confirmed")) return toast.error("Demo requests cannot be marked Pending or Confirmed — no real request was sent.");
    const { error } = await supabase.from("delisting_requests").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
  }
  return (
    <ul className="mt-4 space-y-2">
      {data?.length === 0 && <li className="text-muted-foreground">No requests.</li>}
      {data?.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-3 text-sm">
          <span>{r.providers?.name} {r.is_demo && <span className="text-info">(demo)</span>}</span>
          <select aria-label="Status" className={sel} value={r.status} onChange={(e) => set(r.id, e.target.value as ReqStatus, r.is_demo)}>
            {["pending", "confirmed", "rejected", "unsupported", "mock", "withdrawn"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </li>
      ))}
    </ul>
  );
}

function Tickets() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-tickets"], queryFn: async () => (await supabase.from("support_tickets").select("*").order("created_at", { ascending: false })).data ?? [] });
  async function set(id: string, status: string) {
    await supabase.from("support_tickets").update({ status }).eq("id", id);
    qc.invalidateQueries();
  }
  return (
    <ul className="mt-4 space-y-2">
      {data?.length === 0 && <li className="text-muted-foreground">No tickets.</li>}
      {data?.map((t) => (
        <li key={t.id} className="rounded-lg border border-border bg-card p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium">{t.subject}</span>
            <select aria-label="Ticket status" className={sel} value={t.status} onChange={(e) => set(t.id, e.target.value)}>
              {["open", "in_progress", "resolved"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <p className="mt-1 text-muted-foreground">{t.email} · {new Date(t.created_at).toLocaleString()}</p>
          <p className="mt-2 whitespace-pre-wrap">{t.body}</p>
        </li>
      ))}
    </ul>
  );
}

function Legal() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-legal"], queryFn: async () => (await supabase.from("legal_cases").select("*").order("created_at", { ascending: false })).data ?? [] });
  async function set(id: string, status: string) {
    const { error } = await supabase.from("legal_cases").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    qc.invalidateQueries();
  }
  return (
    <ul className="mt-4 space-y-2">
      {data?.length === 0 && <li className="text-muted-foreground">No cases.</li>}
      {data?.map((c) => (
        <li key={c.id} className="rounded-lg border border-border bg-card p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium">{c.title}</span>
            <select aria-label="Case status" className={sel} value={c.status} onChange={(e) => set(c.id, e.target.value)}>
              {["received", "under_review", "referral_ready", "closed"].map((s) => <option key={s} disabled={s === "referral_ready" && !c.referral_consent}>{s}</option>)}
            </select>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{c.description}</p>
          <p className="mt-1 text-xs">Referral consent: {c.referral_consent ? "yes" : "no"}</p>
        </li>
      ))}
    </ul>
  );
}

function Logs() {
  const { data } = useQuery({ queryKey: ["admin-audit"], queryFn: async () => (await supabase.from("audit_events").select("*").order("created_at", { ascending: false }).limit(200)).data ?? [] });
  return (
    <ul className="mt-4 max-h-[60vh] space-y-1 overflow-y-auto rounded-lg border border-border bg-card p-3 font-mono text-xs">
      {data?.map((a) => (
        <li key={a.id} className="text-muted-foreground">{new Date(a.created_at).toLocaleString()} · {a.actor_id?.slice(0, 8) ?? "system"} · {a.action} · {a.target_type} {JSON.stringify(a.metadata) !== "{}" && JSON.stringify(a.metadata)}</li>
      ))}
    </ul>
  );
}
