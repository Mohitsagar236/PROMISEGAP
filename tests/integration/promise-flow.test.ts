import { describe, expect, it } from "vitest";
import { extractPromisesRuleBased } from "../../lib/business/extraction";
import { matchPromiseToCapabilities } from "../../lib/business/matching";
import { calculatePromiseRiskScore } from "../../lib/business/risk";
import { generateCustomerRiskReport } from "../../lib/business/reports";
import { validateWorkflowTransition } from "../../lib/business/workflow";

const capabilities = [
  {
    id: "graph",
    name: "Protected Microsoft Graph profile photo sync",
    description: "Protected photo sync from Microsoft Graph.",
    category: "SSO/identity",
    supportStatus: "Planned",
    evidence: "Planned, not fully released.",
    productOwner: "Product"
  }
];

describe("document-to-risk integration", () => {
  it("uploads/pastes text conceptually and extracts promises", () => {
    const extracted = extractPromisesRuleBased("Employee profile photos will automatically sync from Entra ID, including protected Microsoft Graph photos.");
    expect(extracted[0].category).toBe("SSO/identity");
  });

  it("matches extracted promise to capability and calculates risk", () => {
    const extracted = extractPromisesRuleBased("Employee profile photos will automatically sync from Entra ID, including protected Microsoft Graph photos.")[0];
    const match = matchPromiseToCapabilities(extracted, capabilities);
    const risk = calculatePromiseRiskScore(
      { ...extracted, assignedOwnerId: null, documentType: "Statement of Work" },
      { segment: "Enterprise", arr: 300000, onboardingDeadline: new Date(Date.now() + 10 * 86_400_000) },
      { gapType: match.gapType, matchConfidence: match.matchConfidence, capability: match.capability }
    );
    expect(risk.riskLevel).toMatch(/High|Critical/);
  });

  it("supports action-item workflow transition", () => {
    expect(validateWorkflowTransition("Gap detected", "Product review needed")).toBe(true);
  });

  it("generates customer risk report for matched promises", () => {
    const report = generateCustomerRiskReport({ name: "Acme Pharma" }, [{ promiseText: "x", normalizedClaim: "Graph photo sync", category: "SSO/identity", riskLevel: "High", riskScore: 70, riskExplanation: "High risk", status: "Gap detected" }]);
    expect(report).toContain("Top risks");
  });
});
