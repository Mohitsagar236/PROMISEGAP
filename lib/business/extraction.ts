import { ExtractedPromiseInput, extractedPromiseSchema } from "../validators";

const categoryRules: Array<{ category: ExtractedPromiseInput["category"]; patterns: RegExp[] }> = [
  { category: "SSO/identity", patterns: [/saml/i, /oidc/i, /sso/i, /entra/i, /identity/i, /graph photo/i, /profile photo/i] },
  { category: "Compliance", patterns: [/soc ?2/i, /hipaa/i, /gdpr/i, /compliance/i, /data residency/i, /eu region/i] },
  { category: "Security", patterns: [/audit/i, /encryption/i, /security/i, /access log/i] },
  { category: "Analytics", patterns: [/analytics/i, /dashboard/i, /department-level/i, /insight/i] },
  { category: "Reporting", patterns: [/report/i, /pdf export/i, /export.*pdf/i] },
  { category: "Workflow automation", patterns: [/workflow/i, /automation/i, /automatically/i] },
  { category: "Data import/export", patterns: [/csv/i, /import/i, /export/i, /data transfer/i] },
  { category: "Permissions/RBAC", patterns: [/rbac/i, /role-based/i, /permission/i, /per department/i] },
  { category: "AI feature", patterns: [/\bai\b/i, /summarization/i, /generated automatically/i] },
  { category: "Integration", patterns: [/salesforce/i, /slack/i, /webhook/i, /integration/i, /api access/i] },
  { category: "Performance/SLA", patterns: [/uptime/i, /sla/i, /latency/i, /response time/i] },
  { category: "Custom implementation", patterns: [/custom/i, /professional services/i, /bespoke/i] },
  { category: "Support/service", patterns: [/support/i, /success manager/i, /training/i] },
  { category: "Migration/onboarding", patterns: [/migration/i, /onboarding/i, /go-live/i] },
  { category: "Billing/pricing", patterns: [/pricing/i, /billing/i, /included/i, /plan/i] },
  { category: "Admin controls", patterns: [/admin/i, /administrator/i, /tenant/i] }
];

const promiseSignals = [
  /\bwill\b/i,
  /\bsupports?\b/i,
  /\bcan\b/i,
  /\bincludes?\b/i,
  /\bavailable\b/i,
  /\bout of the box\b/i,
  /\bautomatically\b/i,
  /\bguarantee[sd]?\b/i,
  /\bcommit(?:ted)?\b/i
];

export function splitSentences(text: string) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function normalizePromiseClaim(promiseText: string) {
  return promiseText
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .replace(/\b(we|our product|the platform|the system|customers|customer|users)\b/gi, "")
    .replace(/\b(will|can|supports?|include[s]?|available|be able to)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase());
}

export function categorizePromise(promiseText: string): ExtractedPromiseInput["category"] {
  const rule = categoryRules.find((candidate) => candidate.patterns.some((pattern) => pattern.test(promiseText)));
  return rule?.category ?? "Other";
}

function inferDueDate(sentence: string): string | null {
  const daysMatch = sentence.match(/within\s+(\d{1,3})\s+days/i);
  if (daysMatch) {
    const due = new Date();
    due.setDate(due.getDate() + Number(daysMatch[1]));
    return due.toISOString();
  }
  const quarterMatch = sentence.match(/\b(Q[1-4])\s+20\d{2}\b/i);
  if (quarterMatch) {
    const due = new Date();
    const quarter = Number(quarterMatch[1].slice(1));
    due.setMonth(quarter * 3 - 1, 28);
    return due.toISOString();
  }
  return null;
}

function confidenceFor(sentence: string) {
  let score = 0.56;
  if (promiseSignals.some((pattern) => pattern.test(sentence))) score += 0.15;
  if (categorizePromise(sentence) !== "Other") score += 0.12;
  if (/sow|proposal|contract|committed|guaranteed/i.test(sentence)) score += 0.07;
  if (/maybe|might|could|unclear|possible/i.test(sentence)) score -= 0.18;
  return Math.min(0.96, Math.max(0.35, Number(score.toFixed(2))));
}

export function extractPromisesRuleBased(documentText: string): ExtractedPromiseInput[] {
  return splitSentences(documentText)
    .map((sentence, index) => ({ sentence, index }))
    .filter(({ sentence }) => promiseSignals.some((pattern) => pattern.test(sentence)))
    .filter(({ sentence }) => sentence.length > 18)
    .slice(0, 20)
    .map(({ sentence, index }) => ({
      promiseText: sentence,
      normalizedClaim: normalizePromiseClaim(sentence),
      sourceLocation: `Sentence ${index + 1}`,
      category: categorizePromise(sentence),
      confidenceScore: confidenceFor(sentence),
      dueDate: inferDueDate(sentence),
      extractedOwner: sentence.match(/owner(?: is|:)?\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/)?.[1] ?? null,
      extractionMethod: "Rule-based" as const
    }));
}

export async function extractPromisesWithAI(documentText: string): Promise<ExtractedPromiseInput[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return extractPromisesRuleBased(documentText);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? "gpt-4.1-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Extract B2B SaaS customer promises. Return JSON {\"promises\": []}. Each item must include promiseText, normalizedClaim, sourceLocation, category, confidenceScore, dueDate, extractedOwner, extractionMethod."
          },
          { role: "user", content: documentText }
        ]
      })
    });
    if (!response.ok) throw new Error(`AI extraction failed: ${response.status}`);
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = JSON.parse(payload.choices?.[0]?.message?.content ?? "{\"promises\":[]}") as { promises?: unknown[] };
    return (parsed.promises ?? [])
      .map((item) => extractedPromiseSchema.safeParse({ ...(item as object), extractionMethod: "AI" }))
      .filter((result) => result.success)
      .map((result) => result.data);
  } catch {
    return extractPromisesRuleBased(documentText);
  }
}

export function validateExtractedPromiseJson(data: unknown) {
  return extractedPromiseSchema.parse(data);
}
