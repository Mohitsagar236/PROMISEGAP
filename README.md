# PromiseGap

PromiseGap is a human-in-the-loop B2B SaaS MVP that extracts customer promises from sales and onboarding materials, maps them to verified product capabilities, and flags unsupported commitments before onboarding or contract finalization.

Tagline: Catch customer promises before they become product escalations.

## Why It Exists

B2B SaaS teams lose trust when customers hear commitments that the product only partially supports, requires custom work for, or cannot deliver. PromiseGap gives Product, Sales, Customer Success, and Solution Engineering a shared review workflow for promise risk.

## Tech Stack

- Next.js, React, TypeScript
- Prisma ORM with local SQLite demo database
- Zod validation
- Custom credentials auth with hashed passwords
- Rule-based extraction with optional OpenAI-compatible AI fallback
- Vitest and Playwright
- Docker Compose file for future PostgreSQL deployment

## Setup

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000.

## Environment Variables

- `DATABASE_URL`: defaults to `file:./dev.db`
- `SESSION_SECRET`: set a long random value for production
- `OPENAI_API_KEY`: optional
- `AI_MODEL`: optional model name

The app works without an AI key by using deterministic rule-based extraction.

## Demo Login

- Email: `admin@promisegap.demo`
- Password: `PromiseGap123!`

Additional demo users: `pm@promisegap.demo`, `sales@promisegap.demo`, `cs@promisegap.demo` with the same password.

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run test:e2e
npm run build
npm run demo:reset
```

## Main Demo Flow

1. Login as the demo admin.
2. Open Dashboard to see promise risk metrics.
3. Visit Documents, create a pasted sales transcript, and run extraction.
4. Open a promise detail page to compare customer promise against product evidence.
5. Assign an owner, mark human review, and create an action item.
6. Open account and capability detail pages to show risk dependencies.
7. Review reports and the case-study page.

## Deployment Notes

The current MVP uses SQLite for a frictionless local portfolio demo. For production, switch Prisma datasource to PostgreSQL, run migrations against the Postgres service, add robust session storage, and configure production secrets.
