# NumberShield beta — verification & testing checklist

Status legend: [ ] not run · [x] passed · [!] failed

## Registration & auth
- [ ] Sign up with email → "check your email" shown; no session until confirmed
- [ ] Confirmation link lands on /dashboard signed in
- [ ] Sign in / sign out (Back button does not restore protected page)
- [ ] Forgot password → email → /reset-password sets new password
- [ ] Settings password change requires current password
- [ ] Signed-out visit to /dashboard redirects to /auth and returns after sign-in

## Phone numbers & verification
- [ ] Add number in E.164 format; invalid formats rejected
- [ ] New number shows "Pending verification setup"; "Send code" disabled
- [ ] User cannot self-verify (direct update of verification fields is rejected by database)
- [ ] Admin manual verification requires a note and is written to the audit log

## Consent, activation & revocation
- [ ] Activation locked for unverified numbers (UI + database function)
- [ ] Activation fails without the 3 required consents
- [ ] Activation creates only Mock (supported/partial) or Unsupported (planned/unsupported) requests
- [ ] No screen claims a real or completed removal
- [ ] Revoke withdraws Mock/Pending requests and revokes authorization consents
- [ ] Re-activation re-queues withdrawn requests only

## Provider request state
- [ ] Admin cannot set demo requests to Pending/Confirmed
- [ ] Status changes recorded in audit log with from → to

## RBAC & isolation
- [ ] User A cannot read user B's numbers, consents, requests, alerts, cases
- [ ] Group admin can invite, change member/admin roles, remove members; cannot touch owner
- [ ] Plain member cannot invite or change roles
- [ ] Invitation accepted only by matching email address
- [ ] Group members never see each other's numbers
- [ ] Non-staff redirected away from /admin; staff-only data blocked by database policies
- [ ] Support role can read tickets/cases but cannot change providers or verification

## PWA install
- [ ] manifest.webmanifest loads; icons 192/512 present
- [ ] Android Chrome "Install app" works on published site
- [ ] iOS Safari "Add to Home Screen" works
- [ ] No App Store / Play buttons anywhere; offline not claimed

## Accessibility
- [ ] Keyboard-only navigation through header, forms, dashboard nav
- [ ] Visible focus ring everywhere
- [ ] All form fields have labels; status shown as text, not color alone
- [ ] Contrast AA on navy background (check muted text)
- [ ] Screen reader announces toasts and form errors

## Mobile responsive
- [ ] 360px, 390px, 768px, 1280px widths: no horizontal scroll
- [ ] Mobile menu on public pages; bottom nav in app

## Owner-approval gates (do not do without approval)
- Publishing / production deploy · billing · sending emails/SMS · contacting real providers · deleting real user data
- Configure SMS verification provider before real verification
- Counsel review of Terms & Privacy before launch
