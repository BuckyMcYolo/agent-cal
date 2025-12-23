import { db } from "@workspace/db"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import type { AppRouteHandler } from "@/lib/types/app-types"
import type { GetUserPreferencesRoute } from "./routes"

export const listUserPreferences: AppRouteHandler<
  GetUserPreferencesRoute
> = async (c) => {
  const user = c.var.user

  if (!user) {
    return c.json(
      {
        message: "User not found",
        success: false,
      },
      HttpStatusCodes.UNAUTHORIZED
    )
  }

  const userPreferences = await db.query.userPreferences.findFirst({
    where: (userPreferences, { eq }) => eq(userPreferences.userId, user.id),
    with: {
      user: true,
    },
  })

  if (!userPreferences) {
    return c.json(
      {
        message: "User preferences not found",
        success: false,
      },
      HttpStatusCodes.NOT_FOUND
    )
  }

  return c.json(userPreferences, HttpStatusCodes.OK)
}
