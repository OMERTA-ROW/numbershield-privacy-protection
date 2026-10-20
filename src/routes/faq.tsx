import { createFileRoute } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PublicPage } from "@/components/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/faq")({
  head: () => seo("FAQ", "Answers about verification, removal scope, demo mode, speech rights and your data."),
  component: Page,
});

const QA = [
  ["Are removals real today?", "Not yet. During beta every request is a Mock record and no provider is contacted. We will only show Pending or Confirmed once a real, authorized integration exists."],
  ["What gets removed?", "We seek removal of your full public phone listing where the law and the provider allow it — not just individual comments."],
  ["Can I protect someone else’s number?", "No. Only the verified owner of a number can activate protection for it."],
  ["Why is my number “Pending verification setup”?", "SMS verification isn’t configured in this beta yet. We won’t pretend a number is verified. An administrator may complete a manual, audited review in limited cases."],
  ["Will you delete spam reports about my number?", "No. Others’ lawful spam and consumer-safety reports, and anonymous speech, are preserved. We don’t identify reviewers."],
  ["Can you sue on my behalf?", "No. Our legal intake collects evidence confidentially and prepares it for a possible attorney referral. We make no automated filings."],
  ["How do I stop?", "Revoke protection on any number at any time. Open requests are withdrawn immediately."],
];

function Page() {
  return (
    <PublicPage title="Frequently asked questions">
      <Accordion type="single" collapsible className="rounded-xl border border-border bg-card px-5">
        {QA.map(([q, a]) => (
          <AccordionItem key={q} value={q}>
            <AccordionTrigger className="text-left">{q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </PublicPage>
  );
}
