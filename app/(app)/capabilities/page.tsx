import Link from "next/link";
import { createCapabilityAction } from "@/app/actions";
import { Badge, PageHeader } from "@/components/ui";
import { promiseCategories, supportStatuses } from "@/lib/constants";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function CapabilitiesPage() {
  const user = await requireUser();
  const capabilities = await prisma.capability.findMany({ where: { organizationId: user.organizationId }, include: { matches: true }, orderBy: { name: "asc" } });
  return (
    <>
      <PageHeader title="Capabilities" eyebrow="Verified catalogue" description="The product truth source used for explainable promise matching and gap detection." />
      <details className="card">
        <summary>Create capability</summary>
        <form className="form" action={createCapabilityAction} style={{ marginTop: 12 }}>
          <label>Name<input name="name" required /></label>
          <label>Description<textarea name="description" required /></label>
          <label>Category<select name="category">{promiseCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label>Support status<select name="supportStatus">{supportStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label>Evidence<textarea name="evidence" required /></label>
          <label>Documentation link<input name="documentationLink" type="url" /></label>
          <label>Product owner<input name="productOwner" required /></label>
          <label>Engineering owner<input name="engineeringOwner" required /></label>
          <label>Release version<input name="releaseVersion" /></label>
          <label>Limitations<input name="limitations" /></label>
          <label>Supported plans<input name="supportedPlans" required /></label>
          <label>Required configuration<input name="requiredConfiguration" /></label>
          <label>Third-party dependency<input name="thirdPartyDependency" /></label>
          <label>Internal notes<input name="internalNotes" /></label>
          <button className="button" type="submit">Create capability</button>
        </form>
      </details>
      <table className="table" style={{ marginTop: 18 }}>
        <thead><tr><th>Capability</th><th>Category</th><th>Status</th><th>Promises</th><th>Verified</th></tr></thead>
        <tbody>
          {capabilities.map((capability) => (
            <tr key={capability.id}>
              <td><Link href={`/capabilities/${capability.id}`}>{capability.name}</Link></td>
              <td>{capability.category}</td>
              <td><Badge tone={capability.supportStatus}>{capability.supportStatus}</Badge></td>
              <td>{capability.matches.length}</td>
              <td>{formatDate(capability.lastVerifiedDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
