---
name: Imported workflow ownership
description: How to avoid port collisions when imported artifacts have both legacy and managed workflows.
---

When an imported project contains artifact-managed services and older manually configured workflows for the same apps, only one set should run. Duplicate workflow owners cause `EADDRINUSE` failures in Expo, Vite, and the API even when the application code is healthy.

**Why:** The imported workspace had legacy API, mobile, and web workflows alongside artifact-managed equivalents. Starting both sets claimed the same ports and produced the “artifact crashed” screen.

**How to apply:** Check the configured workflow names before restarting. Prefer the `artifacts/<slug>: <service>` managed workflows and remove stale legacy duplicates that use the same ports.