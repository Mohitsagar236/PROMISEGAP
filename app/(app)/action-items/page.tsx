import Link from "next/link";
import { Badge, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function ActionItemsPage() {
  const user = await requireUser();
  const items = await prisma.promiseActionItem.findMany({
    where: { organizationId: user.organizationId },
    include: { account: true, promise: true, owner: true, createdBy: true },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }]
  });
  return (
    <>
      <PageHeader title="Action items" eyebrow="Ownership" description="Every high-risk promise should have an owner, due date, status, next action, and visible accountability." />
      <table className="table">
        <thead><tr><th>Action</th><th>Account</th><th>Promise</th><th>Owner</th><th>Priority</th><th>Status</th><th>Due</th></tr></thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.title}<br /><small>{item.description}</small></td>
              <td><Link href={`/accounts/${item.accountId}`}>{item.account.name}</Link></td>
              <td>{item.promise ? <Link href={`/promises/${item.promise.id}`}>{item.promise.normalizedClaim}</Link> : "Account-level"}</td>
              <td>{item.owner?.name ?? "Unassigned"}</td>
              <td><Badge tone={item.priority}>{item.priority}</Badge></td>
              <td><Badge>{item.status}</Badge></td>
              <td>{formatDate(item.dueDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
