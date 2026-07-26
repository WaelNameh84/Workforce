---
name: Workspace validation
description: Monorepo validation rules learned while maintaining the workforce app
---

The full workspace typecheck includes utility packages, not only the running web and API artifacts. Any utility that imports a workspace library or runtime package must declare those dependencies and its TypeScript project references explicitly.

**Why:** Missing declarations can leave the main app running while making the repository-wide validation fail, and Express 5 route params may need explicit string coercion before numeric parsing.

**How to apply:** When adding or repairing scripts or server routes, update the package manifest, lockfile, and tsconfig references together, then run the root typecheck and restart affected workflows.