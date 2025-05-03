import { createRouter } from "@/lib/helpers/app/create-app"
import { unauthorizedSchema } from "@/lib/helpers/openapi/schemas/error/unauthorized-schema"
import jsonContent from "@/lib/helpers/openapi/schemas/json-content"
import jsonContentRequired from "@/lib/helpers/openapi/schemas/json-content-required"
import { authMiddleware } from "@/middleware/bearer-auth-middleware"
import { createRoute, z } from "@hono/zod-openapi"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import { zodSchemaToOpenAPI } from "@/lib/helpers/openapi/drizzle-zod-to-openapi"
import {
  insertOnboardingPreferences,
  userPreferences,
} from "@workspace/db/schema/user-preferences"
import type { AppRouteHandler } from "@/lib/types/app-types"
import { db } from "@workspace/db"

export const completeOnboardingRoute = createRoute({
  path: "/onboarding",
  method: "post",
  summary: "Complete onboarding",
  hide: true,
  middleware: [authMiddleware] as const,
  request: {
    body: jsonContentRequired({
      schema: z.object({
        onboarding: zodSchemaToOpenAPI(insertOnboardingPreferences),
        businessName: z.string().optional(),
        isBusinessOrPersonal: z.enum(["business", "personal"]),
      }),
      description: "The user preferences to create",
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Onboarding completed successfully",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
  },
})

export type CompleteOnboardingRoute = typeof completeOnboardingRoute

export const completeOnboardingHandler: AppRouteHandler<
  CompleteOnboardingRoute
> = async (c) => {
  const onboardingInfo = c.req.valid("json")
  const { onboarding, businessName, isBusinessOrPersonal } = onboardingInfo

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

  const userPreference = await db.query.userPreferences.findFirst({
    where: (userPreferences, { eq }) => eq(userPreferences.userId, user.id),
    with: {
      user: true,
    },
  })
  if (userPreferences?.onboardingCompleted) {
    return c.json(
      {
        message: "Onboarding already completed",
        success: false,
      },
      HttpStatusCodes.BAD_REQUEST
    )
  }

  const [inserted] = await db
    .insert(userPreferences)
    .values({
      userId: user.id,
      timezone: onboarding.timezone,
      calendarService: onboarding.calendarService,
      shouldShowFullTour: onboarding.shouldShowFullTour,
      schedulingPreference: onboarding.schedulingPreference,
      referralSource: onboarding.referralSource,
      onboardingCompleted: true,
    })
    .returning()

  if (!inserted) {
    return c.json(
      {
        message: "Failed to complete onboarding",
        success: false,
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }

  return c.json(inserted, HttpStatusCodes.OK)

  //   const [inserted] = await db.insert(tasks).values(task).returning()
  //   return c.json(inserted, HttpStatusCodes.OK)
}

const onboardingRouter = createRouter().openapi(
  completeOnboardingRoute,
  completeOnboardingHandler
)

export default onboardingRouter
