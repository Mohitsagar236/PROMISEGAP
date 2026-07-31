import { PageHeader } from "@/components/ui";

const sections = [
  ["Problem statement", "B2B SaaS teams often discover after signature that a customer heard a promise the product cannot fully support."],
  ["Target users", "Product Managers, Technical PMs, Sales Engineers, Customer Success, Implementation Managers, Solution Architects, and founders."],
  ["Jobs-to-Be-Done", "When reviewing sales or onboarding materials, identify risky customer commitments so teams can clarify scope before trust is damaged."],
  ["Product hypothesis", "An explainable promise-to-capability workflow can reduce escalations by making unsupported commitments visible before onboarding."],
  ["MVP scope", "Authentication, workspace data, accounts, documents, extraction, matching, risk scoring, human review, action ownership, reporting, and settings."],
  ["Non-goals", "PromiseGap is not a CRM, generic chatbot, or meeting summarizer. It focuses on commitment risk and product evidence."],
  ["Metrics", "North star: high-risk promise gaps resolved before onboarding or contract finalization. Supporting metrics include validation completion, unsupported promises detected, and match acceptance."],
  ["Prioritization", "The MVP prioritizes risk detection, explainability, and owner assignment over broad CRM workflows or perfect AI automation."],
  ["Human-in-the-loop principle", "AI only suggests extraction and matching. Humans confirm evidence, status, owners, and customer-safe next steps."],
  ["AI trust decisions", "Rule-based extraction works without a paid API. Optional AI output is validated with Zod and falls back safely."],
  ["Risk model", "Unsupported capability, partial support, enterprise segment, commercial source, near deadline, missing owner, deal value, and low confidence contribute to a transparent 0-100 score."],
  ["Trade-offs", "The MVP uses explainable keyword matching instead of opaque semantic matching so reviewers can understand why a promise was flagged."],
  ["Roadmap", "Add semantic embeddings, document OCR/PDF parsing, CRM ingestion, Slack/Teams routing, approval policies, and product roadmap conversion."],
  ["Go-to-market", "Sell to B2B SaaS companies with enterprise onboarding pain, starting with Product/Sales alignment and implementation-risk teams."],
  ["Pricing", "Team tier for promise review, Business tier with integrations, Enterprise tier with governance, audit logs, and custom risk policies."],
  ["Resume positioning", "Designed and built PromiseGap, a human-in-the-loop B2B SaaS product that extracts customer promises from sales materials, maps them to verified product capabilities, and flags unsupported commitments before onboarding or contract finalization."]
];

export default function CaseStudyPage() {
  return (
    <>
      <PageHeader title="PromiseGap case study" eyebrow="Product portfolio" description="A Technical PM case study demonstrating enterprise SaaS thinking, AI judgment, human review, risk management, and cross-functional execution." />
      <div className="grid grid-2">
        {sections.map(([title, body]) => (
          <section className="card" key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </section>
        ))}
      </div>
    </>
  );
}
