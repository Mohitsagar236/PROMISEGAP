# Architecture

PromiseGap is a Next.js App Router application with server actions and Prisma.

Business logic lives in `lib/business` and is framework-light so it can be unit tested. UI pages query Prisma directly in server components and call server actions for mutations.

Authentication is credentials-based with hashed passwords and an HTTP-only demo session cookie. Production should replace the simple cookie session with signed or database-backed sessions.

The demo database is SQLite for local reliability. The schema is designed to map cleanly to PostgreSQL for production.
