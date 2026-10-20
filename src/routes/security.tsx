import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/security")({
  head: () => seo("Security", "Row-level isolation, server-enforced permissions, minimal data and audit logging."),
  component: Page,
});

const ITEMS = [
  ["Per-account isolation", "Every table enforces row-level security. You can only read your own numbers, consents and requests; team members never see each other’s numbers."],
  ["Server-side enforcement", "Activation, revocation, invitations and verification changes run as checked database procedures — the browser cannot bypass them."],
  ["No self-verification", "A database guard blocks users from marking their own number as verified."],
  ["Minimal sensitive data", "We store the phone number, its verification state and your consents — nothing else about it. Numbers are masked in the interface."],
  ["Audit trail", "Consent changes, activations, revocations, role changes and admin actions are written to an append-only audit log."],
  ["No tracking or doxxing", "There is no search for other people, no reverse lookup and no identity resolution of reviewers or reporters."],
];

function Page() {
  return (
    <PublicPage title="Security" intro="Sensible defaults from day one. This is a beta — an independent security review is planned before launch.">
      <div className="grid gap-4 sm:grid-cols-2">
        {ITEMS.map(([t, b]) => (
          <div key={t} className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">{t}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{b}</p>
          </div>
        ))}
      </div>
    </PublicPage>
  );
}
