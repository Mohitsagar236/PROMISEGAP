import Link from "next/link";
import { Badge, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AccountsPage({ searchParams }: { searchParams?: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const q = params.q ?? "";
  const risk = params.risk ?? "";
  const accounts = await prisma.account.findMany({
    where: {
      organizationId: user.organizationId,
      name: q ? { contains: q } : undefined,
      riskScore: risk === "High" ? { gte: 60 } : risk === "Medium" ? { gte: 35, lt: 60 } : undefined
    },
    include: { promises: true, actionItems: true },
    orderBy: { riskScore: "desc" }
  });

  return (
    <>
      <PageHeader title="Accounts" eyebrow="Customer risk" description="Search, filter, and sort customers by promise risk, deal stage, ARR, and onboarding deadline." />
      <form className="card form" style={{ gridTemplateColumns: "2fr 1fr auto", alignItems: "end" }}>
        <label>Search<input name="q" defaultValue={q} placeholder="Acme Pharma" /></label>
        <label>Risk<select name="risk" defaultValue={risk}><option value="">All</option><option>High</option><option>Medium</option></select></label>
        <button className="button secondary">Filter</button>
      </form>
      <table className="table" style={{ marginTop: 18 }}>
        <thead><tr><th>Account</th><th>Segment</th><th>ARR</th><th>Deal stage</th><th>Onboarding</th><th>Promises</th><th>Risk</th></tr></thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id}>
              <td><Link href={`/accounts/${account.id}`}>{account.name}</Link></td>
              <td>{account.segment}</td>
              <td>{formatCurrency(account.arr)}</td>
              <td>{account.dealStage}</td>
              <td>{formatDate(account.onboardingDeadline)}</td>
              <td>{account.promises.length}</td>
              <td><Badge tone={account.riskScore >= 60 ? "High" : account.riskScore >= 35 ? "Medium" : "Low"}>{account.riskScore}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
