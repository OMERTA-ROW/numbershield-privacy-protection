# NumberShield Privacy Protection

Build a new private UNPUBLISHED Lovable project named "NumberShield" from the user's standalone Notion master blueprint: https://app.notion.com/p/3ffc116103068118a2bacb012f23a240?pvs=204 (if external page can't be fetched, requirements reproduced here). This is a premium privacy-protection SaaS product, not connected to any other project. Build a usable secure full-stack beta with crisp mobile-friendly dark navy / graphite / teal UI, accessible and trustworthy design. PAGES: public landing page, How it works, Security, Provider Coverage, Pricing (no invented real rates), FAQ, support, Terms/Privacy placeholders clearly requiring counsel review; user signup/login/reset, email confirmation, ideally real managed auth; onboarding verify phone number (genuine verification only if SMS integration configured, otherwise clearly 'Pending verification setup' and no fake verification), granular consent forms; after confirmation member dashboard / My Numbers / Protection Activation / full listing removals / status & notifications / account settings; team/family org member invitations and RBAC; protected admin console for provider list, tickets, requests, legal cases, logs. Core CTA 'Activate My NumberShield' accepts signed-in verified-number owner opt-in consent and displays coverage, queues ONLY DEMO/mock removal requests until actual provider contracts/authorized APIs are configured; never suggest completed real removals. Support multitenancy and per-user/org isolation with database row-level security, server-side permission enforcement, minimal sensitive data storage, sensible security defaults and audit events. Data models: users/profiles, organizations, memberships/roles, verified phone numbers and verification status, consents, providers, delisting requests and statuses, receipts, alerts, case intake, support, audit events. Show honest stages Pending, Confirmed, Rejected, Unsupported, Mock rather than false claims. Opt-out seeks to remove FULL public phone listing where lawful/provider-supported, not just review comments. Preserve legitimate spam/consumer safety reporting and anonymous speech rights; do not create identity tracking/doxxing capability. Legal section: confidential evidence intake and attorney referral readiness only; no automated legal filings or unverified blame. Add installable PWA if achievable, service worker/manifest, and honest Install App instructions; iOS App Store / Google Play downloads are future milestones, no fake buttons or packages. Need functioning flows as possible, not just decorative screens; use demo adapters transparently where backend integrations aren't configured. Create verification and testing checklist for registration, RBAC, provider request state, activation, revocation, PWA install, accessibility, mobile responsive. DO NOT publish, deploy production, activate billing, send communications, access external providers or delete any real user data without owner approval. Proceed with scaffold and code.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c24c59a6-b268-40a1-aa39-4813327e83be).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
