import Link from "next/link";
import { AlertTriangle, CheckCircle2, ClipboardCheck, FileWarning, Flag, Timer, UserRoundCheck, Users } from "lucide-react";
import { Badge, ChartRow, MetricCard, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const [promises, accounts, actionItems] = await Promise.all([
    prisma.extractedPromise.findMany({ where: { organizationId: user.organizationId }, include: { account: true, matches: { include: { capability: true } } }, orderBy: { riskScore: "desc" } }),
    prisma.account.findMany({ where: { organizationId: user.organizationId }, orderBy: { riskScore: "desc" } }),
    prisma.promiseActionItem.findMany({ where: { organizationId: user.organizationId, status: { not: "Done" } } })
  ]);
  const unsupported = promises.filter((promise) => promise.matches.some((match) => match.gapType === "Unsupported" || match.gapType === "Planned but not live")).length;
  const partial = promises.filter((promise) => promise.matches.some((match) => match.gapType === "Partially supported" || match.gapType === "Depends on configuration")).length;
  const highRisk = promises.filter((promise) => ["High", "Critical"].includes(promise.riskLevel)).length;
  const reviewed = promises.filter((promise) => !promise.needsHumanReview).length;
  const unowned = promises.filter((p) => !p.assignedOwnerId).length;
  const validationRate = Math.round((reviewed / Math.max(1, promises.length)) * 100);
  const statusCounts = Object.entries(
    promises.reduce<Record<string, number>>((acc, promise) => {
      acc[promise.status] = (acc[promise.status] ?? 0) + 1;
      return acc;
    }, {})
  );
  const maxStatus = Math.max(1, ...statusCounts.map(([, count]) => count));
  const riskCounts = ["Critical", "High", "Medium", "Low"].map((level) => ({
    level,
    count: promises.filter((promise) => promise.riskLevel === level).length
  }));
  const maxRisk = Math.max(1, ...riskCounts.map((item) => item.count));
  const categoryRows = ["SSO/identity", "Compliance", "Integration", "Permissions/RBAC", "Analytics"].map((category) => ({
    category,
    count: promises.filter((promise) => promise.category === category && promise.riskScore >= 35).length
  }));
  const maxCategory = Math.max(1, ...categoryRows.map((item) => item.count));

  return (
    <>
      <PageHeader
        eyebrow="Command center"
        title="Dashboard"
        description="Promise extraction, gap detection, risk scoring, and human review health across customer commitments."
        action={<Link className="button" href="/documents/new">Ingest document</Link>}
      />
      <div className="dashboard-hero">
        <div className="card insight-panel elevated">
          <div className="eyebrow">Today&apos;s control point</div>
          <h2>{highRisk} high-risk customer promises need evidence, owner alignment, or customer-safe clarification.</h2>
          <p>
            PromiseGap is currently tracking {promises.length} commitments across {accounts.length} accounts. Unsupported and partial promises are routed through human review before anyone treats them as contractual truth.
          </p>
          <div className="trust-strip">
            <span className="trust-chip">AI suggested</span>
            <span className="trust-chip">Human reviewed</span>
            <span className="trust-chip">Verified by Product</span>
            <span className="trust-chip">Requires Sales clarification</span>
            <span className="trust-chip">Requires Engineering estimate</span>
          </div>
        </div>
        <div className="card elevated">
          <div className="card-header">
            <div>
              <div className="eyebrow">Risk posture</div>
              <h2>Portfolio health</h2>
            </div>
            <div className="score-ring">{Math.min(99, highRisk + unsupported + partial)}</div>
          </div>
          <div className="risk-stack">
            <div className="row-meta"><Badge tone="High">{highRisk} high risk</Badge><span>{unowned} unowned promises</span></div>
            <div className="row-meta"><Badge tone="Medium">{partial} partial</Badge><span>{unsupported} unsupported or planned</span></div>
            <div className="row-meta"><Badge tone="Low">{validationRate}% reviewed</Badge><span>{actionItems.length} open action items</span></div>
          </div>
        </div>
      </div>
      <div className="grid grid-4">
        <MetricCard icon={ClipboardCheck} label="Total promises detected" value={promises.length} note="Across seeded and ingested documents" />
        <MetricCard icon={FileWarning} label="Unsupported promises" value={unsupported} note="Not supported, planned, or unresolved" />
        <MetricCard icon={AlertTriangle} label="Partially supported" value={partial} note="Needs scope clarification" />
        <MetricCard icon={Flag} label="High-risk gaps" value={highRisk} note="Owner and decision required" />
        <MetricCard icon={CheckCircle2} label="Awaiting product review" value={promises.filter((p) => p.status.includes("Product")).length} />
        <MetricCard icon={Timer} label="Awaiting sales clarification" value={promises.filter((p) => p.status.includes("Sales")).length} />
        <MetricCard icon={UserRoundCheck} label="Without owners" value={unowned} />
        <MetricCard icon={Users} label="Validation completion" value={`${validationRate}%`} />
      </div>

      <div className="grid grid-3" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="card-header">
            <h2>Promise status distribution</h2>
            <Badge>{statusCounts.length} states</Badge>
          </div>
          {statusCounts.map(([status, count]) => (
            <ChartRow key={status} label={status} value={count} max={maxStatus} />
          ))}
        </div>
        <div className="card">
          <div className="card-header">
            <h2>Risk level distribution</h2>
            <Badge tone="High">{highRisk} urgent</Badge>
          </div>
          {riskCounts.map(({ level, count }) => (
            <ChartRow key={level} label={level} value={count} max={maxRisk} />
          ))}
        </div>
        <div className="card">
          <div className="card-header">
            <h2>Capability areas with gaps</h2>
            <Badge>Top 5</Badge>
          </div>
          {categoryRows.map(({ category, count }) => (
            <ChartRow key={category} label={category} value={count} max={maxCategory} />
          ))}
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="card-header">
            <h2>Top high-risk promises</h2>
            <Link className="button secondary" href="/promises">View all</Link>
          </div>
          {promises.slice(0, 8).map((promise) => (
            <div className="list-row" key={promise.id}>
              <Link className="row-title" href={`/promises/${promise.id}`}>{promise.normalizedClaim}</Link>
              <div className="row-meta">
                <Badge tone={promise.riskLevel}>{promise.riskLevel} {promise.riskScore}</Badge>
                <span>{promise.account.name}</span>
                <span>{promise.category}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-header">
            <h2>Customers with highest risk</h2>
            <Link className="button secondary" href="/accounts">View accounts</Link>
          </div>
          {accounts.slice(0, 8).map((account) => (
            <div className="list-row" key={account.id}>
              <Link className="row-title" href={`/accounts/${account.id}`}>{account.name}</Link>
              <div className="row-meta">
                <Badge tone={account.riskScore >= 60 ? "High" : "Medium"}>Risk {account.riskScore}</Badge>
                <span>{formatCurrency(account.arr)}</span>
                <span>{account.dealStage}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-header">
          <h2>Promises needing human review</h2>
          <Badge tone="Medium">{promises.filter((promise) => promise.needsHumanReview).length} pending</Badge>
        </div>
        <p>AI suggested extraction and matching remains advisory until a human confirms evidence, scope, and customer-safe language.</p>
        <p>{promises.filter((promise) => promise.needsHumanReview).length} promises need review and {actionItems.length} open action items are tracking ownership.</p>
      </div>
    </>
  );
}
