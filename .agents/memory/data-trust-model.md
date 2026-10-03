---
name: Data trust model
description: How this independent healthcare information site handles facts that still need official verification.
---

The site should remain useful when current official rates, package values, requirements, or directory records cannot be safely verified. Keep the calculation or search interaction operational, label the result as illustrative, demo, or needs-review, link to the official source, and show the review context.

**Why:** Presenting invented healthcare details as current official information would undermine trust and could mislead users; showing a dead tool is also not useful.

**How to apply:** Preserve status/source metadata when adding or replacing records in the local data layer. Never upgrade a record to verified without checking the current official source.

For locally oriented health screening without a validated local model, show transparent risk factors and next steps rather than a score or probability. Asian waist cutoffs can be presented as individual screening flags, not diagnoses.

**Why:** Reusing a score calibrated for another population or inventing local weights would imply a level of predictive accuracy that has not been established.

**How to apply:** Keep risk-factor screens browser-local, link the source for each cutoff, explain the population context, and direct users to appropriate clinical measurement or testing.