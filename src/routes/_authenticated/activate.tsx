import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DemoNotice, StatusBadge } from "@/components/site";
import { maskPhone, useUser } from "@/lib/auth";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/activate")({
  head: () => seo("Activate protection", "Give consent and activate NumberShield for a verified number."),
  component: Page,
});

const CONSENTS = [
  { key: "number_ownership", required: true, text: "I confirm I am the owner or authorized user of this phone number." },
  { key: "removal_authorization", required: true, text: "I authorize NumberShield to request removal of my full public phone listing where lawful and provider-supported." },
  { key: "provider_contact", required: true, text: "I authorize NumberShield to share this number with covered providers solely to process removal requests." },
  { key: "notifications", required: false, text: "Send me in-app status notifications (optional)." },
] as const;

function Page() {
  const { user } = useUser();
  const qc = useQueryClient();
  const [phoneId, setPhoneId] = useState<string>("");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  const { data: numbers } = useQuery({
    queryKey: ["numbers"],
    queryFn: async () => (await supabase.from("phone_numbers").select("*").order("created_at")).data ?? [],
  });
  const { data: providers } = useQuery({
    queryKey: ["providers-public"],
    queryFn: async () => (await supabase.from("providers").select("id,name,category,coverage,integration_mode,removal_scope,notes").eq("active", true).order("name")).data ?? [],
  });
  const { data: active } = useQuery({
    queryKey: ["consents", phoneId],
    enabled: !!phoneId,
    queryFn: async () => (await supabase.from("consents").select("consent_type").eq("phone_number_id", phoneId).is("revoked_at", null)).data ?? [],
  });

  useEffect(() => { if (!phoneId && numbers?.length) setPhoneId(numbers[0].id); }, [numbers, phoneId]);
  const selected = numbers?.find((n) => n.id === phoneId);
  const verified = selected?.verification_status === "verified";
  const allRequired = CONSENTS.filter((c) => c.required).every((c) => checked[c.key]);
  const isActive = (active ?? []).some((c) => c.consent_type === "removal_authorization");

  async function activate() {
    if (!user || !selected) return;
    setBusy(true);
    const existing = new Set((active ?? []).map((c) => c.consent_type));
    const rows = CONSENTS.filter((c) => checked[c.key] && !existing.has(c.key)).map((c) => ({ user_id: user.id, phone_number_id: selected.id, consent_type: c.key }));
    if (rows.length) {
      const { error } = await supabase.from("consents").insert(rows);
      if (error) { setBusy(false); return toast.error(error.message); }
    }
    const { data, error } = await supabase.rpc("activate_numbershield", { _phone_id: selected.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Demo requests queued for ${data} providers. No real provider was contacted.`);
    qc.invalidateQueries();
  }

  async function revoke() {
    if (!selected || !confirm("Revoke protection? Open requests will be withdrawn.")) return;
    const { data, error } = await supabase.rpc("revoke_protection", { _phone_id: selected.id });
    if (error) return toast.error(error.message);
    toast.success(`${data} open request(s) withdrawn`);
    setChecked({});
    qc.invalidateQueries();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Activate My NumberShield</h1>
        <p className="mt-1 text-muted-foreground">For verified owners only. You can revoke at any time.</p>
      </div>
      <DemoNotice />

      {numbers?.length === 0 ? (
        <p className="text-muted-foreground">Add a number first on <Link to="/numbers" className="text-primary underline">My Numbers</Link>.</p>
      ) : (
        <>
          <section className="rounded-xl border border-border bg-card p-5">
            <Label htmlFor="phone">Number</Label>
            <select id="phone" value={phoneId} onChange={(e) => { setPhoneId(e.target.value); setChecked({}); }} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              {numbers?.map((n) => <option key={n.id} value={n.id}>{maskPhone(n.e164)} {n.label ? `— ${n.label}` : ""}</option>)}
            </select>
            {selected && <div className="mt-3 flex items-center gap-2 text-sm">Verification: <StatusBadge status={selected.verification_status} /></div>}
            {selected && !verified && <p className="mt-2 text-sm text-warning">Activation is locked until this number is genuinely verified.</p>}
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">Consent</h2>
            <p className="text-sm text-muted-foreground">Each consent is recorded with a version and timestamp and can be revoked.</p>
            <div className="mt-4 space-y-3">
              {CONSENTS.map((c) => {
                const already = (active ?? []).some((a) => a.consent_type === c.key);
                return (
                  <div key={c.key} className="flex items-start gap-3">
                    <Checkbox id={c.key} disabled={!verified || already} checked={already || !!checked[c.key]} onCheckedChange={(v) => setChecked({ ...checked, [c.key]: v === true })} />
                    <Label htmlFor={c.key} className="font-normal leading-snug">{c.text} {c.required && <span className="text-muted-foreground">(required)</span>} {already && <span className="text-success">— given</span>}</Label>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">Coverage for this activation</h2>
            <ul className="mt-3 divide-y divide-border">
              {providers?.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span>{p.name} <span className="text-muted-foreground">· {p.category}</span></span>
                  <span className="flex items-center gap-2"><StatusBadge status={p.coverage} /><span className="text-xs text-muted-foreground">→ {p.coverage === "supported" || p.coverage === "partial" ? "Mock request" : "Unsupported"}</span></span>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-wrap gap-3">
            <Button variant="hero" size="lg" disabled={!verified || (!isActive && !allRequired) || busy} onClick={activate}>
              {busy ? "Activating…" : isActive ? "Re-queue withdrawn requests" : "Activate My NumberShield"}
            </Button>
            {isActive && <Button variant="outline" size="lg" onClick={revoke}>Revoke protection</Button>}
          </div>
        </>
      )}
    </div>
  );
}
