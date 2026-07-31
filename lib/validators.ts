import { z } from "zod";
import { documentTypes, promiseCategories, workflowStatuses } from "./constants";

export const extractedPromiseSchema = z.object({
  promiseText: z.string().min(8),
  normalizedClaim: z.string().min(4),
  sourceLocation: z.string().min(1),
  category: z.enum(promiseCategories),
  confidenceScore: z.number().min(0).max(1),
  dueDate: z.string().datetime().optional().nullable(),
  extractedOwner: z.string().optional().nullable(),
  extractionMethod: z.enum(["AI", "Rule-based"])
});

export const documentInputSchema = z.object({
  accountId: z.string().min(1),
  title: z.string().min(2),
  documentType: z.enum(documentTypes),
  rawText: z.string().min(20),
  sourceOwner: z.string().min(2),
  dealStage: z.string().min(2),
  notes: z.string().optional()
});

export const promiseUpdateSchema = z.object({
  status: z.enum(workflowStatuses).optional(),
  assignedOwnerId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  needsHumanReview: z.boolean().optional(),
  riskLevel: z.string().optional()
});

export const capabilityInputSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(8),
  category: z.string().min(2),
  supportStatus: z.string().min(2),
  evidence: z.string().min(5),
  documentationLink: z.string().url().optional().or(z.literal("")),
  productOwner: z.string().min(2),
  engineeringOwner: z.string().min(2),
  releaseVersion: z.string().optional(),
  limitations: z.string().optional(),
  supportedPlans: z.string().min(2),
  requiredConfiguration: z.string().optional(),
  thirdPartyDependency: z.string().optional(),
  internalNotes: z.string().optional()
});

export type ExtractedPromiseInput = z.infer<typeof extractedPromiseSchema>;
