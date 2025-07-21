import { db } from "@workspace/db"
import type { User } from "@workspace/auth"

/**
 * Retrieves the organization that a user belongs to.
 *
 * @param userId - The unique identifier of the user
 * @returns A Promise that resolves to the member record with the associated organization, or undefined
 */
export const getUserOrgbyUserId = async (userId: User["id"]) => {
  const member = await db.query.member.findFirst({
    where: (member, { eq }) => eq(member.userId, userId),
    with: {
      organization: true,
    },
  })
  return member?.organization
}

/**
 * Retrieves user preferences by user ID.
 *
 * @param userId - The unique identifier of the user
 * @returns A Promise that resolves to the user's preferences, or undefined if not found
 */

export const getUserPreferencesByUserId = async (userId: User["id"]) => {
  const userPreferences = await db.query.userPreferences.findFirst({
    where: (userPreferences, { eq }) => eq(userPreferences.userId, userId),
  })
  return userPreferences
}
