# Private access: main preview versus isolated draft

## Current main preview

The main backend is shared, not proven isolated. Read-only inspection found zero auth users, verified users, platform admins, organizations and organization owners. No auth settings, data, schema, purchases, external services or email delivery were changed here.

The `owner.tsx` command type now uses the validated command union rather than indexing an optional server-call parameter. New owner access remains fail-closed. Configuration alone is not sufficient: the isolated installation must enforce owner authorization, email binding and atomic invitation use in the database.

## Isolated work

Draft **Private accounts isolated testing** was created from the last saved main version. It has its own thread and is implementing the remaining work. A draft label does not prove backend isolation; its backend binding must be checked before applying any schema/auth changes. It will not be accepted or published automatically. Main-turn edits after draft creation are not automatically included in that draft.

Missing verified owner identity must block only ownership assignment. Never guess an email, provision a first-visitor owner, auto-confirm a real person, or add tester platform-admin roles. The owner's real email and verification evidence must be supplied out of band through trusted project controls before bootstrap. No passwords belong in setup configuration.

## Main preview testing addresses

Base: https://id-preview--c24c59a6-b268-40a1-aa39-4813327e83be.lovable.app

- Login and own password signup: `/auth`
- Signed-in home: `/dashboard`
- Account and password settings: `/settings`
- Email recovery request: `/auth?mode=forgot`
- Recovery link destination: `/reset-password`
- Prepared member administration: `/owner` (disabled until isolated installation)
- Prepared invitation acceptance: `/tester-invite?token=<actual-invitation-token>`
- Browser home-screen information: `/install`

These are app paths, not authorization to send confirmation/recovery emails. Preview access may additionally require project access. Do not share an invitation token in logs or this document.

## Secure activation prerequisites

1. Open the isolated draft, establish a backend binding distinct from main, and retain evidence of isolation. Do not reuse the shared main backend.
2. Apply only the draft's reviewed private-access installation to that isolated backend. It must lock invitation rows, enforce expiry/revocation and email binding, protect owner rows, and enforce per-user authorization in every private handler and policy.
3. Supply the actual owner email through trusted configuration; independently confirm that the corresponding provider account's email is verified. Owner assignment is a privileged operation, not a public signup action.
4. Enable the draft's server-side access switch only after those checks. Main currently expects `NUMBERSHIELD_DEV_ACCESS_ENABLED`, `NUMBERSHIELD_ISOLATED_BACKEND_URL` and `NUMBERSHIELD_VERIFIED_OWNER_ID`; do not set these against main. The draft is replacing identity setup with verified configured-email bootstrap and will document its final names.
5. Run provider-supported, isolated no-mail fixtures through login, invite creation/acceptance, expiry, reuse, revoke, self-escalation, cross-user reads/writes, suspension and sign-out. Without those fixtures, report runtime checks blocked rather than fabricate accounts.
6. Only after owner-controlled actions, invitees receive copyable links, create their own credentials and verify their own email. Do not merge existing identities. No integration, billing or real removals are enabled by membership.

## Actual provider limits and costs

There is no application invitation-count cap. Database/storage usage and provider throughput still apply. The current hosted auth-email hourly limit and this workspace's plan/remaining quota have not been verified; do not claim a numeric limit for this project.

Lovable's documented paid-workspace transactional-email allowance is 50,000 per month across the workspace, with additional emails costing 4 credits per 1,000. Free plans use the default Cloud Auth sender; a custom sender domain requires a paid plan. These are documented platform terms, not an assertion that this workspace is paid. Copying links sends no email. No purchases or quota changes were made.

The hosted email rate limit is visible under **More → Users → Auth settings → Email → Advanced**. Redirect settings are under **Auth settings → Advanced**. Do not alter the shared instance to support isolated testing.

## Verification boundaries

Unit tests exercise the fail-closed configuration checks, verified-identity requirement and allowed command roles. They do not prove deployed SQL isolation, invitation consumption or real login. Those runtime checks belong in the verified isolated draft. Existing main schema has broad group update/consent permissions and invitation race risks identified by review; repairing them against the shared backend is explicitly deferred.