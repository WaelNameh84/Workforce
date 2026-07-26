---
name: Payroll approval state
description: Durable rule for approval and payroll treatment of leave and attendance justifications
---

Approval and payment are separate decisions. A request or attendance justification can be approved as paid or unpaid; only an explicitly paid approval contributes paid leave or overtime, while unpaid approval contributes the applicable deduction.

**Why:** Manager decisions must remain auditable and payroll must not infer payment from approval alone.

**How to apply:** Preserve `pending`, `paid`, and `unpaid` payment state through the API, UI, and payroll calculations whenever adding or changing request workflows.