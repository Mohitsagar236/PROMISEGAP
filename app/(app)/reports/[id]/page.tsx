import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const report = await prisma.report.findFirst({ where: { id, organizationId: user.organizationId } });
  if (!report) notFound();
  return (
    <>
      <PageHeader title={report.title} eyebrow={report.reportType} description="Markdown report suitable for stakeholder review, customer-risk discussion, or portfolio demo." />
      <div className="card">
        <button className="button secondary" type="button">Copy report</button>
        <pre style={{ whiteSpace: "pre-wrap" }}>{report.markdownContent}</pre>
      </div>
    </>
  );
}
