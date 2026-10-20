import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () => seo("Terms of Service (draft)", "Draft placeholder terms pending legal counsel review."),
  component: Page,
});

function Page() {
  return (
    <PublicPage title="Terms of Service — DRAFT">
      <div role="alert" className="rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm text-warning">
        Placeholder only. These terms have not been reviewed by legal counsel and are not in effect. Counsel review is required before any public launch.
      </div>
      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>Sections to be drafted by counsel: eligibility and number ownership; scope of removal requests; no guarantee of provider outcomes; beta/demo status; acceptable use (no use against third parties); preservation of others’ lawful speech; legal intake is not legal advice; limitation of liability; governing law; termination.</p>
      </div>
    </PublicPage>
  );
}
