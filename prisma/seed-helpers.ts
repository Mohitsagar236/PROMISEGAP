import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/password";
import { extractPromisesRuleBased } from "@/lib/business/extraction";
import { matchPromiseToCapabilities } from "@/lib/business/matching";
import { calculateAccountRiskScore, calculatePromiseRiskScore, defaultRiskSettings } from "@/lib/business/risk";

const prisma = new PrismaClient();

const accountNames = [
  "Acme Pharma",
  "NovaHealth Labs",
  "Meridian BioSystems",
  "BluePeak Analytics",
  "OrbitCloud",
  "HelioWorks",
  "Redwood Finance",
  "Apex Manufacturing"
];

const capabilities = [
  ["OIDC SSO login", "OIDC authentication for enterprise identity providers.", "SSO/identity", "Supported", "OIDC login is generally available for Business and Enterprise plans."],
  ["SAML SSO login", "SAML 2.0 login with IdP metadata configuration.", "SSO/identity", "Supported", "SAML SSO is verified in production for enterprise tenants."],
  ["Entra ID user attribute sync", "SCIM and claims-based user attribute sync from Entra ID.", "SSO/identity", "Partially supported", "Basic attributes sync, but advanced mappings require Product review."],
  ["Public profile image claim", "Profile image URL claims can be displayed when public.", "SSO/identity", "Supported", "Public profile image claim rendering is supported."],
  ["Protected Microsoft Graph profile photo sync", "Retrieve protected profile photos from Microsoft Graph.", "SSO/identity", "Planned", "Protected Graph photo retrieval is in roadmap discovery and not fully released."],
  ["Role-based access control", "Workspace role management and permission groups.", "Permissions/RBAC", "Supported", "Admin, editor, contributor, and viewer roles are live."],
  ["Audit event enrichment", "Admin and security audit event exports.", "Security", "Partially supported", "Core admin events export, but every admin action is not yet included."],
  ["Workflow generation", "Automatically generate workflows from a natural-language brief.", "Workflow automation", "Partially supported", "Workflow suggestions exist, but human approval is required before activation."],
  ["PDF export", "Export dashboards and reports to PDF.", "Reporting", "Supported", "PDF report export is supported for standard reports."],
  ["Bulk CSV import", "Import users, accounts, and catalogue entries through CSV.", "Data import/export", "Supported", "Bulk CSV import is live for admin users."],
  ["Product analytics dashboard", "Analytics dashboard with usage, adoption, and trend views.", "Analytics", "Supported", "Standard analytics dashboards are available."],
  ["Admin reporting", "Admin reports with account and user activity.", "Admin controls", "Partially supported", "Admin reports cover primary activity, not all custom fields."],
  ["REST API access", "REST API for enterprise integration.", "Integration", "Supported", "REST API is available for Enterprise plans."],
  ["Data residency controls", "Regional data storage options.", "Compliance", "Depends on configuration", "EU data residency is available only for designated enterprise tenants."],
  ["SOC2 report availability", "SOC2 Type II report access under NDA.", "Compliance", "Supported", "SOC2 Type II report can be shared through the trust portal."],
  ["Custom branding", "Custom logo, colors, and customer-facing workspace branding.", "Admin controls", "Supported", "Custom branding is supported on Growth and Enterprise plans."],
  ["Webhook delivery", "Outbound webhook events for workflow and account changes.", "Integration", "Partially supported", "Webhook delivery supports key workflow events with retries."],
  ["Slack integration", "Post alerts and workflow events into Slack.", "Integration", "Supported", "Slack app is generally available."],
  ["Salesforce integration", "Sync accounts, opportunities, and notes with Salesforce.", "Integration", "Custom only", "Salesforce integration requires implementation services."],
  ["Advanced permissions", "Attribute- and department-level permissions.", "Permissions/RBAC", "Planned", "Department-level permission policies are planned."],
  ["AI document summarization", "Summarize customer documents with AI.", "AI feature", "Supported", "AI summaries are available with human review flags."],
  ["Custom implementation services", "Professional services for bespoke customer work.", "Custom implementation", "Custom only", "Scoped SOW is required for custom implementation."],
  ["Enterprise SLA", "Enterprise uptime and support response commitments.", "Performance/SLA", "Partially supported", "99.9% uptime is supported; custom response windows require contract review."],
  ["Migration onboarding", "Guided data migration and onboarding plans.", "Migration/onboarding", "Supported", "Customer Success provides guided onboarding for Enterprise."],
  ["Usage-based billing", "Billing and pricing support for usage tiers.", "Billing/pricing", "Not supported", "Usage-based billing is not currently available."]
] as const;

const promiseExamples = [
  "Employee profile photos will automatically sync from Entra ID, including protected Microsoft Graph photos.",
  "The system supports SAML and OIDC SSO.",
  "Every admin action will be included in audit exports.",
  "The dashboard can show department-level analytics.",
  "Customers can export reports as PDF.",
  "The platform supports SOC2 requirements.",
  "Data can be stored in the EU region.",
  "Custom workflows can be generated automatically using AI.",
  "Salesforce integration is available out of the box.",
  "Role-based access can be configured per department.",
  "API access is included for all enterprise customers.",
  "Slack integration will notify customer success teams when onboarding tasks are blocked.",
  "Bulk CSV import can migrate all legacy contacts before go-live within 30 days.",
  "Custom branding is included for the customer portal.",
  "Webhook delivery supports all account and workflow events.",
  "Enterprise SLA response times will be available for this account.",
  "The team will provide custom implementation services for the compliance workflow.",
  "Usage-based billing can be enabled next quarter.",
  "AI document summarization will identify onboarding risks automatically.",
  "Admin reporting includes user activity and configuration changes."
];

const documentTypes = ["Sales-call transcript", "Proposal", "Statement of Work", "Demo notes", "Customer email", "Onboarding notes", "Renewal notes"];

export async function seedDemoData(reset = false) {
  if (reset) {
    await prisma.importError.deleteMany();
    await prisma.importBatch.deleteMany();
    await prisma.report.deleteMany();
    await prisma.promiseTimelineEvent.deleteMany();
    await prisma.promiseActionItem.deleteMany();
    await prisma.promiseComment.deleteMany();
    await prisma.promiseRiskScore.deleteMany();
    await prisma.promiseCapabilityMatch.deleteMany();
    await prisma.extractedPromise.deleteMany();
    await prisma.document.deleteMany();
    await prisma.capability.deleteMany();
    await prisma.account.deleteMany();
    await prisma.riskSetting.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
  }

  const existing = await prisma.user.findUnique({ where: { email: "admin@promisegap.demo" } });
  if (existing && !reset) return;

  const organization = await prisma.organization.create({
    data: {
      name: "PromiseGap Demo Workspace",
      riskSetting: { create: defaultRiskSettings }
    }
  });
  const passwordHash = await hashPassword("PromiseGap123!");
  const users = await Promise.all(
    [
      ["Avery Admin", "admin@promisegap.demo", "Admin"],
      ["Priya Product", "pm@promisegap.demo", "Product Manager"],
      ["Sam Sales", "sales@promisegap.demo", "Sales"],
      ["Casey Success", "cs@promisegap.demo", "Customer Success"]
    ].map(([name, email, role]) =>
      prisma.user.create({
        data: { name, email, role, passwordHash, organizationId: organization.id }
      })
    )
  );

  const createdCapabilities = await Promise.all(
    capabilities.map(([name, description, category, supportStatus, evidence], index) =>
      prisma.capability.create({
        data: {
          organizationId: organization.id,
          name,
          description,
          category,
          supportStatus,
          evidence,
          documentationLink: `https://docs.example.com/${index + 1}`,
          productOwner: "Priya Product",
          engineeringOwner: index % 2 ? "Riley Engineering" : "Jordan Platform",
          releaseVersion: index % 3 === 0 ? "2026.7" : "2026.4",
          limitations: supportStatus === "Supported" ? "" : "Requires customer-safe qualification before commitment.",
          supportedPlans: index % 2 ? "Enterprise" : "Business, Enterprise",
          requiredConfiguration: supportStatus === "Depends on configuration" ? "Regional tenant provisioning" : "",
          thirdPartyDependency: /Microsoft|Salesforce|Slack|OIDC|SAML|Entra/.test(name) ? "Third-party provider configuration" : "",
          lastVerifiedDate: new Date("2026-07-15"),
          internalNotes: "Synthetic demo catalogue evidence."
        }
      })
    )
  );

  const today = new Date();
  const accounts = await Promise.all(
    accountNames.map((name, index) => {
      const onboarding = new Date(today);
      onboarding.setDate(today.getDate() + 14 + index * 8);
      const renewal = new Date(today);
      renewal.setMonth(today.getMonth() + 8 + index);
      return prisma.account.create({
        data: {
          organizationId: organization.id,
          name,
          segment: index < 3 ? "Enterprise" : index < 6 ? "Mid-market" : "Commercial",
          region: ["North America", "EU", "APAC"][index % 3],
          arr: 75000 + index * 42000,
          dealStage: ["Proposal", "Contract review", "Implementation", "Renewal"][index % 4],
          accountOwner: "Sam Sales",
          customerSuccessOwner: "Casey Success",
          onboardingDeadline: onboarding,
          renewalDeadline: renewal
        }
      });
    })
  );

  const allPromises = [];
  for (let i = 0; i < 20; i += 1) {
    const account = accounts[i % accounts.length];
    const selected = promiseExamples.slice(i % 6, (i % 6) + 4).concat(promiseExamples[(i + 9) % promiseExamples.length]);
    const rawText = `Customer ${account.name} discussion. ${selected.join(" ")} Product review is required before final confirmation.`;
    const document = await prisma.document.create({
      data: {
        organizationId: organization.id,
        accountId: account.id,
        title: `${account.name} ${documentTypes[i % documentTypes.length]} ${i + 1}`,
        documentType: documentTypes[i % documentTypes.length],
        rawText,
        sourceOwner: i % 2 ? "Sam Sales" : "Casey Success",
        dealStage: account.dealStage,
        extractionStatus: "Complete",
        notes: "Synthetic demo document.",
        uploadedById: users[i % users.length].id
      }
    });
    const extracted = extractPromisesRuleBased(rawText);
    for (const item of extracted.slice(0, i < 15 ? 4 : 3)) {
      const match = matchPromiseToCapabilities(item, createdCapabilities);
      const risk = calculatePromiseRiskScore(
        { ...item, dueDate: item.dueDate, documentType: document.documentType, assignedOwnerId: i % 3 === 0 ? null : users[1].id },
        account,
        { gapType: match.gapType, matchConfidence: match.matchConfidence, capability: match.capability },
        defaultRiskSettings,
        i % 4
      );
      const promise = await prisma.extractedPromise.create({
        data: {
          organizationId: organization.id,
          accountId: account.id,
          documentId: document.id,
          promiseText: item.promiseText,
          normalizedClaim: item.normalizedClaim,
          sourceLocation: item.sourceLocation,
          category: item.category,
          confidenceScore: item.confidenceScore,
          dueDate: item.dueDate ? new Date(item.dueDate) : null,
          extractedOwner: item.extractedOwner,
          assignedOwnerId: i % 3 === 0 ? null : users[1].id,
          extractionMethod: "Rule-based",
          needsHumanReview: match.requiresHumanReview,
          status: match.gapType === "Fully supported" ? "Matched" : i % 2 ? "Product review needed" : "Gap detected",
          riskLevel: risk.riskLevel,
          riskScore: risk.numericScore,
          riskExplanation: risk.explanation
        }
      });
      allPromises.push(promise);
      if (match.capability?.id && allPromises.length <= 65) {
        await prisma.promiseCapabilityMatch.create({
          data: {
            promiseId: promise.id,
            capabilityId: match.capability.id,
            matchConfidence: match.matchConfidence,
            supportStatus: match.supportStatus,
            gapType: match.gapType,
            explanation: match.explanation,
            evidence: match.evidence,
            requiresHumanReview: match.requiresHumanReview
          }
        });
      }
      await prisma.promiseRiskScore.create({
        data: {
          promiseId: promise.id,
          numericScore: risk.numericScore,
          riskLevel: risk.riskLevel,
          factors: JSON.stringify(risk.factors),
          explanation: risk.explanation
        }
      });
      if (["High", "Critical"].includes(risk.riskLevel) && allPromises.length <= 25) {
        await prisma.promiseActionItem.create({
          data: {
            organizationId: organization.id,
            promiseId: promise.id,
            accountId: account.id,
            title: `Resolve ${item.category} promise gap`,
            description: "Confirm product evidence, customer-safe wording, owner, and next action.",
            ownerId: users[1].id,
            dueDate: account.onboardingDeadline,
            priority: risk.riskLevel,
            status: allPromises.length % 3 === 0 ? "In progress" : "Open",
            createdById: users[0].id
          }
        });
      }
      await prisma.promiseTimelineEvent.create({
        data: {
          promiseId: promise.id,
          eventType: "Extracted",
          actorId: users[0].id,
          description: "Promise extracted from synthetic demo document with rule-based fallback."
        }
      });
    }
  }

  for (const account of accounts) {
    const promises = await prisma.extractedPromise.findMany({ where: { accountId: account.id } });
    const risk = calculateAccountRiskScore(account, promises);
    await prisma.account.update({ where: { id: account.id }, data: { riskScore: risk.score } });
  }

  await prisma.report.create({
    data: {
      organizationId: organization.id,
      reportType: "Executive Summary Report",
      title: "Demo Executive Summary",
      markdownContent: "# Executive Summary\n\nPromiseGap found high-risk commitments around identity, compliance, analytics, and integrations. Human review is required before customer confirmation.",
      createdById: users[0].id
    }
  });

  return { organization, users, accounts, capabilities: createdCapabilities, promises: allPromises };
}
