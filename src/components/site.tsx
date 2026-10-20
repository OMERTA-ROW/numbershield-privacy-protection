import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/security", label: "Security" },
  { to: "/coverage", label: "Coverage" },
  { to: "/pricing", label: "Pricing" },
  { to: "/faq", label: "FAQ" },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold" aria-label="NumberShield home">
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <ShieldCheck className="size-5" aria-hidden />
      </span>
      NumberShield
    </Link>
  );
}

export function SiteHeader() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="text-sm text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Button asChild><Link to="/dashboard">Dashboard</Link></Button>
          ) : (
            <>
              <Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button>
              <Button asChild><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button>
            </>
          )}
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open && (
        <nav className="border-t border-border px-4 py-3 md:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-1">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-muted-foreground hover:bg-muted">
                {n.label}
              </Link>
            ))}
            <Link to={user ? "/dashboard" : "/auth"} onClick={() => setOpen(false)} className="rounded-md px-2 py-2 font-medium text-primary">
              {user ? "Dashboard" : "Sign in / Get started"}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-4">
        <div className="space-y-2">
          <Logo />
          <p className="text-muted-foreground">Private beta. Removal requests are demo-only until provider agreements are in place.</p>
        </div>
        <FooterCol title="Product" links={[["/how-it-works", "How it works"], ["/coverage", "Provider coverage"], ["/pricing", "Pricing"], ["/install", "Install app"]]} />
        <FooterCol title="Trust" links={[["/security", "Security"], ["/faq", "FAQ"], ["/support", "Support"]]} />
        <FooterCol title="Legal" links={[["/terms", "Terms (draft)"], ["/privacy", "Privacy (draft)"]]} />
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h2 className="mb-2 font-display text-sm font-semibold">{title}</h2>
      <ul className="space-y-1.5">
        {links.map(([to, label]) => (
          <li key={to}><a href={to} className="text-muted-foreground hover:text-foreground">{label}</a></li>
        ))}
      </ul>
    </div>
  );
}

export function PublicPage({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-hero border-b border-border/60">
          <div className="mx-auto max-w-4xl px-4 py-14 sm:py-20">
            <h1 className="text-3xl font-semibold sm:text-5xl">{title}</h1>
            {intro && <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{intro}</p>}
          </div>
        </section>
        <div className="mx-auto max-w-4xl px-4 py-12">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: "border-success/40 bg-success/10 text-success",
  verified: "border-success/40 bg-success/10 text-success",
  supported: "border-success/40 bg-success/10 text-success",
  pending: "border-warning/40 bg-warning/10 text-warning",
  pending_setup: "border-warning/40 bg-warning/10 text-warning",
  partial: "border-warning/40 bg-warning/10 text-warning",
  rejected: "border-destructive/40 bg-destructive/10 text-destructive",
  unsupported: "border-border bg-muted text-muted-foreground",
  planned: "border-info/40 bg-info/10 text-info",
  withdrawn: "border-border bg-muted text-muted-foreground",
  mock: "border-info/40 bg-info/10 text-info",
};
const STATUS_LABEL: Record<string, string> = {
  pending_setup: "Pending verification setup",
  mock: "Mock (demo)",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_STYLES[status] ?? "border-border text-muted-foreground")}>
      {STATUS_LABEL[status] ?? status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function DemoNotice({ children }: { children?: ReactNode }) {
  return (
    <div role="note" className="rounded-lg border border-info/40 bg-info/10 px-4 py-3 text-sm text-info">
      <strong className="font-semibold">Demo mode.</strong>{" "}
      {children ?? "No real provider is contacted. Requests are mock records until provider contracts or authorized APIs are configured."}
    </div>
  );
}
