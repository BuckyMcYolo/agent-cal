import { and, db, eq } from "@workspace/db"
import type { AppRouteHandler } from "@/lib/types/app-types"
import { tasks } from "@workspace/db/schema/tasks"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import * as HttpStatusPhrases from "@/lib/misc/http-status-phrases"
import type {
  CreateEventTypeRoute,
  DeleteEventTypeRoute,
  GetEventTypeRoute,
  ListEventsTypesRoute,
  UpdateEventTypeRoute,
} from "./routes"
import { eventType } from "@workspace/db/schema/event-types"
import { sluggify } from "@/lib/misc/sluggify"
import { getUserOrgbyUserId } from "@/lib/queries/users"
import { userPreferences } from "@workspace/db/schema/user-preferences"
import { availabilitySchedule } from "@workspace/db/schema/availability"

export const listEventTypes: AppRouteHandler<ListEventsTypesRoute> = async (
  c
) => {
  const { orgId, slug, userId } = c.req.valid("query")
  const eventTypes = await db.query.eventType.findMany({
    where: (eventType, operators) => {
      const filters = []
      if (orgId) {
        filters.push(operators.eq(eventType.organizationId, orgId))
      }
      if (slug) {
        filters.push(operators.eq(eventType.slug, slug))
      }
      if (userId) {
        filters.push(operators.eq(eventType.ownerId, userId))
      }
      return operators.and(...filters)
    },
  })
  // If no event types found, return an empty array instead of error
  if (!eventTypes || eventTypes.length === 0) {
    return c.json([], HttpStatusCodes.OK)
  }
  return c.json(eventTypes, HttpStatusCodes.OK)
}

export const createEventType: AppRouteHandler<CreateEventTypeRoute> = async (
  c
) => {
  const { length, title, description } = c.req.valid("json")

  const user = c.var.user

  if (!user) {
    return c.json(
      { success: false, message: "User not authenticated" },
      HttpStatusCodes.UNAUTHORIZED
    )
  }

  //need to
  // 1. Validate the input data
  // 2. Check if the event type slug already exists
  // 3. Get user preferences for timezone
  // 4. Insert the new event type into the database

  try {
    const userOrg = await getUserOrgbyUserId(user.id)

    const checkSlug = await db.query.eventType.findFirst({
      where: and(
        eq(eventType.slug, sluggify(title)),
        eq(eventType.organizationId, sluggify(userOrg?.id || ""))
      ),
    })

    if (checkSlug) {
      return c.json(
        {
          success: false,
          message: "Event type with this title already exists",
        },
        HttpStatusCodes.BAD_REQUEST
      )
    }

    const getUserPreferences = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, user.id),
    })

    const timeZone = getUserPreferences?.timezone || "America/New_York"

    const getDefaultAvailabilitySchedule =
      await db.query.availabilitySchedule.findFirst({
        where: and(
          eq(availabilitySchedule.isDefault, true),
          eq(availabilitySchedule.organizationId, userOrg?.id || ""),
          eq(availabilitySchedule.ownerId, user.id)
        ),
      })

    const [inserted] = await db
      .insert(eventType)
      .values({
        title,
        description,
        length,
        ownerId: user.id,
        organizationId: userOrg?.id || "",
        slug: sluggify(title),
        timeZone: timeZone,
        availabilityScheduleId: getDefaultAvailabilitySchedule?.id || null,
      })
      .returning()

    return c.json(inserted, HttpStatusCodes.OK)
  } catch (error) {
    console.error("Error creating event type:", error)
    return c.json(
      {
        success: false,
        message: "Failed to create event type",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const getEventType: AppRouteHandler<GetEventTypeRoute> = async (c) => {
  const { id } = c.req.valid("param")
  const user = c.var.user

  if (!user) {
    return c.json(
      { success: false, message: "User not authenticated" },
      HttpStatusCodes.UNAUTHORIZED
    )
  }

  try {
    const existingEventType = await db.query.eventType.findFirst({
      where: eq(eventType.id, id),
    })

    if (!existingEventType) {
      return c.json(
        { success: false, message: "Event type not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    if (existingEventType.ownerId !== user.id) {
      return c.json(
        {
          success: false,
          message:
            "Forbidden - you don't have permission to access this event type",
        },
        HttpStatusCodes.FORBIDDEN
      )
    }

    return c.json(existingEventType, HttpStatusCodes.OK)
  } catch (error) {
    console.error("Error fetching event type:", error)
    return c.json(
      {
        success: false,
        message: "Failed to fetch event type",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const updateEventType: AppRouteHandler<UpdateEventTypeRoute> = async (
  c
) => {
  const { id } = c.req.valid("param")
  const updateData = c.req.valid("json")
  const user = c.var.user

  if (!user) {
    return c.json(
      { success: false, message: "User not authenticated" },
      HttpStatusCodes.UNAUTHORIZED
    )
  }

  try {
    const existingEventType = await db.query.eventType.findFirst({
      where: eq(eventType.id, id),
    })

    if (!existingEventType) {
      return c.json(
        { success: false, message: "Event type not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    if (existingEventType.ownerId !== user.id) {
      return c.json(
        {
          success: false,
          message:
            "Forbidden - you don't have permission to update this event type",
        },
        HttpStatusCodes.FORBIDDEN
      )
    }

    // Validation for specific fields
    const validationErrors: string[] = []

    // Validate length is in 15-minute increments
    if (updateData.length !== undefined) {
      if (updateData.length < 15 || updateData.length % 15 !== 0) {
        validationErrors.push(
          "Length must be at least 15 minutes and in 15-minute increments"
        )
      }
    }

    // Validate booking frequency limits
    if (updateData.limitBookingFrequency === true) {
      if (
        !updateData.dailyFrequencyLimit &&
        !updateData.weeklyFrequencyLimit &&
        !updateData.monthlyFrequencyLimit
      ) {
        validationErrors.push(
          "At least one frequency limit must be set when limitBookingFrequency is enabled"
        )
      }
    }

    // Validate future booking limits
    if (
      updateData.limitFutureBookings === true &&
      !updateData.maxDaysInFuture
    ) {
      validationErrors.push(
        "maxDaysInFuture must be set when limitFutureBookings is enabled"
      )
    }

    // Validate buffer times are non-negative
    if (
      updateData.beforeEventBuffer !== undefined &&
      updateData.beforeEventBuffer !== null &&
      updateData.beforeEventBuffer < 0
    ) {
      validationErrors.push("beforeEventBuffer must be non-negative")
    }
    if (
      updateData.afterEventBuffer !== undefined &&
      updateData.afterEventBuffer !== null &&
      updateData.afterEventBuffer < 0
    ) {
      validationErrors.push("afterEventBuffer must be non-negative")
    }

    // Validate minimum booking notice is non-negative
    if (
      updateData.minimumBookingNotice !== undefined &&
      updateData.minimumBookingNotice !== null &&
      updateData.minimumBookingNotice < 0
    ) {
      validationErrors.push("minimumBookingNotice must be non-negative")
    }

    if (validationErrors.length > 0) {
      return c.json(
        {
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        },
        HttpStatusCodes.BAD_REQUEST
      )
    }

    // Check for slug uniqueness if slug is being updated
    if (updateData.slug && updateData.slug !== existingEventType.slug) {
      const userOrg = await getUserOrgbyUserId(user.id)
      const checkSlug = await db.query.eventType.findFirst({
        where: and(
          eq(eventType.slug, updateData.slug),
          eq(eventType.organizationId, userOrg?.id || "")
        ),
      })

      if (checkSlug) {
        return c.json(
          {
            success: false,
            message: "Event type with this URL slug already exists",
            field: "slug",
          },
          HttpStatusCodes.CONFLICT
        )
      }
    }

    // Check for title uniqueness if title is being updated (for auto-generated slug)
    if (
      updateData.title &&
      updateData.title !== existingEventType.title &&
      !updateData.slug
    ) {
      const autoSlug = sluggify(updateData.title)
      if (autoSlug !== existingEventType.slug) {
        const userOrg = await getUserOrgbyUserId(user.id)
        const checkSlug = await db.query.eventType.findFirst({
          where: and(
            eq(eventType.slug, autoSlug),
            eq(eventType.organizationId, userOrg?.id || "")
          ),
        })

        if (checkSlug) {
          return c.json(
            {
              success: false,
              message: "An event type with a similar title already exists",
              field: "title",
            },
            HttpStatusCodes.CONFLICT
          )
        }
        // Auto-generate slug from title if not provided
        updateData.slug = autoSlug
      }
    }

    // Prepare update data, filtering out undefined values
    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    )

    const [updated] = await db
      .update(eventType)
      .set({
        ...filteredUpdateData,
        updatedAt: new Date(),
      })
      .where(eq(eventType.id, id))
      .returning()

    return c.json(updated, HttpStatusCodes.OK)
  } catch (error) {
    console.error("Error updating event type:", error)

    // Handle database constraint errors
    if (error instanceof Error) {
      if (error.message.includes("unique constraint")) {
        return c.json(
          {
            success: false,
            message:
              "A unique constraint was violated. Please check your input data.",
          },
          HttpStatusCodes.CONFLICT
        )
      }
    }

    return c.json(
      {
        success: false,
        message: "Failed to update event type",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const deleteEventType: AppRouteHandler<DeleteEventTypeRoute> = async (
  c
) => {
  const { id } = c.req.valid("param")
  const user = c.var.user

  if (!user) {
    return c.json(
      { success: false, message: "User not authenticated" },
      HttpStatusCodes.UNAUTHORIZED
    )
  }

  try {
    const existingEventType = await db.query.eventType.findFirst({
      where: eq(eventType.id, id),
    })

    if (!existingEventType) {
      return c.json(
        { success: false, message: "Event type not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    if (existingEventType.ownerId !== user.id) {
      return c.json(
        {
          success: false,
          message:
            "Forbidden - you don't have permission to delete this event type",
        },
        HttpStatusCodes.FORBIDDEN
      )
    }

    await db.delete(eventType).where(eq(eventType.id, id))

    return c.body(null, HttpStatusCodes.NO_CONTENT)
  } catch (error) {
    console.error("Error deleting event type:", error)
    return c.json(
      {
        success: false,
        message: "Failed to delete event type",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}
