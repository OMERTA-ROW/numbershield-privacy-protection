import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => seo("Notifications", "Status updates for your account."),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => (await supabase.from("alerts").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  async function markAll() {
    await supabase.from("alerts").update({ read: true }).eq("read", false);
    qc.invalidateQueries();
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Notifications</h1>
          <p className="mt-1 text-muted-foreground">In-app only. No emails or texts are sent during beta.</p>
        </div>
        <Button variant="outline" onClick={markAll}>Mark all read</Button>
      </div>
      {data?.length === 0 && <p className="text-muted-foreground">No notifications yet.</p>}
      <ul className="space-y-3">
        {data?.map((a) => (
          <li key={a.id} className={`rounded-xl border p-4 ${a.read ? "border-border bg-card" : "border-primary/40 bg-primary/5"}`}>
            <p className="font-medium">{a.title}</p>
            {a.body && <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>}
            <p className="mt-2 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
