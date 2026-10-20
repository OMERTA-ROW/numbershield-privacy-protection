import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/site";
import { seo } from "@/lib/seo";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup", "forgot"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => seo("Sign in", "Sign in or create your NumberShield account."),
  component: AuthPage,
});

const creds = z.object({ email: z.string().trim().email().max(255), password: z.string().min(8, "Password must be at least 8 characters").max(72) });

function safeRedirect(r?: string) {
  return r && r.startsWith("/") && !r.startsWith("//") ? r : "/dashboard";
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: safeRedirect(search.redirect), replace: true });
    });
  }, [navigate, search.redirect]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (mode === "forgot") {
      const p = z.string().email().safeParse(email.trim());
      if (!p.success) return toast.error("Enter a valid email");
      setBusy(true);
      const { error } = await supabase.auth.resetPasswordForEmail(p.data, { redirectTo: `${window.location.origin}/reset-password` });
      setBusy(false);
      if (error) return toast.error(error.message);
      return setMessage("If an account exists for that email, a reset link is on its way.");
    }
    const parsed = creds.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    if (mode === "signup") {
      if (!agree) { setBusy(false); return toast.error("Please acknowledge the draft Terms and Privacy Policy"); }
      const { data, error } = await supabase.auth.signUp({
        ...parsed.data,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      if (!data.session) return setMessage("Check your email to confirm your account, then sign in.");
      navigate({ to: "/dashboard" });
    } else {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      setBusy(false);
      if (error) return toast.error(error.message);
      navigate({ to: safeRedirect(search.redirect) });
    }
  }

  const title = mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back";
  return (
    <div className="bg-hero grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-glow">
          <h1 className="text-xl font-semibold">{title}</h1>
          {message ? (
            <p role="status" className="mt-4 rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-success">{message}</p>
          ) : (
            <form onSubmit={submit} className="mt-5 space-y-4">
              <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              {mode !== "forgot" && (
                <div className="space-y-1.5"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              )}
              {mode === "signup" && (
                <div className="flex items-start gap-2 text-sm">
                  <Checkbox id="agree" checked={agree} onCheckedChange={(v) => setAgree(v === true)} />
                  <Label htmlFor="agree" className="font-normal leading-snug text-muted-foreground">I’ve read the draft <Link to="/terms" className="text-primary underline">Terms</Link> and <Link to="/privacy" className="text-primary underline">Privacy Policy</Link> and understand this is a beta with demo removals only.</Label>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</Button>
            </form>
          )}
          <div className="mt-5 flex flex-col gap-2 text-center text-sm text-muted-foreground">
            {mode !== "signin" && <button type="button" className="hover:text-foreground" onClick={() => { setMode("signin"); setMessage(null); }}>Have an account? Sign in</button>}
            {mode !== "signup" && <button type="button" className="hover:text-foreground" onClick={() => { setMode("signup"); setMessage(null); }}>New here? Create an account</button>}
            {mode === "signin" && <button type="button" className="hover:text-foreground" onClick={() => setMode("forgot")}>Forgot password?</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
