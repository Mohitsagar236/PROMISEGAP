"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, clearSession, currentUser, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { extractPromisesWithAI } from "@/lib/business/extraction";
import { matchPromiseToCapabilities } from "@/lib/business/matching";
import { calculateAccountRiskScore, calculatePromiseRiskScore, defaultRiskSettings } from "@/lib/business/risk";
import { validateWorkflowTransition } from "@/lib/business/workflow";
import { prisma } from "@/lib/prisma";
import { capabilityInputSchema, documentInputSchema } from "@/lib/validators";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function signupAction(formData: FormData) {
  const name = getString(formData, "name");
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");
  if (!name || !email || password.length < 8) throw new Error("Name, valid email, and 8 character password are required.");

  const orgName = getString(formData, "organization") || `${name}'s Workspace`;
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "Admin",
      organization: {
        create: {
          name: orgName,
          riskSetting: { create: defaultRiskSettings }
        }
      }
    }
  });
  await createSession(user.id);
  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) throw new Error("Invalid email or password.");
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function createDocumentAction(formData: FormData) {
  const user = await requireUser();
  const parsed = documentInputSchema.parse({
    accountId: getString(formData, "accountId"),
    title: getString(formData, "title"),
    documentType: getString(formData, "documentType"),
    rawText: getString(formData, "rawText"),
    sourceOwner: getString(formData, "sourceOwner"),
    dealStage: getString(formData, "dealStage"),
    notes: getString(formData, "notes")
  });
  const document = await prisma.document.create({
    data: {
      ...parsed,
      organizationId: user.organizationId,
      uploadedById: user.id,
      extractionStatus: "Pending"
    }
  });
  redirect(`/documents/${document.id}`);
}

export async function extractDocumentPromisesAction(formData: FormData) {
  const user = await requireUser();
  const documentId = getString(formData, "documentId");
  const document = await prisma.document.findFirst({ where: { id: documentId, organizationId: user.organizationId }, include: { account: true } });
  if (!document) throw new Error("Document not found.");

  const capabilities = await prisma.capability.findMany({ where: { organizationId: user.organizationId } });
  const settings = (await prisma.riskSetting.findUnique({ where: { organizationId: user.organizationId } })) ?? defaultRiskSettings;
  const extracted = await extractPromisesWithAI(document.rawText);

  await prisma.$transaction(async (tx) => {
    await tx.document.update({ where: { id: document.id }, data: { extractionStatus: "Extracting" } });
    for (const item of extracted) {
      const match = matchPromiseToCapabilities(item, capabilities);
      const risk = calculatePromiseRiskScore(
        { ...item, dueDate: item.dueDate, documentType: document.documentType },
        document.account,
        { gapType: match.gapType, matchConfidence: match.matchConfidence, capability: match.capability },
        settings
      );
      const promise = await tx.extractedPromise.create({
        data: {
          organizationId: user.organizationId,
          accountId: document.accountId,
          documentId: document.id,
          promiseText: item.promiseText,
          normalizedClaim: item.normalizedClaim,
          sourceLocation: item.sourceLocation,
          category: item.category,
          confidenceScore: item.confidenceScore,
          dueDate: item.dueDate ? new Date(item.dueDate) : null,
          extractedOwner: item.extractedOwner,
          extractionMethod: item.extractionMethod,
          needsHumanReview: match.requiresHumanReview,
          status: match.gapType === "Fully supported" ? "Matched" : "Gap detected",
          riskLevel: risk.riskLevel,
          riskScore: risk.numericScore,
          riskExplanation: risk.explanation
        }
      });
      if (match.capability?.id) {
        await tx.promiseCapabilityMatch.create({
          data: {
            promiseId: promise.id,
            capabilityId: match.capability.id,
            matchConfidence: match.matchConfidence,
            supportStatus: match.supportStatus,
            gapType: match.gapType,
            explanation: match.explanation,
            evidence: match.evidence,
            requiresHumanReview: match.requiresHumanReview
          }
        });
      }
      await tx.promiseRiskScore.create({
        data: {
          promiseId: promise.id,
          numericScore: risk.numericScore,
          riskLevel: risk.riskLevel,
          factors: JSON.stringify(risk.factors),
          explanation: risk.explanation
        }
      });
    }
    await tx.document.update({ where: { id: document.id }, data: { extractionStatus: "Complete" } });
  });

  await updateAccountRisk(document.accountId);
  revalidatePath(`/documents/${document.id}`);
  redirect(`/documents/${document.id}`);
}

async function updateAccountRisk(accountId: string) {
  const account = await prisma.account.findUnique({ where: { id: accountId }, include: { promises: true } });
  if (!account) return;
  const risk = calculateAccountRiskScore(account, account.promises);
  await prisma.account.update({ where: { id: accountId }, data: { riskScore: risk.score } });
}

export async function updatePromiseAction(formData: FormData) {
  const user = await requireUser();
  const id = getString(formData, "promiseId");
  const nextStatus = getString(formData, "status");
  const promise = await prisma.extractedPromise.findFirst({ where: { id, organizationId: user.organizationId } });
  if (!promise) throw new Error("Promise not found.");
  if (nextStatus && nextStatus !== promise.status && !validateWorkflowTransition(promise.status, nextStatus)) {
    throw new Error(`Invalid workflow transition from ${promise.status} to ${nextStatus}.`);
  }
  await prisma.extractedPromise.update({
    where: { id },
    data: {
      status: nextStatus || promise.status,
      assignedOwnerId: getString(formData, "assignedOwnerId") || null,
      needsHumanReview: formData.get("needsHumanReview") !== "off",
      humanReviewedAt: formData.get("humanReviewed") ? new Date() : promise.humanReviewedAt,
      humanReviewedById: formData.get("humanReviewed") ? user.id : promise.humanReviewedById
    }
  });
  await prisma.promiseTimelineEvent.create({
    data: {
      promiseId: id,
      actorId: user.id,
      eventType: "Workflow updated",
      description: `Status changed to ${nextStatus || promise.status}.`
    }
  });
  revalidatePath(`/promises/${id}`);
  redirect(`/promises/${id}`);
}

export async function addCommentAction(formData: FormData) {
  const user = await requireUser();
  const promiseId = getString(formData, "promiseId");
  await prisma.promiseComment.create({
    data: { promiseId, userId: user.id, comment: getString(formData, "comment") }
  });
  revalidatePath(`/promises/${promiseId}`);
}

export async function addActionItemAction(formData: FormData) {
  const user = await requireUser();
  const promiseId = getString(formData, "promiseId") || null;
  const accountId = getString(formData, "accountId");
  await prisma.promiseActionItem.create({
    data: {
      organizationId: user.organizationId,
      promiseId,
      accountId,
      title: getString(formData, "title"),
      description: getString(formData, "description"),
      ownerId: getString(formData, "ownerId") || null,
      dueDate: getString(formData, "dueDate") ? new Date(getString(formData, "dueDate")) : null,
      priority: getString(formData, "priority") || "Medium",
      status: "Open",
      createdById: user.id
    }
  });
  revalidatePath("/action-items");
  if (promiseId) revalidatePath(`/promises/${promiseId}`);
}

export async function createCapabilityAction(formData: FormData) {
  const user = await requireUser();
  const parsed = capabilityInputSchema.parse(Object.fromEntries(formData));
  const capability = await prisma.capability.create({
    data: {
      ...parsed,
      organizationId: user.organizationId,
      lastVerifiedDate: new Date()
    }
  });
  redirect(`/capabilities/${capability.id}`);
}

export async function updateRiskSettingsAction(formData: FormData) {
  const user = await requireUser();
  const values = {
    unsupportedCapabilityWeight: Number(formData.get("unsupportedCapabilityWeight")),
    partialSupportWeight: Number(formData.get("partialSupportWeight")),
    enterpriseCustomerWeight: Number(formData.get("enterpriseCustomerWeight")),
    contractSourceWeight: Number(formData.get("contractSourceWeight")),
    dueDateProximityWeight: Number(formData.get("dueDateProximityWeight")),
    missingOwnerWeight: Number(formData.get("missingOwnerWeight")),
    dealValueWeight: Number(formData.get("dealValueWeight")),
    complianceSecurityWeight: Number(formData.get("complianceSecurityWeight")),
    lowConfidenceWeight: Number(formData.get("lowConfidenceWeight")),
    repeatedPromiseWeight: Number(formData.get("repeatedPromiseWeight"))
  };
  await prisma.riskSetting.upsert({
    where: { organizationId: user.organizationId },
    create: { organizationId: user.organizationId, ...values },
    update: values
  });
  revalidatePath("/settings");
}

export async function reloadDemoDataAction() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { seedDemoData } = await import("@/prisma/seed-helpers");
  await seedDemoData(true);
  redirect("/dashboard");
}
