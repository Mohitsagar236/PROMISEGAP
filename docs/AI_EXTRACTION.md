# AI Extraction

PromiseGap supports two extraction modes.

Rule-based extraction uses sentence splitting, promise signal patterns, category keyword rules, normalization, confidence scoring, due date hints, and Zod validation.

Optional AI extraction runs only when `OPENAI_API_KEY` is present. AI output must return structured JSON and is validated before use. On failure, PromiseGap falls back to rule-based extraction.

AI suggestions are never final contractual decisions. The UI shows confidence, evidence, and review status.
