import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/site";
import { useUser } from "@/lib/auth";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/legal")({
  head: () => seo("Legal intake", "Confidential evidence intake for possible attorney referral."),
  component: Page,
});

const schema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(5000),
  evidence_links: z.string().trim().max(3000),
});

function Page() {
  const { user } = useUser();
  const qc = useQueryClient();
  const [f, setF] = useState({ title: "", description: "", evidence_links: "" });
  const [referral, setReferral] = useState(false);
  const { data } = useQuery({
    queryKey: ["cases"],
    queryFn: async () => (await supabase.from("legal_cases").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = schema.safeParse(f);
    if (!p.success || !user) return toast.error(p.success ? "Not signed in" : p.error.issues[0].message);
    const { error } = await supabase.from("legal_cases").insert({ ...p.data, evidence_links: p.data.evidence_links || null, referral_consent: referral, user_id: user.id });
    if (error) return toast.error(error.message);
    setF({ title: "", description: "", evidence_links: "" }); setReferral(false);
    toast.success("Submitted confidentially");
    qc.invalidateQueries({ queryKey: ["cases"] });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Confidential legal intake</h1>
        <p className="mt-1 text-muted-foreground">Organize evidence for a possible attorney referral.</p>
      </div>
      <div role="note" className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
        This is not legal advice and creates no attorney–client relationship. NumberShield makes no automated filings and does not assign blame. Describe facts you know firsthand; do not include other people’s private data.
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="space-y-1.5"><Label htmlFor="t">Short title</Label><Input id="t" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div className="space-y-1.5"><Label htmlFor="d">What happened</Label><Textarea id="d" rows={6} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div className="space-y-1.5"><Label htmlFor="l">Evidence links or references (optional)</Label><Textarea id="l" rows={3} value={f.evidence_links} onChange={(e) => setF({ ...f, evidence_links: e.target.value })} /></div>
        <div className="flex items-start gap-2"><Checkbox id="ref" checked={referral} onCheckedChange={(v) => setReferral(v === true)} /><Label htmlFor="ref" className="font-normal">I consent to this summary being shared with a vetted attorney if I later request a referral.</Label></div>
        <Button type="submit">Submit confidentially</Button>
      </form>
      <ul className="space-y-3">
        {data?.map((c) => (
          <li key={c.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2"><p className="font-medium">{c.title}</p><StatusBadge status={c.status} /></div>
            <p className="mt-1 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()} · referral consent: {c.referral_consent ? "yes" : "no"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
