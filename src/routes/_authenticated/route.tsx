import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Gavel, LayoutDashboard, LogOut, Phone, Settings, ShieldCheck, ShieldHalf, ListChecks, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site";
import { useUser, usePlatformRoles } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { redirect: location.href } });
    return { user: data.user };
  },
  component: AppLayout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/numbers", label: "My Numbers", icon: Phone },
  { to: "/activate", label: "Activate", icon: ShieldCheck },
  { to: "/requests", label: "Removals", icon: ListChecks },
  { to: "/alerts", label: "Notifications", icon: Bell },
  { to: "/team", label: "Team & family", icon: Users },
  { to: "/legal", label: "Legal intake", icon: Gavel },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function AppLayout() {
  const { user } = useUser();
  const roles = usePlatformRoles(user?.id);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const linkCls = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground";
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar p-4 lg:flex lg:flex-col">
        <Logo />
        <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="App">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={linkCls} activeProps={{ className: "bg-sidebar-accent !text-sidebar-foreground" }}>
              <n.icon className="size-4" aria-hidden />{n.label}
            </Link>
          ))}
          {roles.data?.isStaff && (
            <Link to="/admin" className={linkCls} activeProps={{ className: "bg-sidebar-accent !text-sidebar-foreground" }}>
              <ShieldHalf className="size-4" aria-hidden />Admin console
            </Link>
          )}
        </nav>
        <div className="border-t border-sidebar-border pt-3 text-xs text-muted-foreground">
          <p className="truncate" title={user?.email ?? ""}>{user?.email}</p>
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start" onClick={signOut}><LogOut />Sign out</Button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col pb-20 lg:pb-0">
        <header className="flex h-14 items-center justify-between border-b border-border px-4 lg:hidden">
          <Logo />
          <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out"><LogOut /></Button>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-border bg-sidebar/95 backdrop-blur lg:hidden" aria-label="App mobile">
        {[...NAV.slice(0, 5), ...(roles.data?.isStaff ? [{ to: "/admin", label: "Admin", icon: ShieldHalf }] : []), NAV[5], NAV[7]].map((n) => (
          <Link key={n.to} to={n.to} className="flex min-w-[72px] flex-1 flex-col items-center gap-1 px-2 py-2 text-[11px] text-muted-foreground" activeProps={{ className: "!text-primary" }}>
            <n.icon className="size-5" aria-hidden />{n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
