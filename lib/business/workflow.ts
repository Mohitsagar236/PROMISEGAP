export const allowedTransitions: Record<string, string[]> = {
  Extracted: ["Needs review", "Matched", "Archived"],
  "Needs review": ["Matched", "Sales clarification needed", "Product review needed", "Rejected", "Archived"],
  Matched: ["Gap detected", "Approved", "Product review needed", "Resolved"],
  "Gap detected": ["Sales clarification needed", "Product review needed", "Engineering estimate needed", "Resolved"],
  "Sales clarification needed": ["Customer clarification sent", "Product review needed", "Resolved"],
  "Product review needed": ["Engineering estimate needed", "Approved", "Rejected", "Resolved"],
  "Engineering estimate needed": ["Approved", "Rejected", "Resolved"],
  Approved: ["Resolved", "Archived"],
  Rejected: ["Archived"],
  "Customer clarification sent": ["Resolved", "Sales clarification needed"],
  Resolved: ["Archived"],
  Archived: []
};

export function validateWorkflowTransition(currentStatus: string, nextStatus: string) {
  return allowedTransitions[currentStatus]?.includes(nextStatus) ?? false;
}

export function recommendPromiseNextAction(
  promise: { riskLevel: string; assignedOwnerId?: string | null; needsHumanReview?: boolean },
  match: { gapType: string; requiresHumanReview?: boolean },
  riskScore: { numericScore: number }
) {
  if (!promise.assignedOwnerId && ["High", "Critical"].includes(promise.riskLevel)) return "Assign an accountable owner before customer-facing confirmation.";
  if (promise.needsHumanReview || match.requiresHumanReview) return "Product reviewer should confirm the extraction, capability match, and customer-safe wording.";
  if (match.gapType === "Unsupported") return "Request product decision and sales clarification before contract finalization.";
  if (match.gapType === "Partially supported") return "Clarify supported scope with Sales and document limitations for the customer.";
  if (riskScore.numericScore >= 60) return "Create a dated action item and review with Product, Sales, and CS.";
  return "Confirm evidence and mark resolved when the customer expectation is aligned.";
}
