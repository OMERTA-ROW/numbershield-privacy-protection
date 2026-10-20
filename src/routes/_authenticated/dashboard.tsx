import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DemoNotice, StatusBadge } from "@/components/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => seo("Dashboard", "Your NumberShield overview."),
  component: Page,
});

function Page() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [nums, reqs, alerts] = await Promise.all([
        supabase.from("phone_numbers").select("id,verification_status"),
        supabase.from("delisting_requests").select("status"),
        supabase.from("alerts").select("id").eq("read", false),
      ]);
      const counts: Record<string, number> = {};
      (reqs.data ?? []).forEach((r) => (counts[r.status] = (counts[r.status] ?? 0) + 1));
      return {
        numbers: nums.data?.length ?? 0,
        verified: nums.data?.filter((n) => n.verification_status === "verified").length ?? 0,
        counts,
        unread: alerts.data?.length ?? 0,
      };
    },
  });

  const step = !data ? 0 : data.numbers === 0 ? 1 : data.verified === 0 ? 2 : Object.keys(data.counts).length === 0 ? 3 : 4;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Your protection overview</h1>
        <p className="mt-1 text-muted-foreground">Everything here reflects real state. Nothing is overstated.</p>
      </div>
      <DemoNotice />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Numbers added" value={data?.numbers} />
        <Stat label="Verified numbers" value={data?.verified} />
        <Stat label="Unread notifications" value={data?.unread} />
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold">Next step</h2>
        {step === 1 && <Next text="Add the phone number you own." to="/numbers" cta="Add a number" />}
        {step === 2 && <Next text="Your number is awaiting verification. SMS verification is not configured in this beta, so it shows “Pending verification setup”." to="/numbers" cta="View my numbers" />}
        {step === 3 && <Next text="Your number is verified. Review consent and activate protection." to="/activate" cta="Activate My NumberShield" hero />}
        {step === 4 && <Next text="Protection is active. Track each provider’s status." to="/requests" cta="View removals" />}
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold">Requests by status</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {["pending", "confirmed", "rejected", "unsupported", "mock", "withdrawn"].map((s) => (
            <div key={s} className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
              <StatusBadge status={s} /><span className="font-display font-semibold">{data?.counts[s] ?? 0}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold">{value ?? "–"}</p>
    </div>
  );
}

function Next({ text, to, cta, hero }: { text: string; to: "/numbers" | "/activate" | "/requests"; cta: string; hero?: boolean }) {
  return (
    <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground">{text}</p>
      <Button asChild variant={hero ? "hero" : "default"}><Link to={to}>{cta}</Link></Button>
    </div>
  );
}
