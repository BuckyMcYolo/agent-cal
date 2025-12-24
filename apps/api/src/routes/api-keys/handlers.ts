import { auth } from "@workspace/auth"
import { and, count, db, desc, eq } from "@workspace/db"
import { apikey } from "@workspace/db/schema/auth"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import type { AppRouteHandler } from "@/lib/types/app-types"
import type {
  CreateKeyRoute,
  DeleteKeyRoute,
  GetKeyRoute,
  ListKeysRoute,
  UpdateKeyRoute,
} from "./routes"

/**
 * List all API keys for the organization
 */
export const listKeys: AppRouteHandler<ListKeysRoute> = async (c) => {
  try {
    const { page = 1, perPage = 10 } = c.req.valid("query")

    const org = c.var.organization
    if (!org) {
      return c.json(
        { success: false, message: "Organization context required" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    const totalKeysCount = await db
      .select({ count: count() })
      .from(apikey)
      .where(eq(apikey.organizationId, org.id))
      .execute()

    const keys = await db.query.apikey.findMany({
      where: eq(apikey.organizationId, org.id),
      orderBy: desc(apikey.createdAt),
      limit: perPage,
      offset: (page - 1) * perPage,
      columns: {
        key: false, // Never return the actual key
      },
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    const totalItems = totalKeysCount[0]?.count ?? 0
    const totalPages = Math.ceil(totalItems / perPage)

    const meta = {
      currentPage: page,
      perPage: perPage,
      totalItems: totalItems,
      totalPages: totalPages,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    }

    return c.json({ data: keys, meta }, HttpStatusCodes.OK)
  } catch (error) {
    console.error("[List API Keys] Error:", error)
    return c.json(
      { success: false, message: "Failed to list API keys" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

/**
 * Get a single API key by ID
 */
export const getKey: AppRouteHandler<GetKeyRoute> = async (c) => {
  try {
    const { id } = c.req.valid("param")

    const org = c.var.organization
    if (!org) {
      return c.json(
        { success: false, message: "Organization context required" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    const key = await db.query.apikey.findFirst({
      where: and(eq(apikey.id, id), eq(apikey.organizationId, org.id)),
      columns: {
        key: false,
      },
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!key) {
      return c.json(
        { success: false, message: "API key not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    return c.json(key, HttpStatusCodes.OK)
  } catch (error) {
    console.error("[Get API Key] Error:", error)
    return c.json(
      { success: false, message: "Failed to get API key" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

/**
 * Create a new API key for the organization
 */
export const createKey: AppRouteHandler<CreateKeyRoute> = async (c) => {
  try {
    const body = c.req.valid("json")

    const user = c.var.user
    const org = c.var.organization

    if (!user) {
      return c.json(
        { success: false, message: "User context required" },
        HttpStatusCodes.UNAUTHORIZED
      )
    }

    if (!org) {
      return c.json(
        { success: false, message: "Organization context required" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    // Ensure unique name within the organization
    const existingKey = await db
      .select({ id: apikey.id })
      .from(apikey)
      .where(and(eq(apikey.name, body.name), eq(apikey.organizationId, org.id)))
      .limit(1)
      .then((rows) => rows[0])

    if (existingKey) {
      return c.json(
        { success: false, message: "API key name must be unique" },
        HttpStatusCodes.BAD_REQUEST
      )
    }

    // Create the key via Better Auth (tracks the creating user)
    const newKey = await auth.api.createApiKey({
      body: {
        name: body.name,
        expiresIn: body.expiresIn,
        userId: user.id, // Track who created the key
        permissions: {
          all: body.permissions ?? ["read", "write"],
        },
      },
    })

    if (!newKey) {
      return c.json(
        { success: false, message: "Failed to create API key" },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }

    // Update the key with the organization ID (org owns the key for API usage)
    await db
      .update(apikey)
      .set({ organizationId: org.id })
      .where(eq(apikey.id, newKey.id))

    // Fetch the created key (without the actual key field)
    const createdKey = await db.query.apikey.findFirst({
      where: eq(apikey.id, newKey.id),
      columns: {
        key: false,
      },
    })

    if (!createdKey) {
      return c.json(
        { success: false, message: "Failed to retrieve created API key" },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }

    return c.json(
      {
        ...createdKey,
        key: newKey.key, // Include the key only on creation
      },
      HttpStatusCodes.OK
    )
  } catch (error) {
    console.error("[Create API Key] Error:", error)
    return c.json(
      { success: false, message: "Failed to create API key" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

/**
 * Update an API key
 */
export const updateKey: AppRouteHandler<UpdateKeyRoute> = async (c) => {
  try {
    const { id } = c.req.valid("param")
    const body = c.req.valid("json")

    const user = c.var.user
    const org = c.var.organization

    if (!user) {
      return c.json(
        { success: false, message: "User context required" },
        HttpStatusCodes.UNAUTHORIZED
      )
    }

    if (!org) {
      return c.json(
        { success: false, message: "Organization context required" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    // Verify the key belongs to the organization
    const existingKey = await db
      .select({ id: apikey.id, userId: apikey.userId })
      .from(apikey)
      .where(and(eq(apikey.id, id), eq(apikey.organizationId, org.id)))
      .limit(1)
      .then((rows) => rows[0])

    if (!existingKey) {
      return c.json(
        { success: false, message: "API key not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    // Update via Better Auth
    const updateResult = await auth.api.updateApiKey({
      body: {
        keyId: id,
        name: body.name,
        userId: existingKey.userId ?? user.id,
        permissions: body.permissions
          ? { all: body.permissions }
          : { all: ["read", "write"] },
        enabled: body.enabled,
      },
    })

    if (!updateResult) {
      return c.json(
        { success: false, message: "Failed to update API key" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    // Parse permissions from JSON string if needed
    let parsedPermissions: { all?: ("read" | "write")[] } = {
      all: ["read", "write"],
    }
    if (updateResult.permissions) {
      try {
        const parsed: unknown =
          typeof updateResult.permissions === "string"
            ? JSON.parse(updateResult.permissions)
            : updateResult.permissions
        if (
          parsed &&
          typeof parsed === "object" &&
          "all" in parsed &&
          Array.isArray(parsed.all)
        ) {
          parsedPermissions = parsed as { all: ("read" | "write")[] }
        }
      } catch {
        // Keep default permissions on parse error
      }
    }

    return c.json(
      {
        id: updateResult.id,
        name: updateResult.name ?? "",
        permissions: parsedPermissions,
      },
      HttpStatusCodes.OK
    )
  } catch (error) {
    console.error("[Update API Key] Error:", error)
    return c.json(
      { success: false, message: "Failed to update API key" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

/**
 * Delete an API key
 */
export const deleteKey: AppRouteHandler<DeleteKeyRoute> = async (c) => {
  try {
    const { id } = c.req.valid("param")

    const org = c.var.organization
    if (!org) {
      return c.json(
        { success: false, message: "Organization context required" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    // Verify the key belongs to the organization
    const existingKey = await db
      .select({ id: apikey.id })
      .from(apikey)
      .where(and(eq(apikey.id, id), eq(apikey.organizationId, org.id)))
      .limit(1)
      .then((rows) => rows[0])

    if (!existingKey) {
      return c.json(
        { success: false, message: "API key not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    const { success } = await auth.api.deleteApiKey({
      body: { keyId: id },
    })

    if (!success) {
      return c.json(
        { success: false, message: "Failed to delete API key" },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }

    return c.json(
      { success: true, message: "API key deleted successfully" },
      HttpStatusCodes.OK
    )
  } catch (error) {
    console.error("[Delete API Key] Error:", error)
    return c.json(
      { success: false, message: "Failed to delete API key" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}
