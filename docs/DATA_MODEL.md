# Data Model

The Prisma schema includes Organization, User, Account, Document, ExtractedPromise, Capability, PromiseCapabilityMatch, PromiseRiskScore, PromiseComment, PromiseActionItem, PromiseTimelineEvent, Report, RiskSetting, ImportBatch, and ImportError.

The core relationship is:

Document -> ExtractedPromise -> PromiseCapabilityMatch -> Capability.

Account aggregates promise risk, action items, documents, and onboarding context. RiskSetting stores configurable weights by organization.
