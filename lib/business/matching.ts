import { gapTypes } from "../constants";

export type PromiseLike = {
  promiseText: string;
  normalizedClaim: string;
  category: string;
  confidenceScore?: number;
};

export type CapabilityLike = {
  id?: string;
  name: string;
  description: string;
  category: string;
  supportStatus: string;
  evidence: string;
  limitations?: string | null;
  productOwner?: string | null;
};

const synonyms: Record<string, string[]> = {
  entra: ["azure ad", "microsoft identity", "oidc", "sso", "graph"],
  salesforce: ["crm", "sfDC", "integration"],
  pdf: ["report", "export"],
  audit: ["log", "event", "security"],
  rbac: ["role", "permission", "access control"],
  ai: ["summarization", "workflow generation", "automation"],
  soc2: ["security", "compliance"],
  eu: ["data residency", "region"]
};

function tokens(value: string) {
  const base = value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return new Set(base.flatMap((token) => [token, ...(synonyms[token] ?? [])]));
}

export function calculateMatchConfidence(promise: PromiseLike, capability: CapabilityLike) {
  const promiseTokens = tokens(`${promise.promiseText} ${promise.normalizedClaim}`);
  const capabilityTokens = tokens(`${capability.name} ${capability.description} ${capability.evidence}`);
  const overlap = [...promiseTokens].filter((token) => capabilityTokens.has(token));
  const categoryBoost = promise.category === capability.category ? 0.28 : 0;
  const score = overlap.length / Math.max(8, promiseTokens.size) + categoryBoost;
  return Number(Math.min(0.98, Math.max(0.08, score)).toFixed(2));
}

export function detectPromiseGap(_promise: PromiseLike, matchedCapability?: CapabilityLike | null) {
  if (!matchedCapability) return "Needs product review";
  const status = matchedCapability.supportStatus;
  if (status === "Supported") return "Fully supported";
  if (status === "Partially supported") return "Partially supported";
  if (status === "Planned") return "Planned but not live";
  if (status === "Custom only") return "Requires custom work";
  if (status === "Depends on configuration") return "Depends on configuration";
  if (status === "Not supported" || status === "Deprecated") return "Unsupported";
  return "Ambiguous promise";
}

export function matchPromiseToCapabilities(promise: PromiseLike, capabilities: CapabilityLike[]) {
  const ranked = capabilities
    .map((capability) => ({
      capability,
      matchConfidence: calculateMatchConfidence(promise, capability)
    }))
    .sort((a, b) => b.matchConfidence - a.matchConfidence);
  const best = ranked[0];
  const gapType = best && best.matchConfidence >= 0.18 ? detectPromiseGap(promise, best.capability) : "Needs product review";
  const capability = best?.matchConfidence >= 0.18 ? best.capability : null;
  return {
    capability,
    matchConfidence: best?.matchConfidence ?? 0,
    supportStatus: capability?.supportStatus ?? "Unknown",
    gapType: gapType as (typeof gapTypes)[number],
    explanation: capability
      ? `Matched to ${capability.name} using category and keyword overlap. Current evidence says: ${capability.evidence}`
      : "No strong catalogue match was found; product review is required before relying on this promise.",
    evidence: capability?.evidence ?? "No verified product evidence matched.",
    requiresHumanReview: !capability || best.matchConfidence < 0.72 || gapType !== "Fully supported",
    suggestedOwner: capability?.productOwner ?? "Product Manager"
  };
}
