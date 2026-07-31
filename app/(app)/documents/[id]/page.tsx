import Link from "next/link";
import { notFound } from "next/navigation";
import { extractDocumentPromisesAction } from "@/app/actions";
import { Badge, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const document = await prisma.document.findFirst({ where: { id, organizationId: user.organizationId }, include: { account: true, promises: true } });
  if (!document) notFound();
  return (
    <>
      <PageHeader title={document.title} eyebrow="Source document" description={`${document.documentType} for ${document.account.name}, uploaded ${formatDate(document.createdAt)}.`} />
      <div className="grid grid-2">
        <div className="card">
          <h2>Extraction</h2>
          <p><Badge>{document.extractionStatus}</Badge> {document.promises.length} promises extracted.</p>
          <form action={extractDocumentPromisesAction}>
            <input type="hidden" name="documentId" value={document.id} />
            <button className="button" type="submit">Run extraction</button>
          </form>
        </div>
        <div className="card">
          <h2>Raw text</h2>
          <p>{document.rawText}</p>
        </div>
      </div>
      <table className="table" style={{ marginTop: 18 }}>
        <thead><tr><th>Promise</th><th>Category</th><th>Risk</th><th>Review</th></tr></thead>
        <tbody>
          {document.promises.map((promise) => (
            <tr key={promise.id}>
              <td><Link href={`/promises/${promise.id}`}>{promise.normalizedClaim}</Link></td>
              <td>{promise.category}</td>
              <td><Badge tone={promise.riskLevel}>{promise.riskLevel}</Badge></td>
              <td>{promise.needsHumanReview ? "Needs review" : "Human reviewed"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
