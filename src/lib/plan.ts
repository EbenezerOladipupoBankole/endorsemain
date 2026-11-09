import { httpsCallable } from "@/lib/callable";
import { functions } from "@/components/client";

/** Must match FREE_DOCUMENT_LIMIT in functions/src/index.ts. */
export const FREE_DOCUMENT_LIMIT = 3;

/**
 * Switch for the free-document limit and paid checkout. Keep this false until the Cloud Functions
 * (claimDocumentCredit, the payment functions) are deployed; then set it to true, deploy the site,
 * and only after that deploy firestore.rules. While false, documents are not marked "uncounted",
 * so nothing sent in the meantime gets stuck once the rules go live.
 */
export const FREE_LIMIT_ENFORCED = false;

export interface PlanStatus {
  paid: boolean;
  name: "Free" | "Pro" | "Business";
  /** When a paid plan ends; undefined for free plans and paid plans without an end date. */
  endsAt?: Date;
  freeUsed: number;
}

/** Reads the plan from the user's profile, mirroring hasActivePaidPlan on the server. */
export const planStatus = (profile: Record<string, any> | null | undefined, isAdmin = false): PlanStatus => {
  const freeUsed = Number(profile?.freeDocsUsed || 0);
  if (isAdmin) return { paid: true, name: "Business", freeUsed };
  const plan = profile?.plan;
  if (plan !== "pro" && plan !== "business") return { paid: false, name: "Free", freeUsed };
  const endsAt: Date | undefined = profile?.planExpiresAt?.toDate?.();
  if (endsAt && endsAt.getTime() <= Date.now()) return { paid: false, name: "Free", freeUsed };
  return { paid: true, name: plan === "business" ? "Business" : "Pro", endsAt, freeUsed };
};

export interface CreditResult {
  paid: boolean;
  freeUsed: number;
  freeLimit: number;
  remaining: number | null;
}

/**
 * Uses one free document (no-op for paid plans). Throws a "functions/resource-exhausted" error
 * once the free documents are used up; check with isOutOfFreeDocuments.
 */
export const claimDocumentCredit = async (kind: "download" | "send", documentIds?: string[]) => {
  const claim = httpsCallable<{ kind: string; documentIds?: string[] }, CreditResult>(functions, "claimDocumentCredit");
  const { data } = await claim({ kind, documentIds });
  return data;
};

export const isOutOfFreeDocuments = (error: any) => error?.code === "functions/resource-exhausted";

/**
 * Like claimDocumentCredit, but if the check itself can't run (for example the function isn't
 * deployed, or the network fails) it returns null so the user isn't blocked. Only a real
 * "out of free documents" answer is thrown.
 */
export const tryClaimDocumentCredit = async (kind: "download" | "send", documentIds?: string[]) => {
  try {
    return await claimDocumentCredit(kind, documentIds);
  } catch (error) {
    if (isOutOfFreeDocuments(error)) throw error;
    console.warn("Couldn't check the free-document limit; allowing this one.", error);
    return null;
  }
};
