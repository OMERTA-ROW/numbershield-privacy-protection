import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/install")({
  head: () => seo("Install the app", "Add NumberShield to your home screen. Native store apps are a future milestone."),
  component: Page,
});

function Page() {
  return (
    <PublicPage title="Install NumberShield" intro="Add the web app to your home screen for an app-like experience.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold">iPhone / iPad (Safari)</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground"><li>Open this site in Safari.</li><li>Tap the Share button.</li><li>Choose “Add to Home Screen”.</li></ol>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold">Android (Chrome)</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground"><li>Open this site in Chrome.</li><li>Tap the ⋮ menu.</li><li>Choose “Install app” or “Add to Home screen”.</li></ol>
        </div>
      </div>
      <div className="mt-6 space-y-2 rounded-xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
        <p><strong className="text-foreground">Works offline?</strong> Not yet — an internet connection is required.</p>
        <p><strong className="text-foreground">App Store / Google Play:</strong> native store apps are a future milestone. There is no store download today.</p>
        <p>Installing from the editor preview may not work; use the published site once it is live.</p>
      </div>
    </PublicPage>
  );
}
