# CRM

Multi-tenant CRM: React + TypeScript frontend (Phase 3+), Express + TypeScript API, PostgreSQL via Prisma.

## Setup (Phase 1)
```bash
cp .env.example apps/api/.env   # then set real secrets (the API reads .env from apps/api)
npm install
npm run db:up                   # Postgres 16 + Redis 7 via Docker
npm run build -w @crm/shared    # API imports the shared package
cd apps/api
npx prisma validate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev                     # http://localhost:4000/api/docs  and  /api/v1/health
npm test
```
Seed creates a Super Admin from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` and a demo organization
(set `SEED_DEMO=false` to skip the demo org). Seed data contains no fake leads or clients.

See `docs/PROGRESS.md` for status.
