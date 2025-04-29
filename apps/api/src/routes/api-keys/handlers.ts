import type { AppRouteHandler } from "@/lib/types/app-types"
import type { CreateKeyRoute, ListOrgKeysRoute, UpdateKeyRoute } from "./routes"
import { auth } from "@workspace/auth"
import * as HttpstatusCodes from "@/lib/misc/http-status-codes"
import { db } from "@workspace/db"
import { getUserOrgbyUserId } from "@/lib/queries/users"
import { apikey } from "@workspace/db/schema/auth"

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
    return c.json(
      {
        id: updateKey.id,
        name: updateKey.name ?? "",
        permissions: updateKey.permissions as any,
      },
      HttpstatusCodes.OK
    )
  } catch (error) {
    console.error("Error creating API key:", error)
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
    const keys = await db.query.apikey.findMany({
      where: (apikey, { inArray }) => inArray(apikey.userId, userIds),
      orderBy: (apikeys, { desc }) => desc(apikeys.createdAt),
      limit: perPage,
      offset: (page - 1) * perPage,
      columns: {
        key: false,
      },
    })

    return c.json(keys, HttpstatusCodes.OK)
  } catch (error) {
    console.error("Error listing Org API keys:", error)
    return c.json(
      { success: false, message: "Failed to list API keys" },
      HttpstatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}
