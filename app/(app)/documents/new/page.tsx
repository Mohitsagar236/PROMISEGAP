import { createDocumentAction } from "@/app/actions";
import { PageHeader } from "@/components/ui";
import { documentTypes } from "@/lib/constants";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const demoText =
  "Employee profile photos will automatically sync from Entra ID, including protected Microsoft Graph photos. The system supports SAML and OIDC SSO. Every admin action will be included in audit exports. Salesforce integration is available out of the box. Bulk CSV import can migrate all legacy contacts before go-live within 30 days.";

export default async function NewDocumentPage() {
  const user = await requireUser();
  const accounts = await prisma.account.findMany({ where: { organizationId: user.organizationId }, orderBy: { name: "asc" } });
  return (
    <>
      <PageHeader title="New document" eyebrow="Paste or upload text" description=".txt and .md content can be pasted directly. PDF parsing is documented as a future extension." />
      <div className="card">
        <form className="form" action={createDocumentAction}>
          <label>Account<select name="accountId" required>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
          <label>Title<input name="title" defaultValue="Acme Pharma sales transcript" required /></label>
          <label>Document type<select name="documentType">{documentTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label>Source owner<input name="sourceOwner" defaultValue="Sam Sales" required /></label>
          <label>Deal stage<input name="dealStage" defaultValue="Proposal" required /></label>
          <label>Raw text<textarea name="rawText" defaultValue={demoText} required /></label>
          <label>Notes<input name="notes" placeholder="Optional context" /></label>
          <button className="button" type="submit">Save document</button>
        </form>
      </div>
    </>
  );
}
