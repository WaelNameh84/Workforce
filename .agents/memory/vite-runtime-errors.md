---
name: Vite runtime errors
description: Runtime-error overlay behavior in the WorkforceOS Vite preview
---

When the Vite runtime-error overlay reports only an unknown runtime error and the app itself serves correctly, inspect workflow/browser logs and verify the app with the overlay disabled before treating the overlay as the application failure.

**Why:** The overlay obscured a working login and dashboard preview, while the Vite server, API, and typecheck were healthy.

**How to apply:** Keep runtime diagnostics useful during debugging, but avoid allowing a non-actionable overlay to block the user-facing preview once the underlying app has been verified.