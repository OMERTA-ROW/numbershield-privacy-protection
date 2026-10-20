import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DemoNotice, PublicPage, StatusBadge } from "@/components/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/coverage")({
  head: () => seo("Provider coverage", "Which listing providers NumberShield covers today, and how."),
  component: Page,
});

function Page() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["providers-public"],
    queryFn: async () => {
      const { data, error } = await supabase.from("providers").select("id,name,category,coverage,integration_mode,removal_scope,notes").eq("active", true).order("name");
      if (error) throw error;
      return data;
    },
  });
  return (
    <PublicPage title="Provider coverage" intro="Example categories during beta. Provider names are placeholders until agreements are signed.">
      <DemoNotice>Every provider currently runs a demo adapter. No requests are sent to any real provider.</DemoNotice>
      {isLoading && <p className="mt-6 text-muted-foreground">Loading…</p>}
      {error && <p className="mt-6 text-destructive">Could not load providers.</p>}
      <ul className="mt-6 space-y-3">
        {data?.map((p) => (
          <li key={p.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">{p.name}</h2>
              <StatusBadge status={p.coverage} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{p.category} · Integration: {p.integration_mode}</p>
            <p className="mt-2 text-sm">{p.removal_scope}</p>
            {p.notes && <p className="mt-1 text-xs text-muted-foreground">{p.notes}</p>}
          </li>
        ))}
      </ul>
    </PublicPage>
  );
}
