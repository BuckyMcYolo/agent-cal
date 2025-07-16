import { and, db, eq } from "@workspace/db"
import type { AppRouteHandler } from "@/lib/types/app-types"
import { tasks } from "@workspace/db/schema/tasks"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import * as HttpStatusPhrases from "@/lib/misc/http-status-phrases"
import type {
  CreateEventTypeRoute,
  DeleteEventTypeRoute,
  ListEventsTypesRoute,
} from "./routes"
import { eventType } from "@workspace/db/schema/event-types"
import { sluggify } from "@/lib/misc/sluggify"
import { getUserOrgbyUserId } from "@/lib/queries/users"
import { userPreferences } from "@workspace/db/schema/user-preferences"

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
