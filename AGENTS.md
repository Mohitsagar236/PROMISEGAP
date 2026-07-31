# PromiseGap Agent Guide

## Project Overview

PromiseGap is a Technical PM portfolio SaaS app for detecting gaps between customer promises and verified product capabilities. It is not a CRM or chatbot; the core workflow is promise extraction, matching, risk scoring, human review, and ownership.

## Commands

- Install: `npm install`
- Generate Prisma client: `npm run prisma:generate`
- Migrate: `npm run prisma:migrate`
- Seed: `npm run db:seed`
- Reset demo data: `npm run demo:reset`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Unit tests: `npm run test`
- Integration tests: `npm run test:integration`
- E2E: `npm run test:e2e`
- Build: `npm run build`

## Architecture Notes

- `app/`: Next.js routes and server actions.
- `components/`: shared UI primitives and sidebar.
- `lib/business/`: extraction, matching, risk, reports, and workflow logic.
- `lib/validators.ts`: Zod schemas for server-side validation.
- `prisma/schema.prisma`: core data model.
- `prisma/seed-helpers.ts`: synthetic demo data.
- `tests/`: unit, integration, and E2E tests.

## Coding Standards

Keep business logic out of UI components. Validate server action inputs with Zod. Never hardcode secrets. AI output is advisory and must retain human review states.

## Adding Extraction Rules

Update `lib/business/extraction.ts`: add category patterns or promise signal regexes, then add tests in `tests/business.test.ts`.

## Adding Risk Factors

Update `RiskSettings`, `defaultRiskSettings`, and `calculatePromiseRiskScore` in `lib/business/risk.ts`. Add a setting input in `/settings` and tests for the explanation.

## Adding Tests

Prefer unit tests for deterministic logic. Add integration tests when a full promise flow changes. Keep Playwright tests focused on critical demo journeys.

## Guardrails

Do not treat AI suggestions as contractual decisions. Preserve explainability, confidence, evidence, owner, status, and review fields for every promise.
