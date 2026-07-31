import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function CapabilityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const capability = await prisma.capability.findFirst({
    where: { id, organizationId: user.organizationId },
    include: { matches: { include: { promise: { include: { account: true } } } } }
  });
  if (!capability) notFound();
  const customers = new Set(capability.matches.map((match) => match.promise.account.name));
  return (
    <>
      <PageHeader title={capability.name} eyebrow="Capability detail" description={capability.description} />
      <div className="grid grid-3">
        <div className="card"><h3>Support</h3><p><Badge tone={capability.supportStatus}>{capability.supportStatus}</Badge></p><p>{capability.evidence}</p></div>
        <div className="card"><h3>Ownership</h3><p>Product: {capability.productOwner}</p><p>Engineering: {capability.engineeringOwner}</p><p>Verified: {formatDate(capability.lastVerifiedDate)}</p></div>
        <div className="card"><h3>Configuration</h3><p>Plans: {capability.supportedPlans}</p><p>{capability.requiredConfiguration || "No special configuration listed."}</p><p>{capability.thirdPartyDependency}</p></div>
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h2>Product gap summary</h2>
        <p>{capability.limitations || "No known limitations."}</p>
        <p>{customers.size} customers depend on this capability through matched promises.</p>
      </div>
      <table className="table" style={{ marginTop: 18 }}>
        <thead><tr><th>Matched promise</th><th>Customer</th><th>Gap</th><th>Risk</th></tr></thead>
        <tbody>
          {capability.matches.map((match) => (
            <tr key={match.id}>
              <td><Link href={`/promises/${match.promise.id}`}>{match.promise.normalizedClaim}</Link></td>
              <td>{match.promise.account.name}</td>
              <td><Badge>{match.gapType}</Badge></td>
              <td><Badge tone={match.promise.riskLevel}>{match.promise.riskLevel}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
