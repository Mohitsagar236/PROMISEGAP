# Risk Model

Promise risk is a configurable 0-100 score.

Default factors:

- Unsupported capability: 30
- Partial support: 18
- Enterprise customer: 12
- Contract/SOW/proposal source: 14
- Deadline within 30 days: 12
- Missing owner: 10
- High-value deal: 10
- Compliance/security/identity category: 12
- Low confidence: 8
- Repeated promise: 8

Risk levels: Low below 35, Medium 35-59, High 60-79, Critical 80+.

Example: an enterprise proposal promising a planned identity feature with no owner and onboarding in 21 days becomes high or critical risk.

Limitations: rule-based scoring is explainable but not a substitute for product, legal, and customer review.
