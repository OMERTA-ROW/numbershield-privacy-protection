<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Privileged flows (activation, revocation, invite acceptance, manual verification) live in SECURITY DEFINER Postgres functions; the browser calls them via RPC so rules are enforced server-side.
- Every public table has RLS scoped to auth.uid() or org membership via has_role/is_staff/org_role_of helpers; platform roles live only in user_roles.
- Removal requests are demo-only (is_demo=true, status mock/unsupported) until a real provider integration exists; never mark demo rows pending/confirmed.
- Phone verification fields are guarded by a trigger; only an admin RPC or a future trusted verification service may change them.
- PWA is manifest-only (no service worker) to keep previews safe.
