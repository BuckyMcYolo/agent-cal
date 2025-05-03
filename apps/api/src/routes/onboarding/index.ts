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
import { db, eq } from "@workspace/db"
import { organization } from "@workspace/db/schema/auth"
import { getUserOrgbyUserId } from "@/lib/queries/users"
import { sluggify } from "@/lib/misc/sluggify"

export const completeOnboardingRoute = createRoute({
  path: "/onboarding",
  method: "post",
  summary: "Complete onboarding",
  hide: true,
  middleware: [authMiddleware] as const,
  request: {
    body: jsonContentRequired({
      schema: z.object({
        onboarding: zodSchemaToOpenAPI(
          insertOnboardingPreferences.omit({
            userId: true,
            onboardingCompleted: true,
          })
        ),
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
    [HttpStatusCodes.BAD_REQUEST]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Onboarding already completed",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Failed to complete onboarding",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
  },
})

type CompleteOnboardingRoute = typeof completeOnboardingRoute

export const completeOnboardingHandler: AppRouteHandler<
  CompleteOnboardingRoute
> = async (c) => {
  try {
    const onboardingInfo = c.req.valid("json")
    const { onboarding, businessName, isBusinessOrPersonal } = onboardingInfo

    const user = c.var.user

    if (!user) {
      throw new Error("User not found")
    }

    if (user.role !== "admin") {
      throw new Error("User is not an admin")
    }

    const org = await getUserOrgbyUserId(user.id)

    if (!org) {
      throw new Error("Organization not found")
    }

    const userPreference = await db.query.userPreferences.findFirst({
      where: (userPreferences, { eq }) => eq(userPreferences.userId, user.id),
    })

    if (userPreference?.onboardingCompleted) {
      throw new Error("Onboarding already completed")
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
          message: "Failed to create user preferences",
          success: false,
        },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }

    //edit business name if provided
    if (businessName && isBusinessOrPersonal === "business") {
      await db
        .update(organization)
        .set({
          name: businessName,
          slug: sluggify(businessName),
        })
        .where(eq(organization.id, org.id))
    }

    return c.json(
      {
        message: "Onboarding completed successfully",
        success: true,
      },
      HttpStatusCodes.OK
    )
  } catch (error) {
    console.error("Error completing onboarding:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred"
    return c.json(
      {
        message: "Failed to complete onboarding: " + errorMessage,
        success: false,
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

const onboardingRouter = createRouter().openapi(
  completeOnboardingRoute,
  completeOnboardingHandler
)

export default onboardingRouter
