import { reloadDemoDataAction, updateRiskSettingsAction } from "@/app/actions";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { defaultRiskSettings } from "@/lib/business/risk";
import { prisma } from "@/lib/prisma";

const labels: Record<string, string> = {
  unsupportedCapabilityWeight: "Unsupported capability",
  partialSupportWeight: "Partial support",
  enterpriseCustomerWeight: "Enterprise customer",
  contractSourceWeight: "Contract/SOW/proposal source",
  dueDateProximityWeight: "Deadline within 30 days",
  missingOwnerWeight: "Missing owner",
  dealValueWeight: "High-value deal",
  complianceSecurityWeight: "Compliance/security/identity",
  lowConfidenceWeight: "Low confidence",
  repeatedPromiseWeight: "Repeated promise"
};

export default async function SettingsPage() {
  const user = await requireUser();
  const settings = (await prisma.riskSetting.findUnique({ where: { organizationId: user.organizationId } })) ?? defaultRiskSettings;
  return (
    <>
      <PageHeader title="Settings" eyebrow="Admin" description="Configure organization profile, risk weights, category ownership, demo data, and AI extraction behavior." />
      <div className="grid grid-2">
        <div className="card">
          <h2>Risk weights</h2>
          <form className="form" action={updateRiskSettingsAction}>
            {Object.entries(labels).map(([key, label]) => (
              <label key={key}>
                {label}
                <input name={key} type="number" min="0" max="50" defaultValue={Number(settings[key as keyof typeof settings])} />
              </label>
            ))}
            <button className="button" type="submit">Save risk settings</button>
          </form>
        </div>
        <div className="card">
          <h2>AI extraction settings</h2>
          <p>AI extraction enabled when OPENAI_API_KEY is present. Current status: {process.env.OPENAI_API_KEY ? "API key configured" : "No API key; deterministic rule-based extraction is active."}</p>
          <p>Model: {process.env.AI_MODEL ?? "gpt-4.1-mini"}</p>
          <p>Fallback behavior: AI failures automatically return rule-based extraction. AI suggestions require human review before customer decisions.</p>
          <form action={reloadDemoDataAction}>
            <button className="button secondary" type="submit">Reload demo data</button>
          </form>
        </div>
      </div>
    </>
  );
}
