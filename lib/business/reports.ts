export type ReportAccount = { name: string; arr?: number; dealStage?: string; riskScore?: number };
export type ReportPromise = {
  promiseText: string;
  normalizedClaim: string;
  category: string;
  riskLevel: string;
  riskScore: number;
  riskExplanation: string;
  status: string;
  account?: ReportAccount;
  matches?: Array<{ gapType: string; supportStatus: string; capability?: { name: string } }>;
};
export type ReportCapability = {
  name: string;
  category: string;
  supportStatus: string;
  evidence: string;
  matches?: Array<{ promise: ReportPromise; gapType: string }>;
};

function promiseLine(promise: ReportPromise) {
  const match = promise.matches?.[0];
  return `- ${promise.account?.name ?? "Account"}: ${promise.normalizedClaim} (${promise.riskLevel}, ${match?.gapType ?? "Needs review"})`;
}

export function generateCustomerRiskReport(account: ReportAccount, promises: ReportPromise[]) {
  const high = promises.filter((promise) => ["High", "Critical"].includes(promise.riskLevel));
  return `# Customer Promise Risk Report: ${account.name}

## Executive summary
${account.name} has ${promises.length} tracked promises and ${high.length} high-risk gaps. The team should resolve unsupported or unclear promises before onboarding or contract finalization.

## Top risks
${high.slice(0, 8).map(promiseLine).join("\n") || "- No high-risk promises currently detected."}

## Recommended actions
- Assign owners to unresolved high-risk promises.
- Confirm capability evidence with Product before making customer commitments.
- Send customer-safe clarification for partial or unsupported capabilities.
`;
}

export function generateUnsupportedPromiseReport(promises: ReportPromise[]) {
  const unsupported = promises.filter((promise) => promise.matches?.some((match) => /Unsupported|Planned|custom|review/i.test(match.gapType)));
  return `# Unsupported Promise Report

## Executive summary
${unsupported.length} promises need a decision because they are unsupported, planned, custom-only, or lack a verified capability match.

## Unsupported or unresolved promises
${unsupported.map(promiseLine).join("\n") || "- No unsupported promises found."}
`;
}

export function generateCapabilityGapReport(capabilities: ReportCapability[]) {
  const risky = capabilities.filter((capability) => capability.supportStatus !== "Supported");
  return `# Capability Gap Report

## Executive summary
${risky.length} catalogue capabilities are not fully supported and may create customer promise gaps.

## Capability gaps
${risky
  .map((capability) => `- ${capability.name}: ${capability.supportStatus}. Evidence: ${capability.evidence}`)
  .join("\n")}
`;
}

export function generateSalesProductAlignmentReport(promises: ReportPromise[]) {
  const needsClarification = promises.filter((promise) => /clarification|review|estimate|gap/i.test(promise.status));
  return `# Sales/Product Alignment Report

## Executive summary
${needsClarification.length} promises need cross-functional alignment before being treated as customer-safe commitments.

## Decisions needed
${needsClarification.map(promiseLine).join("\n") || "- No alignment decisions needed."}
`;
}
