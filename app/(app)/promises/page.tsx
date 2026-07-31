import Link from "next/link";
import { Badge, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function PromisesPage({ searchParams }: { searchParams?: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const q = params.q ?? "";
  const promises = await prisma.extractedPromise.findMany({
    where: {
      organizationId: user.organizationId,
      OR: q ? [{ promiseText: { contains: q } }, { normalizedClaim: { contains: q } }, { category: { contains: q } }] : undefined
    },
    include: { account: true, assignedOwner: true, matches: { include: { capability: true } } },
    orderBy: [{ riskScore: "desc" }, { createdAt: "desc" }]
  });
  return (
    <>
      <PageHeader title="Promises" eyebrow="Review workflow" description="Track extracted customer promises, capability matches, gap types, risk scores, owners, and human review status." />
      <form className="card form" style={{ gridTemplateColumns: "1fr auto", alignItems: "end" }}>
        <label>Search<input name="q" defaultValue={q} placeholder="SSO, Salesforce, SOC2" /></label>
        <button className="button secondary">Search</button>
      </form>
      <table className="table" style={{ marginTop: 18 }}>
        <thead><tr><th>Promise</th><th>Account</th><th>Gap</th><th>Risk</th><th>Owner</th><th>Due</th></tr></thead>
        <tbody>
          {promises.map((promise) => (
            <tr key={promise.id}>
              <td><Link href={`/promises/${promise.id}`}>{promise.normalizedClaim}</Link><br /><small>{promise.category}</small></td>
              <td>{promise.account.name}</td>
              <td><Badge>{promise.matches[0]?.gapType ?? "Needs product review"}</Badge></td>
              <td><Badge tone={promise.riskLevel}>{promise.riskLevel} {promise.riskScore}</Badge></td>
              <td>{promise.assignedOwner?.name ?? "Unowned"}</td>
              <td>{formatDate(promise.dueDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
