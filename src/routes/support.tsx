import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PublicPage } from "@/components/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/support")({
  head: () => seo("Support", "Contact the NumberShield team."),
  component: Page,
});

const schema = z.object({
  email: z.string().trim().email().max(255),
  subject: z.string().trim().min(3).max(200),
  body: z.string().trim().min(5).max(5000),
});

function Page() {
  const [form, setForm] = useState({ email: "", subject: "", body: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("support_tickets").insert({ ...parsed.data, user_id: u.user?.id ?? null });
    setBusy(false);
    if (error) return toast.error("Could not submit. Please try again.");
    setSent(true);
  }

  return (
    <PublicPage title="Support" intro="Tell us what’s going on. Please don’t include full numbers of other people.">
      {sent ? (
        <div className="rounded-xl border border-success/40 bg-success/10 p-6 text-success">Ticket received. The team will review it in the admin console. (No email is sent during beta.)</div>
      ) : (
        <form onSubmit={submit} className="max-w-xl space-y-4">
          <div className="space-y-1.5"><Label htmlFor="email">Your email</Label><Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="subject">Subject</Label><Input id="subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="body">Message</Label><Textarea id="body" rows={6} required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
          <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Submit ticket"}</Button>
        </form>
      )}
    </PublicPage>
  );
}
