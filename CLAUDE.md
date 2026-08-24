# postguard-business

The portal for PostGuard's paid tier, live at `business.postguard.eu` (staging at
`business.staging.postguard.eu`). SvelteKit with `adapter-node`, Svelte 5 runes,
PostgreSQL through Drizzle, and Yivi attribute-based login for both organisation
users and admins. It carries the landing page and organisation registration,
API-key management, the email audit log, DNS verification, and an admin panel.

## Position

PostGuard is end-to-end encrypted email and file sending: you encrypt to
someone's identity, and they prove that identity to a key generator to get a
decryption key. It is free for personal use and paid for commercial use, and the
paid tier is what adds the features businesses come for, notably revocation and
sending mail programmatically through an API key. This repo is that tier's front
door.

One company, two GitHub orgs. Yivi owns everything: `privacybydesign` is the
Yivi/IRMA lineage, and `encryption4all` is the vehicle the PostGuard research
project used to apply for grants, kept as an org after Yivi bought PostGuard to
commercialise it. The split is historical, not organisational: same company, same
maintainers, same review conventions, and we are maintainers on every repo here.

## Repos to weigh before changing this one

- `encryption4all/postguard` — the core, and the PKG this portal talks to. The
  portal consumes its `/v2` API, so it moves when that wire format does.
- `privacybydesign/yivi-businesswallet` — a different product, not a sibling
  implementation of this one. Both do organisation management, member admin and an
  audit log, in different stacks. Unifying them is possible in future and is not
  planned: do not converge them, and do not assume a fix in one belongs in the
  other.

## Where the detail is

Conventions, commands and this repo's non-obvious rules are in
[`AGENTS.md`](AGENTS.md); setup, local URLs and demo accounts are in
[`README.md`](README.md); the documentation is at
`docs.postguard.eu/repos/postguard-business`. A check that should bind later work
belongs in the rule bundle a container reads, not in this file.

This file is orientation. The agent-notes corpus it used to be is not migrated
and not reconstructed: 7,242 bytes at `fcb7405`, the last revision carrying it
(`git show fcb7405:CLAUDE.md`). `tests/unit/claude-md-orientation.test.ts` holds
this file to 4,000 bytes.
