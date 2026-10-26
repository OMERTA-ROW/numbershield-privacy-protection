# Owner access roadmap
- [x] Inspect existing auth, ownership and backend isolation without mutations: main uses shared backend, no owner/accounts.
- [ ] Prepare fail-closed owner invitations and member-management code and isolated-backend SQL.
- [x] Main checks: 13 routing/authorization unit tests; browser signed-out owner/invite rejection, return-to and recovery protection; build OK.
- [ ] Isolated runtime checks: invitation expiry/replay/revoke, role escalation and cross-user boundaries; waiting on draft isolation verification.
- [ ] Document changed files, observed checks, provider limits and secure owner activation.
- [ ] Activate and test real owner/tester accounts only after isolated backend and verified owner are available.
- [ ] Continue authorized isolated implementation in draft “Private accounts isolated testing”; verify binding before mutations, leave draft unaccepted.