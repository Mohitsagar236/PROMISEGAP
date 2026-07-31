import Link from "next/link";
import { Badge, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function DocumentsPage() {
  const user = await requireUser();
  const documents = await prisma.document.findMany({ where: { organizationId: user.organizationId }, include: { account: true, promises: true }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader title="Documents" eyebrow="Ingestion" description="Paste sales materials, SOWs, emails, notes, and transcripts for promise extraction." action={<Link className="button" href="/documents/new">New document</Link>} />
      <table className="table">
        <thead><tr><th>Title</th><th>Account</th><th>Type</th><th>Status</th><th>Promises</th><th>Uploaded</th></tr></thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id}>
              <td><Link href={`/documents/${document.id}`}>{document.title}</Link></td>
              <td>{document.account.name}</td>
              <td>{document.documentType}</td>
              <td><Badge>{document.extractionStatus}</Badge></td>
              <td>{document.promises.length}</td>
              <td>{formatDate(document.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
