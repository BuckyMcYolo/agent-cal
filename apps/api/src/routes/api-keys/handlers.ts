import { auth } from "@workspace/auth"
import { count, db, inArray } from "@workspace/db"
import { apikey } from "@workspace/db/schema/auth"
import * as HttpstatusCodes from "@/lib/misc/http-status-codes"
import { getUserOrgbyUserId } from "@/lib/queries/users"
import type { AppRouteHandler } from "@/lib/types/app-types"
import type {
  CreateKeyRoute,
  DeleteOrgKeyRoute,
  ListOrgKeysRoute,
  UpdateKeyRoute,
  UpdateOrgKeyRoute,
} from "./routes"

export const createTask: AppRouteHandler<CreateKeyRoute> = async (c) => {
  const body = c.req.valid("json")

  try {
    const createKey = await auth.api.createApiKey({
      body: {
        name: body.name,
        expiresIn: body.expiresIn,
        userId: c.var.user?.id,
        permissions: {
          all: body.permissions ?? ["read", "write"],
        },
      },
    })
    return c.json(
      {
        id: createKey.id,
        name: createKey.name ?? "",
        key: createKey.key,
        permissions: createKey.permissions,
      },
      HttpstatusCodes.OK
    )
  } catch (error) {
    console.error("Error creating API key:", error)
    return c.json(
      { success: false, message: "Failed to create API key" },
      HttpstatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const updateTask: AppRouteHandler<UpdateKeyRoute> = async (c) => {
  const body = c.req.valid("json")
  const { id } = c.req.valid("param")
  // Check if the key exists
  try {
    const key = await db.query.apikey.findFirst({
      where: (apikey, { eq }) => eq(apikey.id, id),
    })
    if (!key) {
      return c.json(
        {
          success: false,
          message: "API key not found",
        },
        HttpstatusCodes.NOT_FOUND
      )
    }
    // Check if the key belongs to the user
    if (key.userId !== c.var.user?.id) {
      return c.json(
        {
          success: false,
          message: "You do not have permission to update this API key",
        },
        HttpstatusCodes.FORBIDDEN
      )
    }
    const updateKey = await auth.api.updateApiKey({
      body: {
        keyId: id,
        name: body.name,
        userId: c.var.user?.id,
        permissions: {
          all: body.permissions ?? ["read", "write"],
        },
        enabled: body.enabled,
      },
    })
    if (!updateKey) {
      return c.json(
        {
          success: false,
          message: "API key not found",
        },
        HttpstatusCodes.NOT_FOUND
      )
    }
    // Parse permissions from JSON string if needed
    let parsedPermissions: { all?: ("read" | "write")[] } = {
      all: ["read", "write"],
    }
    if (updateKey.permissions) {
      try {
        const parsed: unknown =
          typeof updateKey.permissions === "string"
            ? JSON.parse(updateKey.permissions)
            : updateKey.permissions
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
        id: updateKey.id,
        name: updateKey.name ?? "",
        permissions: parsedPermissions,
      },
      HttpstatusCodes.OK
    )
  } catch (error) {
    console.error("Error updating API key:", error)
    return c.json(
      { success: false, message: "Failed to update API key" },
      HttpstatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const listOrgKeys: AppRouteHandler<ListOrgKeysRoute> = async (c) => {
  try {
    const { page = 1, perPage = 10 } = c.req.valid("query")

    const user = c.var.user
    if (!user || !user.id) {
      return c.json(
        { success: false, message: "Error - Authentication Required" },
        HttpstatusCodes.UNAUTHORIZED
      )
    }

    if (user.role !== "admin") {
      return c.json(
        { success: false, message: "Error - Admin role required" },
        HttpstatusCodes.FORBIDDEN
      )
    }

    const userOrg = await getUserOrgbyUserId(user.id)

    if (!userOrg) {
      throw new Error("User does not belong to any organization")
    }

    const orgUsers = await db.query.member.findMany({
      where: (member, { eq }) => eq(member.organizationId, userOrg.id),
      columns: {
        userId: true,
      },
    })

    const userIds = orgUsers.map((user) => user.userId)

    const totalKeysCount = await db
      .select({ count: count() })
      .from(apikey)
      .where(inArray(apikey.userId, userIds))
      .execute()

    const keys = await db.query.apikey.findMany({
      where: (apikey, { inArray }) => inArray(apikey.userId, userIds),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: (apikeys, { desc }) => desc(apikeys.createdAt),
      limit: perPage,
      offset: (page - 1) * perPage,
      columns: {
        key: false,
      },
    })

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalKeysCount[0]?.count ?? 0 / perPage)

    return c.json(
      {
        data: keys,
        meta: {
          currentPage: page,
          perPage,
          totalItems: totalKeysCount[0]?.count ?? 0,
          totalPages,
          nextPage: page < totalPages ? page + 1 : null,
          prevPage: page > 1 ? page - 1 : null,
        },
      },
      HttpstatusCodes.OK
    )
  } catch (error) {
    console.error("Error listing Org API keys:", error)
    return c.json(
      { success: false, message: "Failed to list API keys" },
      HttpstatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const deleteOrgKey: AppRouteHandler<DeleteOrgKeyRoute> = async (c) => {
  const { id } = c.req.valid("param")
  try {
    const user = c.var.user
    if (!user || !user.id) {
      return c.json(
        { success: false, message: "Error - Authentication Required" },
        HttpstatusCodes.UNAUTHORIZED
      )
    }

    if (user.role !== "admin") {
      return c.json(
        { success: false, message: "Error - Admin role required" },
        HttpstatusCodes.FORBIDDEN
      )
    }

    const key = await db.query.apikey.findFirst({
      where: (apikey, { eq }) => eq(apikey.id, id),
    })

    if (!key) {
      return c.json(
        {
          success: false,
          message: "API key not found",
        },
        HttpstatusCodes.NOT_FOUND
      )
    }
    // Check if the key belongs to the organization
    const userOrg = await getUserOrgbyUserId(user.id)
    if (!userOrg) {
      return c.json(
        {
          success: false,
          message: "Error - User does not belong to any organization",
        },
        HttpstatusCodes.FORBIDDEN
      )
    }
    const orgUsers = await db.query.member.findMany({
      where: (member, { eq }) => eq(member.organizationId, userOrg.id),
      columns: {
        userId: true,
      },
    })
    const userIds = orgUsers.map((user) => user.userId)
    if (!userIds.includes(key.userId)) {
      return c.json(
        {
          success: false,
          message: "You do not have permission to delete this API key",
        },
        HttpstatusCodes.FORBIDDEN
      )
    }
    const { success } = await auth.api.deleteApiKey({
      body: {
        keyId: id,
      },
    })

    if (!success) {
      return c.json(
        {
          success: false,
          message: "Failed to delete API key",
        },
        HttpstatusCodes.INTERNAL_SERVER_ERROR
      )
    }

    return c.json(
      {
        success: true,
        message: "API key deleted successfully",
      },
      HttpstatusCodes.OK
    )
  } catch (error) {
    console.error("Error deleting API key:", error)
    return c.json(
      { success: false, message: "Failed to delete API key" },
      HttpstatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const updateOrgApiKey: AppRouteHandler<UpdateOrgKeyRoute> = async (
  c
) => {
  try {
    const { id } = c.req.valid("param")
    const body = c.req.valid("json")

    const user = c.var.user
    if (!user || !user.id) {
      return c.json(
        { success: false, message: "Error - Authentication Required" },
        HttpstatusCodes.UNAUTHORIZED
      )
    }

    if (user.role !== "admin") {
      return c.json(
        { success: false, message: "Error - Admin role required" },
        HttpstatusCodes.FORBIDDEN
      )
    }

    const key = await db.query.apikey.findFirst({
      where: (apikey, { eq }) => eq(apikey.id, id),
    })

    if (!key) {
      return c.json(
        {
          success: false,
          message: "API key not found",
        },
        HttpstatusCodes.NOT_FOUND
      )
    }
    // Check if the key belongs to the organization
    const userOrg = await getUserOrgbyUserId(user.id)
    if (!userOrg) {
      return c.json(
        {
          success: false,
          message: "Error - User does not belong to any organization",
        },
        HttpstatusCodes.FORBIDDEN
      )
    }
    const orgUsers = await db.query.member.findMany({
      where: (member, { eq }) => eq(member.organizationId, userOrg.id),
      columns: {
        userId: true,
      },
    })
    const userIds = orgUsers.map((user) => user.userId)
    if (!userIds.includes(key.userId)) {
      return c.json(
        {
          success: false,
          message: "You do not have permission to update this API key",
        },
        HttpstatusCodes.FORBIDDEN
      )
    }

    const updateKey = await auth.api.updateApiKey({
      body: {
        keyId: id,
        name: body.name,
        userId: key.userId,
        permissions: {
          all: body.permissions ?? ["read", "write"],
        },
        enabled: body.enabled,
      },
    })

    if (!updateKey) {
      return c.json(
        {
          success: false,
          message: "API key not found",
        },
        HttpstatusCodes.NOT_FOUND
      )
    }

    // Parse permissions from JSON string if needed
    let parsedPermissions: { all?: ("read" | "write")[] } = {
      all: ["read", "write"],
    }
    if (updateKey.permissions) {
      try {
        const parsed: unknown =
          typeof updateKey.permissions === "string"
            ? JSON.parse(updateKey.permissions)
            : updateKey.permissions
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
        id: updateKey.id,
        name: updateKey.name ?? "",
        permissions: parsedPermissions,
      },
      HttpstatusCodes.OK
    )
  } catch (error) {
    console.error("Error updating Org API key:", error)
    return c.json(
      { success: false, message: "Failed to update API key" },
      HttpstatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}
