---
name: Deployable article sources
description: Reliable storage for imported article Markdown used by the static site and deployments.
---

Static article records should not rely on Markdown files kept only in `attached_assets`. In this environment, `/etc/.gitignore` globally excludes `attached_assets/*`, so files there can be available in the workspace preview but absent from Git-based publishing sources. Keep public article Markdown in `data/articles/` and point each record's `sourceFile` there; keep the original upload in `attached_assets` only as an optional source copy.

**Why:** Newly added posts rendered locally but production showed “Article content unavailable” because the page's fetch target was omitted from tracked deployment files.

**How to apply:** When importing articles, copy files from `attached_assets` into `data/articles`, update `sourceFile` URLs, and verify the URLs load locally and the files are not ignored by Git.
