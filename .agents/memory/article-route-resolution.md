---
name: Article route resolution
description: Safety rule for clean article routes and compatibility aliases in the static guide renderer.
---

Guide URLs may arrive as clean slugs, trailing-slash routes, or `.html` aliases, so article lookup must normalize those forms to the same slug.

**Why:** A silent fallback to the first guide can show a valid but unrelated article when a route lookup misses, making a broken Cesarean or Maternity page look like a Contribution page.

**How to apply:** Normalize route values before lookup and render a clear not-found state when no guide matches; never substitute an unrelated guide record.