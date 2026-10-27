---
name: Cloudflare Pages npm lockfile URLs
description: Keep package tarball URLs in this project's npm lockfile reachable from Cloudflare Pages.
---

For Cloudflare Pages builds, `package-lock.json` must use publicly reachable npm tarball URLs, not `package-firewall.replit.internal` URLs. Preserve package versions and integrity hashes when changing the registry host.

**Why:** Cloudflare's isolated build runner cannot reach Replit's private package mirror; `npm clean-install` fails before the static SEO build can run.

**How to apply:** Before publishing to Cloudflare Pages, check that every lockfile `resolved` URL uses `https://registry.npmjs.org/`, then verify the Pages install/build phase. Replit's npm installer may rewrite the installed package URL to its private mirror, so recheck after dependency repair.
