# Progress Checklist

Legend: ✅ done · 🟡 written, not yet run/verified · ⬜ not started

| Phase | Scope | Status |
|---|---|---|
| 0 | Architecture, ER, permission matrix, roadmap | ✅ |
| 1 | Monorepo scaffold | 🟡 |
| 1 | Prisma schema (52 models) | 🟡 needs `prisma validate` + first migration |
| 1 | Env validation, errors, request-id, logging, validate middleware | 🟡 |
| 1 | Swagger skeleton (`/api/docs`, dev only) + `/api/v1/health` | 🟡 |
| 1 | Seed (permissions, Super Admin, demo org, default statuses/sources/pipeline) | 🟡 |
| 1 | Error-handling tests | 🟡 |
| 2 | Auth, RBAC, tenant isolation, audit | ⬜ |
| 3 | App shell, design system, Settings | ⬜ |
| 4 | Leads, assignment, notifications | ⬜ |
| 5 | Follow-ups, tasks, reminders | ⬜ |
| 6 | Clients, conversion, documents, communications | ⬜ |
| 7 | Products, deals, quotations + PDF | ⬜ |
| 8 | Invoices, payments, receipts | ⬜ |
| 9 | Campaigns, tickets, employees/teams | ⬜ |
| 10 | Dashboard, reports, exports | ⬜ |
| 11 | Integrations, hardening, E2E | ⬜ |
| 12 | Docs, Docker, deployment | ⬜ |

## Design notes
- `createdById`/`updatedById` are plain uuid columns without FK, so removing a user never blocks history.
- Per-org Role rows are seeded so each organization can edit its own permissions; `super_admin` is a single platform role (organizationId = null).
- Invoice `paidAmount`/`pendingAmount` are stored and must be updated only inside the payment transaction (Phase 8).
