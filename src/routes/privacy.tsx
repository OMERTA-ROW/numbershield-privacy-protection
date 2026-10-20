import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () => seo("Privacy Policy (draft)", "Draft placeholder privacy policy pending legal counsel review."),
  component: Page,
});

function Page() {
  return (
    <PublicPage title="Privacy Policy — DRAFT">
      <div role="alert" className="rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm text-warning">
        Placeholder only. Not reviewed by legal counsel and not in effect. Counsel review is required before launch.
      </div>
      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>Data we currently store in beta: account email, display name, phone numbers you add and their verification state, consent records, request statuses, alerts, support tickets, legal intake you submit, and audit events.</p>
        <p>To be completed by counsel: legal bases, retention periods, data subject rights (access, deletion, portability), sub-processors, international transfers, children’s data, contact for privacy requests.</p>
      </div>
    </PublicPage>
  );
}
