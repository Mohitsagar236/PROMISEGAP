import { describe, expect, it } from "vitest";
import { categorizePromise, extractPromisesRuleBased, extractPromisesWithAI, normalizePromiseClaim, validateExtractedPromiseJson } from "../lib/business/extraction";
import { calculateMatchConfidence, detectPromiseGap, matchPromiseToCapabilities } from "../lib/business/matching";
import { calculateAccountRiskScore, calculatePromiseRiskScore, defaultRiskSettings } from "../lib/business/risk";
import { generateCapabilityGapReport, generateCustomerRiskReport, generateSalesProductAlignmentReport, generateUnsupportedPromiseReport } from "../lib/business/reports";
import { recommendPromiseNextAction, validateWorkflowTransition } from "../lib/business/workflow";

const promise = {
  promiseText: "Employee profile photos will automatically sync from Entra ID, including protected Microsoft Graph photos.",
  normalizedClaim: "Employee profile photos automatically sync from Entra ID, including protected Microsoft Graph photos.",
  category: "SSO/identity",
  confidenceScore: 0.84
};

const capabilities = [
  {
    id: "cap_public",
    name: "Public profile image claim",
    description: "Profile image URL claims can be displayed when public.",
    category: "SSO/identity",
    supportStatus: "Supported",
    evidence: "Public profile image claim rendering is supported.",
    productOwner: "PM"
  },
  {
    id: "cap_graph",
    name: "Protected Microsoft Graph profile photo sync",
    description: "Retrieve protected profile photos from Microsoft Graph.",
    category: "SSO/identity",
    supportStatus: "Planned",
    evidence: "Protected Graph photo retrieval is not fully released.",
    productOwner: "PM"
  }
];

describe("promise extraction", () => {
  it("extracts rule-based promises", () => {
    const result = extractPromisesRuleBased("The system supports SAML and OIDC SSO. Salesforce integration is available out of the box.");
    expect(result).toHaveLength(2);
  });

  it("normalizes promise claims", () => {
    expect(normalizePromiseClaim("The system will support SAML SSO.")).toContain("SAML SSO");
  });

  it("categorizes identity promises", () => {
    expect(categorizePromise("We support Entra ID SSO.")).toBe("SSO/identity");
  });

  it("validates extracted promise JSON", () => {
    expect(validateExtractedPromiseJson({ ...promise, sourceLocation: "Sentence 1", dueDate: null, extractedOwner: null, extractionMethod: "Rule-based" })).toBeTruthy();
  });

  it("falls back to rule-based extraction when no API key exists", async () => {
    const oldKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const result = await extractPromisesWithAI("Customers can export reports as PDF.");
    process.env.OPENAI_API_KEY = oldKey;
    expect(result[0].extractionMethod).toBe("Rule-based");
  });
});

describe("matching and gaps", () => {
  it("calculates match confidence", () => {
    expect(calculateMatchConfidence(promise, capabilities[1])).toBeGreaterThan(0.3);
  });

  it("matches a promise to a capability", () => {
    const result = matchPromiseToCapabilities(promise, capabilities);
    expect(result.capability?.name).toContain("Graph");
  });

  it("detects planned capability gaps", () => {
    expect(detectPromiseGap(promise, capabilities[1])).toBe("Planned but not live");
  });

  it("detects fully supported gaps", () => {
    expect(detectPromiseGap(promise, capabilities[0])).toBe("Fully supported");
  });
});

describe("risk scoring", () => {
  it("scores unsupported enterprise commercial promises as high risk", () => {
    const score = calculatePromiseRiskScore(
      { ...promise, assignedOwnerId: null, documentType: "Proposal" },
      { segment: "Enterprise", arr: 250000, onboardingDeadline: new Date(Date.now() + 7 * 86_400_000) },
      { gapType: "Planned but not live", matchConfidence: 0.4, capability: capabilities[1] },
      defaultRiskSettings
    );
    expect(score.riskLevel).toMatch(/High|Critical/);
  });

  it("calculates account risk", () => {
    const score = calculateAccountRiskScore({ segment: "Enterprise", arr: 200000 }, [{ riskScore: 80, riskLevel: "Critical" }]);
    expect(score.score).toBeGreaterThan(80);
  });

  it("recommends owner assignment for high-risk unowned promises", () => {
    expect(recommendPromiseNextAction({ riskLevel: "High", assignedOwnerId: null }, { gapType: "Unsupported" }, { numericScore: 75 })).toContain("Assign");
  });
});

describe("workflow and reports", () => {
  it("validates allowed workflow transitions", () => {
    expect(validateWorkflowTransition("Extracted", "Needs review")).toBe(true);
  });

  it("rejects invalid workflow transitions", () => {
    expect(validateWorkflowTransition("Archived", "Approved")).toBe(false);
  });

  it("generates customer risk reports", () => {
    const report = generateCustomerRiskReport({ name: "Acme Pharma" }, [{ ...promise, riskLevel: "High", riskScore: 70, riskExplanation: "High risk", status: "Gap detected" }]);
    expect(report).toContain("Acme Pharma");
  });

  it("generates unsupported promise reports", () => {
    const report = generateUnsupportedPromiseReport([{ ...promise, riskLevel: "High", riskScore: 70, riskExplanation: "High risk", status: "Gap detected", matches: [{ gapType: "Unsupported", supportStatus: "Not supported" }] }]);
    expect(report).toContain("Unsupported");
  });

  it("generates capability gap reports", () => {
    const report = generateCapabilityGapReport([{ ...capabilities[1], matches: [] }]);
    expect(report).toContain("Capability Gap");
  });

  it("generates sales/product alignment reports", () => {
    const report = generateSalesProductAlignmentReport([{ ...promise, riskLevel: "High", riskScore: 70, riskExplanation: "High risk", status: "Product review needed" }]);
    expect(report).toContain("Sales/Product");
  });
});
