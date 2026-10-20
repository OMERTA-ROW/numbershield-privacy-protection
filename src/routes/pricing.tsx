import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PublicPage } from "@/components/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/pricing")({
  head: () => seo("Pricing", "NumberShield is free during private beta. Paid plans will be announced before launch."),
  component: Page,
});

const PLANS = [
  ["Beta", "Free during beta", ["1 account, multiple numbers", "Demo removal tracking", "Consent & audit history"]],
  ["Individual", "Price to be announced", ["Real provider requests (when contracted)", "Status notifications", "Priority support"]],
  ["Family / Team", "Price to be announced", ["Invite members with roles", "Per-member privacy isolation", "Shared admin view of membership"]],
] as const;

function Page() {
  return (
    <PublicPage title="Pricing" intro="No prices are set yet. Billing is not active — you will not be charged.">
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map(([name, price, items], i) => (
          <div key={name} className={`rounded-xl border bg-card p-6 ${i === 0 ? "border-primary shadow-glow" : "border-border"}`}>
            <h2 className="font-semibold">{name}</h2>
            <p className="mt-2 font-display text-xl">{price}</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">{items.map((x) => <li key={x}>• {x}</li>)}</ul>
          </div>
        ))}
      </div>
      <Button asChild variant="hero" size="lg" className="mt-8"><Link to="/auth" search={{ mode: "signup" }}>Join the beta</Link></Button>
    </PublicPage>
  );
}
