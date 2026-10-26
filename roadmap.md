# Owner access roadmap
- [x] Inspect existing auth, ownership and backend isolation without mutations: main uses shared backend, no owner/accounts.
- [ ] Prepare fail-closed owner invitations and member-management code and isolated-backend SQL.
- [ ] Verify signed-out rejection, role escalation, invitation expiry/replay and cross-user boundaries with tests.
- [ ] Document changed files, observed checks, provider limits and secure owner activation.
- [ ] Activate and test real owner/tester accounts only after isolated backend and verified owner are available.
- [ ] Continue authorized isolated implementation in draft “Private accounts isolated testing”; verify binding before mutations, leave draft unaccepted.