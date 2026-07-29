---
name: render-db-access
description: RENDER_DB_URL secret does not reflect the live Render production database for WorkforceOS; querying it returns an empty but schema-correct DB.
---

# Render DB access limitation

`RENDER_DB_URL` and the Replit dev database do NOT reflect the live WorkforceOS production data on Render. Both consistently return zero rows even though the deployed app clearly has real users/employees (confirmed via app behavior, e.g. "pending_approval" responses when re-registering known emails).

`RENDER_DB_URL` connects successfully to a reachable Postgres instance (`heliumdb`) with the exact right schema (all app tables present: users, employees, companies, departments, etc.) but 0 rows everywhere. So it's reachable and schema-correct, just not the same data store the deployed service reads/writes at runtime — most likely a stale or rotated instance (e.g. a free-tier Postgres that expired and was recreated, or a copy made before real data existed).

**Why:** Render web services set `DATABASE_URL` directly in their own dashboard environment config. Nothing keeps a connection string copied into a Replit secret in sync if the Render Postgres instance is ever rotated or recreated.

**How to apply:** Don't trust `RENDER_DB_URL` for "what does production actually contain" questions without first re-verifying row counts (`SELECT count(*) FROM users`, etc.) each session — it can silently be stale. If it's empty while the live app clearly has data, say so plainly rather than reporting a false zero. Point the user to Render's dashboard → Postgres → query console for ground truth, or ask them to refresh the secret with the current `DATABASE_URL` from Render's service settings if they want the agent to query it directly going forward.
