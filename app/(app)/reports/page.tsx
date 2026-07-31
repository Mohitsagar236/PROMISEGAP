import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { generateCapabilityGapReport, generateSalesProductAlignmentReport, generateUnsupportedPromiseReport } from "@/lib/business/reports";
import { prisma } from "@/lib/prisma";

export default async function ReportsPage() {
  const user = await requireUser();
  const [reports, promises, capabilities] = await Promise.all([
    prisma.report.findMany({ where: { organizationId: user.organizationId }, orderBy: { createdAt: "desc" } }),
    prisma.extractedPromise.findMany({ where: { organizationId: user.organizationId }, include: { account: true, matches: { include: { capability: true } } } }),
    prisma.capability.findMany({ where: { organizationId: user.organizationId }, include: { matches: { include: { promise: { include: { account: true } } } } } })
  ]);
  const generated = [
    ["Unsupported Promise Report", generateUnsupportedPromiseReport(promises)],
    ["Sales/Product Alignment Report", generateSalesProductAlignmentReport(promises)],
    ["Capability Gap Report", generateCapabilityGapReport(capabilities)]
  ];
  return (
    <>
      <PageHeader title="Reports" eyebrow="Decision packets" description="Generate executive summaries, unsupported promise reports, capability gaps, and Sales/Product alignment views." />
      <div className="grid grid-3">
        {generated.map(([title, content]) => (
          <div className="card" key={title}>
            <h2>{title}</h2>
            <pre style={{ whiteSpace: "pre-wrap", maxHeight: 280, overflow: "auto" }}>{content}</pre>
          </div>
        ))}
      </div>
      <h2 style={{ marginTop: 22 }}>Saved reports</h2>
      <table className="table" style={{ marginTop: 12 }}>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td><Link href={`/reports/${report.id}`}>{report.title}</Link></td>
              <td>{report.reportType}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
