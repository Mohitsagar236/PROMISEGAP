# Testing

Unit tests cover extraction, normalization, categorization, validation, matching, gap detection, risk scoring, account risk scoring, workflow transitions, recommendations, report generation, and AI fallback.

Integration tests cover document-to-promise extraction, promise-capability matching, risk scoring, workflow transition, and report generation.

E2E covers login and document ingestion entry.

Run:

```bash
npm run test
npm run test:integration
npm run test:e2e
```
