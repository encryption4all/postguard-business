# Security Policy

PostGuard for Business handles identity attributes, email signing, and API
keys, so we take security reports seriously and appreciate responsible
disclosure.

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues,
pull requests, or discussions.**

Instead, use one of these private channels:

1. **GitHub private vulnerability reporting (preferred).** Open a report via the
   repository's **Security** tab → **Report a vulnerability**, or directly at
   <https://github.com/encryption4all/postguard-business/security/advisories/new>.
2. **Email (fallback).** Send the details to **info@postguard.eu**.

Please include as much of the following as you can:

- A description of the vulnerability and its potential impact.
- Steps to reproduce, or a proof of concept.
- The affected version, tag, commit, or URL.
- Any suggested remediation, if you have one.

## What to expect

- We aim to acknowledge a report within **5 business days**.
- We will keep you informed of progress toward a fix and coordinate on
  disclosure timing.
- With your consent, we are happy to credit you once the issue is resolved.

## Supported versions

This is a continuously released application. Security fixes land on `main` and
are shipped in the latest release; older tags do not receive backported fixes.

| Version                 | Supported |
| ----------------------- | --------- |
| Latest release / `main` | ✅        |
| Older tagged releases   | ❌        |

Deployments should track the latest release (or the `edge` image) to stay on a
supported version.

## Scope

**In scope**

- The application code in this repository (the SvelteKit app, its server
  endpoints, and the published Docker image).

**Out of scope** (please report elsewhere or expect a lower priority)

- The Yivi / IRMA infrastructure itself — report those to the
  [Yivi project](https://github.com/privacybydesign).
- Vulnerabilities in third-party dependencies with no demonstrated impact here;
  report upstream, and we will pick up the fix via a dependency bump.
- Demo / seed data and example values (e.g. the `*.example.nl` fixtures).
- Findings that require a compromised device, physical access, or social
  engineering, and volumetric denial-of-service.
