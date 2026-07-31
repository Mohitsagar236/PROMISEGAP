export const promiseCategories = [
  "Integration",
  "Security",
  "Compliance",
  "Analytics",
  "Reporting",
  "Workflow automation",
  "Data import/export",
  "SSO/identity",
  "Permissions/RBAC",
  "AI feature",
  "Performance/SLA",
  "Custom implementation",
  "Support/service",
  "Migration/onboarding",
  "Billing/pricing",
  "Admin controls",
  "Other"
] as const;

export const workflowStatuses = [
  "Extracted",
  "Needs review",
  "Matched",
  "Gap detected",
  "Sales clarification needed",
  "Product review needed",
  "Engineering estimate needed",
  "Approved",
  "Rejected",
  "Customer clarification sent",
  "Resolved",
  "Archived"
] as const;

export const documentTypes = [
  "Sales-call transcript",
  "Proposal",
  "Statement of Work",
  "Demo notes",
  "Customer email",
  "Onboarding notes",
  "Marketing copy",
  "Product documentation excerpt",
  "Support conversation",
  "Renewal notes"
] as const;

export const supportStatuses = [
  "Supported",
  "Partially supported",
  "Planned",
  "Not supported",
  "Deprecated",
  "Custom only",
  "Depends on configuration"
] as const;

export const gapTypes = [
  "Fully supported",
  "Partially supported",
  "Unsupported",
  "Planned but not live",
  "Requires custom work",
  "Depends on configuration",
  "Ambiguous promise",
  "Conflicts with known limitation",
  "Needs product review"
] as const;

export const roleNames = ["Admin", "Product Manager", "Sales", "Customer Success", "Viewer"] as const;
