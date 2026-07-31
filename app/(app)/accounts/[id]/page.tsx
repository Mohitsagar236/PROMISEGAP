import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, MetricCard, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { generateCustomerRiskReport } from "@/lib/business/reports";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const account = await prisma.account.findFirst({
    where: { id, organizationId: user.organizationId },
    include: { promises: { include: { matches: { include: { capability: true } } } }, actionItems: true, documents: true }
  });
  if (!account) notFound();
  const report = generateCustomerRiskReport(account, account.promises);
  const unsupported = account.promises.filter((promise) => promise.matches.some((match) => match.gapType !== "Fully supported")).length;
  const high = account.promises.filter((promise) => ["High", "Critical"].includes(promise.riskLevel)).length;

  return (
    <>
      <PageHeader title={account.name} eyebrow="Customer risk page" description={`${account.segment} account in ${account.region}. ${account.dealStage}.`} />
      <div className="grid grid-4">
        <MetricCard label="ARR" value={formatCurrency(account.arr)} />
        <MetricCard label="Total promises" value={account.promises.length} />
        <MetricCard label="Unsupported or partial" value={unsupported} />
        <MetricCard label="High-risk promises" value={high} />
      </div>
      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <div className="card">
          <h2>Account details</h2>
          <p>Account owner: {account.accountOwner}</p>
          <p>CS owner: {account.customerSuccessOwner}</p>
          <p>Onboarding: {formatDate(account.onboardingDeadline)}</p>
          <p>Renewal: {formatDate(account.renewalDeadline)}</p>
          <p>Open action items: {account.actionItems.filter((item) => item.status !== "Done").length}</p>
        </div>
        <div className="card">
          <h2>Recommended next actions</h2>
          <p>Review unsupported promises, assign owners, confirm capability evidence, and send customer-safe clarification before onboarding.</p>
          <pre style={{ whiteSpace: "pre-wrap" }}>{report}</pre>
        </div>
      </div>
      <table className="table" style={{ marginTop: 18 }}>
        <thead><tr><th>Promise</th><th>Category</th><th>Status</th><th>Risk</th></tr></thead>
        <tbody>
          {account.promises.map((promise) => (
            <tr key={promise.id}>
              <td><Link href={`/promises/${promise.id}`}>{promise.normalizedClaim}</Link></td>
              <td>{promise.category}</td>
              <td><Badge>{promise.status}</Badge></td>
              <td><Badge tone={promise.riskLevel}>{promise.riskLevel} {promise.riskScore}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
