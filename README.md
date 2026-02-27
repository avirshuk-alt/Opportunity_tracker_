# Opportunity Tracker

Next.js 14 (App Router) application for category strategy, opportunities, risks, suppliers, and roadmap management.

## Run the application

**If you see “npm is not recognized” on Windows,** see [SETUP-WINDOWS.md](SETUP-WINDOWS.md) to install Node.js and fix PATH.

From the project root:

```bash
# Install dependencies (use npm, pnpm, or yarn)
npm install

# Start the dev server (generates Prisma client, then starts Next.js)
npm run dev
```

Then open **http://localhost:3000** in your browser.

### Other commands

| Command | Description |
|--------|-------------|
| `npm run dev` | Start development server (with Turbo) |
| `npm run build` | Generate Prisma client and build for production |
| `npm run start` | Start production server (run `build` first) |
| `npm run db:generate` | Generate Prisma client only |
| `npm run db:push` | Push schema to database (no migration files) |
| `npm run db:studio` | Open Prisma Studio (requires `DATABASE_URL` in `.env`) |

### Database (optional)

The app runs **without a database** using in-memory mock data. To use PostgreSQL:

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. Run `npm run db:push` then `npm run db:seed` to create and seed tables.

See [docs/INDEX.md](docs/INDEX.md) for architecture and schema docs.
