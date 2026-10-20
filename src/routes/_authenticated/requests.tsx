import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DemoNotice, StatusBadge } from "@/components/site";
import { maskPhone } from "@/lib/auth";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/requests")({
  head: () => seo("Listing removals", "Status of every removal request for your numbers."),
  component: Page,
});

const FILTERS = ["all", "pending", "confirmed", "rejected", "unsupported", "mock", "withdrawn"] as const;

function Page() {
  const [f, setF] = useState<(typeof FILTERS)[number]>("all");
  const { data, isLoading } = useQuery({
    queryKey: ["requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delisting_requests")
        .select("id,status,is_demo,status_note,updated_at,providers(name,category),phone_numbers(e164)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const rows = (data ?? []).filter((r) => f === "all" || r.status === f);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Full listing removals</h1>
        <p className="mt-1 text-muted-foreground">Each row is one provider for one number.</p>
      </div>
      <DemoNotice>Rows marked Mock are demo records — nothing was sent and nothing was removed.</DemoNotice>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {FILTERS.map((x) => (
          <button key={x} onClick={() => setF(x)} aria-pressed={f === x} className={`rounded-full border px-3 py-1 text-sm ${f === x ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}>{x}</button>
        ))}
      </div>
      {isLoading ? <p className="text-muted-foreground">Loading…</p> : rows.length === 0 ? <p className="text-muted-foreground">No requests yet.</p> : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{r.providers?.name}</p>
                <StatusBadge status={r.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{r.phone_numbers ? maskPhone(r.phone_numbers.e164) : ""} · {r.providers?.category} · updated {new Date(r.updated_at).toLocaleString()}</p>
              {r.status_note && <p className="mt-2 text-sm">{r.status_note}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
