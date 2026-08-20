---
name: Static article data loading
description: Ordering constraint for the site's shared static renderer and large article dataset.
---

Library and article entry pages load the article dataset before the shared renderer so the renderer can derive guide metadata synchronously.

**Why:** The static server has no build step or module bundler; rendering before the dataset arrives silently produces an empty guide library.

**How to apply:** When adding another shared data file, keep its script tag before the site data and app renderer on every route that needs it.