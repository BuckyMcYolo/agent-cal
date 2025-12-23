import { createRoute, z } from "@hono/zod-openapi"
import { db, eq } from "@workspace/db"
import { organization } from "@workspace/db/schema/auth"
import {
  availabilitySchedule,
  insertAvailabilitySchema,
  weeklyScheduleSlot,
} from "@workspace/db/schema/availability"
import {
  insertOnboardingPreferences,
  userPreferences,
} from "@workspace/db/schema/user-preferences"
import { createRouter } from "@/lib/helpers/app/create-app"
import { zodSchemaToOpenAPI } from "@/lib/helpers/openapi/drizzle-zod-to-openapi"
import { unauthorizedSchema } from "@/lib/helpers/openapi/schemas/error/unauthorized-schema"
import jsonContent from "@/lib/helpers/openapi/schemas/json-content"
import jsonContentRequired from "@/lib/helpers/openapi/schemas/json-content-required"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import { sluggify } from "@/lib/misc/sluggify"
import { getUserOrgbyUserId } from "@/lib/queries/users"
import type { AppRouteHandler } from "@/lib/types/app-types"
import { authMiddleware } from "@/middleware/bearer-auth-middleware"

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
        availabilitySchedule: z
          .object({
            schedule: zodSchemaToOpenAPI(insertAvailabilitySchema),
            weeklySlots: z.object({
              sunday: z.object({
                enabled: z.boolean(),
                slots: z.array(
                  z.object({
                    startTime: z.string(),
                    endTime: z.string(),
                  })
                ),
              }),
              monday: z.object({
                enabled: z.boolean(),
                slots: z.array(
                  z.object({
                    startTime: z.string(),
                    endTime: z.string(),
                  })
                ),
              }),
              tuesday: z.object({
                enabled: z.boolean(),
                slots: z.array(
                  z.object({
                    startTime: z.string(),
                    endTime: z.string(),
                  })
                ),
              }),
              wednesday: z.object({
                enabled: z.boolean(),
                slots: z.array(
                  z.object({
                    startTime: z.string(),
                    endTime: z.string(),
                  })
                ),
              }),
              thursday: z.object({
                enabled: z.boolean(),
                slots: z.array(
                  z.object({
                    startTime: z.string(),
                    endTime: z.string(),
                  })
                ),
              }),
              friday: z.object({
                enabled: z.boolean(),
                slots: z.array(
                  z.object({
                    startTime: z.string(),
                    endTime: z.string(),
                  })
                ),
              }),
              saturday: z.object({
                enabled: z.boolean(),
                slots: z.array(
                  z.object({
                    startTime: z.string(),
                    endTime: z.string(),
                  })
                ),
              }),
            }),
          })
          .optional(),
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
    const {
      onboarding,
      businessName,
      isBusinessOrPersonal,
      availabilitySchedule: availabilityScheduleData,
    } = onboardingInfo

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

    // Create availability schedule if provided
    if (availabilityScheduleData) {
      try {
        // 1. Insert the main availability schedule
        const [schedule] = await db
          .insert(availabilitySchedule)
          .values({
            name: availabilityScheduleData.schedule.name || "Default Schedule",
            timeZone: onboarding.timezone || "America/New_York",
            ownerId: user.id,
            organizationId: org.id,
            isDefault: true, // Set as default schedule
          })
          .returning()

        if (!schedule) {
          throw new Error("Failed to create availability schedule")
        }

        // 2. Map days to their numerical values (0-6, Sunday-Saturday)
        const dayMapping = {
          sunday: 0,
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
        }

        // 3. Prepare slots to insert
        const weeklySlots = []

        for (const [day, index] of Object.entries(dayMapping) as [
          keyof typeof dayMapping,
          number,
        ][]) {
          const dayData =
            availabilityScheduleData.weeklySlots[
              day as keyof typeof availabilityScheduleData.weeklySlots
            ]

          // Only process enabled days
          if (dayData?.enabled) {
            for (const slot of dayData.slots) {
              if (slot.startTime && slot.endTime) {
                weeklySlots.push({
                  scheduleId: schedule.id,
                  dayOfWeek: index,
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                })
              }
            }
          }
        }

        // 4. Insert all weekly slots in a batch if any exist
        if (weeklySlots.length > 0) {
          await db.insert(weeklyScheduleSlot).values(weeklySlots)
        }
      } catch (error) {
        console.error("Error creating availability schedule:", error)
        // We won't fail the entire onboarding if availability creation fails
        // Just log the error and continue
      }
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
        message: `Failed to complete onboarding: ${errorMessage}`,
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
