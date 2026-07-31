import type { CapabilityLike, PromiseLike } from "./matching";

export type RiskSettings = {
  unsupportedCapabilityWeight: number;
  partialSupportWeight: number;
  enterpriseCustomerWeight: number;
  contractSourceWeight: number;
  dueDateProximityWeight: number;
  missingOwnerWeight: number;
  dealValueWeight: number;
  complianceSecurityWeight: number;
  lowConfidenceWeight: number;
  repeatedPromiseWeight: number;
};

export const defaultRiskSettings: RiskSettings = {
  unsupportedCapabilityWeight: 30,
  partialSupportWeight: 18,
  enterpriseCustomerWeight: 12,
  contractSourceWeight: 14,
  dueDateProximityWeight: 12,
  missingOwnerWeight: 10,
  dealValueWeight: 10,
  complianceSecurityWeight: 12,
  lowConfidenceWeight: 8,
  repeatedPromiseWeight: 8
};

type AccountLike = { segment: string; arr: number; onboardingDeadline?: Date | string | null };
type MatchLike = { gapType: string; matchConfidence: number; capability?: CapabilityLike | null };

function daysUntil(value?: Date | string | null) {
  if (!value) return Number.POSITIVE_INFINITY;
  const date = typeof value === "string" ? new Date(value) : value;
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}

export function riskLevelFromScore(score: number) {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High";
  if (score >= 35) return "Medium";
  return "Low";
}

export function generatePromiseRiskExplanation(factors: string[], level: string) {
  if (factors.length === 0) return `${level} risk because the promise appears aligned with verified capabilities and has sufficient ownership context.`;
  return `${level} risk because ${factors.join(", ")}.`;
}

export function calculatePromiseRiskScore(
  promise: PromiseLike & { dueDate?: Date | string | null; assignedOwnerId?: string | null; documentType?: string | null },
  account: AccountLike,
  match: MatchLike,
  settings: RiskSettings = defaultRiskSettings,
  repeatedCount = 0
) {
  const factors: string[] = [];
  let score = 0;

  if (["Unsupported", "Planned but not live", "Requires custom work", "Needs product review"].includes(match.gapType)) {
    score += settings.unsupportedCapabilityWeight;
    factors.push(`the capability is ${match.gapType.toLowerCase()}`);
  }
  if (["Partially supported", "Depends on configuration", "Conflicts with known limitation"].includes(match.gapType)) {
    score += settings.partialSupportWeight;
    factors.push(`the promise is ${match.gapType.toLowerCase()}`);
  }
  if (/enterprise/i.test(account.segment)) {
    score += settings.enterpriseCustomerWeight;
    factors.push("this is an enterprise customer");
  }
  if (/sow|proposal|contract/i.test(promise.documentType ?? "")) {
    score += settings.contractSourceWeight;
    factors.push("the promise appears in a commercial document");
  }
  if (daysUntil(promise.dueDate ?? account.onboardingDeadline) <= 30) {
    score += settings.dueDateProximityWeight;
    factors.push("the related deadline is within 30 days");
  }
  if (!promise.assignedOwnerId) {
    score += settings.missingOwnerWeight;
    factors.push("no accountable owner is assigned");
  }
  if (account.arr >= 150000) {
    score += settings.dealValueWeight;
    factors.push("the account value is high");
  }
  if (["Security", "Compliance", "SSO/identity", "Data import/export"].includes(promise.category)) {
    score += settings.complianceSecurityWeight;
    factors.push(`the category affects ${promise.category.toLowerCase()}`);
  }
  if ((promise.confidenceScore ?? 1) < 0.65 || match.matchConfidence < 0.45) {
    score += settings.lowConfidenceWeight;
    factors.push("extraction or match confidence is low");
  }
  if (repeatedCount >= 2) {
    score += settings.repeatedPromiseWeight;
    factors.push("similar unsupported promises repeat across customers");
  }

  const numericScore = Math.min(100, score);
  const riskLevel = riskLevelFromScore(numericScore);
  return {
    numericScore,
    riskLevel,
    factors,
    explanation: generatePromiseRiskExplanation(factors, riskLevel)
  };
}

export function calculateAccountRiskScore(account: AccountLike, promises: Array<{ riskScore: number; riskLevel: string; assignedOwnerId?: string | null }>) {
  const highRisk = promises.filter((promise) => ["High", "Critical"].includes(promise.riskLevel)).length;
  const missingOwners = promises.filter((promise) => !promise.assignedOwnerId).length;
  const base = promises.reduce((sum, promise) => sum + promise.riskScore, 0) / Math.max(1, promises.length);
  const deadlineBoost = daysUntil(account.onboardingDeadline) <= 30 ? 10 : 0;
  const score = Math.min(100, Math.round(base + highRisk * 4 + missingOwners * 2 + deadlineBoost + (account.arr >= 150000 ? 8 : 0)));
  return { score, level: riskLevelFromScore(score) };
}
