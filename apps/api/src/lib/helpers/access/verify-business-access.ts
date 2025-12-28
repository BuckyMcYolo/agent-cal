import { and, db, eq } from "@workspace/db"
import { business } from "@workspace/db/schema/business"
import { businessUser } from "@workspace/db/schema/business-user"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"

// ============================================================================
// Types
// ============================================================================

export type BusinessAccessError = {
  error: string
  status: typeof HttpStatusCodes.NOT_FOUND | typeof HttpStatusCodes.FORBIDDEN
}

export type BusinessAccessSuccess = {
  businessRecord: typeof business.$inferSelect
}

export type BusinessUserAccessSuccess = BusinessAccessSuccess & {
  userRecord: typeof businessUser.$inferSelect
}

// ============================================================================
// Verify Business Access
// ============================================================================

/**
 * Verify that a business belongs to the caller's organization
 */
export async function verifyBusinessAccess(
  organizationId: string,
  businessId: string
): Promise<BusinessAccessError | BusinessAccessSuccess> {
  const businessRecord = await db.query.business.findFirst({
    where: and(
      eq(business.id, businessId),
      eq(business.organizationId, organizationId)
    ),
  })

  if (!businessRecord) {
    return { error: "Business not found", status: HttpStatusCodes.NOT_FOUND }
  }

  return { businessRecord }
}

/**
 * Verify that a business user belongs to the caller's organization
 */
export async function verifyBusinessUserAccess(
  organizationId: string,
  businessId: string,
  userId: string
): Promise<BusinessAccessError | BusinessUserAccessSuccess> {
  const businessResult = await verifyBusinessAccess(organizationId, businessId)

  if ("error" in businessResult) {
    return businessResult
  }

  const userRecord = await db.query.businessUser.findFirst({
    where: and(
      eq(businessUser.id, userId),
      eq(businessUser.businessId, businessId)
    ),
  })

  if (!userRecord) {
    return { error: "User not found", status: HttpStatusCodes.NOT_FOUND }
  }

  return { businessRecord: businessResult.businessRecord, userRecord }
}

/**
 * Type guard to check if result is an error
 */
export function isAccessError(
  result: BusinessAccessError | BusinessAccessSuccess | BusinessUserAccessSuccess
): result is BusinessAccessError {
  return "error" in result
}
