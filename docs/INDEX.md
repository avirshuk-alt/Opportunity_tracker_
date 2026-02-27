# Opportunity Tracker — Docs & Links

Open these in your editor or browser:

| Document | Path | Description |
|----------|------|-------------|
| **Domain model & schema guide** | [DOMAIN-MODEL.md](./DOMAIN-MODEL.md) | Entities, relationships, status, scoring, and link to Prisma schema |
| **Prisma schema** | [../prisma/schema.prisma](../prisma/schema.prisma) | Database schema (PostgreSQL) |

## Quick start (database)

1. Copy `.env.example` to `.env` and set `DATABASE_URL` (PostgreSQL).
2. Install deps: `pnpm install`
3. Generate client: `pnpm db:generate`
4. Apply schema: `pnpm db:push` or `pnpm db:migrate`
5. Seed: `pnpm db:seed`
6. (Optional) Open Prisma Studio: `pnpm db:studio`

## File paths to open

- **Domain model (this doc):**  
  `docs/DOMAIN-MODEL.md`

- **Prisma schema:**  
  `prisma/schema.prisma`

- **Seed script:**  
  `prisma/seed.ts`

- **DB client:**  
  `lib/db/prisma.ts`
