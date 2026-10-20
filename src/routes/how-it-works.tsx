import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PublicPage } from "@/components/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/how-it-works")({
  head: () => seo("How it works", "Verify your number, give granular consent, activate protection and track honest request status."),
  component: Page,
});

const STEPS = [
  ["Create your account", "Sign up with email and confirm your address."],
  ["Add and verify your number", "Ownership is verified by a one-time code. Until SMS verification is configured, numbers show “Pending verification setup” — we never fake it."],
  ["Give granular consent", "You choose exactly what we may do: confirm ownership, authorize removal requests, and allow provider contact. Each consent is versioned and revocable."],
  ["Activate My NumberShield", "We queue a request for each covered provider seeking removal of your full public listing where lawful and supported."],
  ["Track every request", "Statuses are Pending, Confirmed, Rejected, Unsupported or Mock. During beta, requests are Mock — nothing is sent."],
  ["Revoke any time", "Revoking withdraws open requests and stops further action on that number."],
];

function Page() {
  return (
    <PublicPage title="How it works" intro="Six clear steps. You stay in control at every one.">
      <ol className="space-y-4">
        {STEPS.map(([t, b], i) => (
          <li key={t} className="flex gap-4 rounded-xl border border-border bg-card p-5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary font-display font-semibold text-primary-foreground">{i + 1}</span>
            <div><h2 className="font-semibold">{t}</h2><p className="mt-1 text-sm text-muted-foreground">{b}</p></div>
          </li>
        ))}
      </ol>
      <div className="mt-8 rounded-xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
        <strong className="text-foreground">What we don’t do:</strong> look up other people’s numbers, identify anonymous reviewers, remove lawful spam or consumer-safety reports filed by others, or promise outcomes a provider hasn’t confirmed.
      </div>
      <Button asChild variant="hero" size="lg" className="mt-8"><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button>
    </PublicPage>
  );
}
