import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/site";
import { maskPhone, useUser } from "@/lib/auth";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/numbers")({
  head: () => seo("My Numbers", "Add and verify the phone numbers you own."),
  component: Page,
});

const e164 = z.string().trim().regex(/^\+[1-9]\d{7,14}$/, "Use international format, e.g. +14155550142");

function Page() {
  const { user } = useUser();
  const qc = useQueryClient();
  const [num, setNum] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["numbers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("phone_numbers").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const p = e164.safeParse(num.replace(/[\s()-]/g, ""));
    if (!p.success) return toast.error(p.error.issues[0].message);
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("phone_numbers").insert({ e164: p.data, label: label.trim().slice(0, 60) || null, user_id: user.id });
    setBusy(false);
    if (error) return toast.error(error.code === "23505" ? "You already added this number" : error.message);
    setNum(""); setLabel("");
    toast.success("Number added — pending verification setup");
    qc.invalidateQueries();
  }

  async function remove(id: string) {
    if (!confirm("Remove this number? Its consents and requests will be deleted.")) return;
    const { error } = await supabase.from("phone_numbers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">My Numbers</h1>
        <p className="mt-1 text-muted-foreground">Only add numbers you own. Ownership must be verified before activation.</p>
      </div>

      <form onSubmit={add} className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="space-y-1.5"><Label htmlFor="num">Phone number</Label><Input id="num" inputMode="tel" placeholder="+14155550142" value={num} onChange={(e) => setNum(e.target.value)} required /></div>
        <div className="space-y-1.5"><Label htmlFor="label">Label (optional)</Label><Input id="label" placeholder="Personal mobile" value={label} onChange={(e) => setLabel(e.target.value)} /></div>
        <Button type="submit" disabled={busy}>Add number</Button>
      </form>

      <div role="note" className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
        <strong>Verification setup pending.</strong> SMS one-time-code verification is not configured yet, so numbers cannot be self-verified. We will not mark a number verified without genuine proof of ownership.
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading…</p> : data?.length === 0 ? (
        <p className="text-muted-foreground">No numbers yet.</p>
      ) : (
        <ul className="space-y-3">
          {data?.map((n) => (
            <li key={n.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
              <div>
                <p className="font-display font-semibold">{maskPhone(n.e164)} {n.label && <span className="ml-2 text-sm font-normal text-muted-foreground">{n.label}</span>}</p>
                <p className="text-xs text-muted-foreground">{n.verified_method ? `Verified via ${n.verified_method.replace(/_/g, " ")}` : "Not verified"}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={n.verification_status} />
                <Button variant="outline" size="sm" disabled title="Available once SMS verification is configured">Send code</Button>
                <Button variant="ghost" size="icon" aria-label="Remove number" onClick={() => remove(n.id)}><Trash2 /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
