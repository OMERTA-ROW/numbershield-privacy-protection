import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/invite/$token")({
  head: () => seo("Accept invitation", "Join a NumberShield group."),
  component: Page,
});

function Page() {
  const { token } = Route.useParams();
  const [state, setState] = useState<"idle" | "ok" | string>("idle");
  async function accept() {
    const { error } = await supabase.rpc("accept_invitation", { _token: token });
    setState(error ? error.message : "ok");
  }
  return (
    <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 text-center">
      <h1 className="text-xl font-semibold">Group invitation</h1>
      {state === "ok" ? (
        <><p className="mt-3 text-success">You joined the group.</p><Button asChild className="mt-4"><Link to="/team">Go to Team</Link></Button></>
      ) : (
        <>
          <p className="mt-3 text-sm text-muted-foreground">Joining lets group admins see your membership — never your numbers or consents.</p>
          {state !== "idle" && <p role="alert" className="mt-3 text-sm text-destructive">{state}</p>}
          <Button className="mt-5" onClick={accept}>Accept invitation</Button>
        </>
      )}
    </div>
  );
}
