import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, FileLock2, ListChecks, Scale, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader, StatusBadge } from "@/components/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => seo("Take your phone number off public listings", "Consent-first requests to remove your full public phone listing from supported providers, with honest status tracking."),
  component: Index,
});

const FEATURES = [
  { icon: BadgeCheck, title: "Owner-verified only", body: "Only the verified owner of a number can request protection. No lookups of other people, ever." },
  { icon: ListChecks, title: "Honest status tracking", body: "Every request shows its real stage: Pending, Confirmed, Rejected, Unsupported or Mock." },
  { icon: FileLock2, title: "Minimal data", body: "We store only what a removal request needs, isolated per account with row-level security." },
  { icon: Users, title: "Family & team plans", body: "Invite members with clear roles. Each person controls their own numbers and consents." },
  { icon: Scale, title: "Legal-ready intake", body: "Confidential evidence intake and attorney-referral readiness. No automated filings." },
  { icon: ShieldCheck, title: "Speech preserved", body: "We request removal of your listing — not the deletion of others' lawful spam or safety reports." },
];

function Index() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-hero grid-lines relative border-b border-border/60">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:py-28 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Private beta · demo removals only</p>
              <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">Your number. <span className="text-primary">Off the public record.</span></h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                NumberShield helps verified owners request removal of their <strong className="text-foreground">full public phone listing</strong> — where lawful and supported by the provider — and tracks every request honestly.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="hero" size="lg"><Link to="/auth" search={{ mode: "signup" }}>Activate My NumberShield</Link></Button>
                <Button asChild variant="outline" size="lg"><Link to="/how-it-works">How it works</Link></Button>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-glow" aria-label="Example status panel (illustration)">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display font-semibold">Number •••• 0142</span>
                <span className="text-xs text-muted-foreground">Example</span>
              </div>
              <ul className="space-y-3 text-sm">
                {[["People-search directory A", "mock"], ["Reverse lookup C", "pending"], ["Business listing D", "confirmed"], ["Caller ID app F", "unsupported"], ["Directory B", "rejected"]].map(([n, s]) => (
                  <li key={n} className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2.5">
                    <span>{n}</span><StatusBadge status={s} />
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">Illustration of status types. Beta accounts only see Mock or Unsupported until provider agreements exist.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-2xl font-semibold sm:text-3xl">Built for trust, not tricks</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6">
                <f.icon className="size-6 text-primary" aria-hidden />
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border/60">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-semibold">Join the private beta</h2>
              <p className="mt-2 text-muted-foreground">Free during beta. No card required. No real removals are claimed.</p>
            </div>
            <Button asChild variant="hero" size="lg"><Link to="/auth" search={{ mode: "signup" }}>Create account</Link></Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
