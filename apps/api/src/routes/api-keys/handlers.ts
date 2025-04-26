import type { AppRouteHandler } from "@/lib/types/app-types"
import type { CreateKeyRoute, UpdateKeyRoute } from "./routes"
import { auth } from "@workspace/auth"
import * as HttpstatusCodes from "@/lib/misc/http-status-codes"
import { db } from "@workspace/db"

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
      { error: "Failed to create API key" },
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
      return c.json({ error: "API key not found" }, HttpstatusCodes.NOT_FOUND)
    }

    // Check if the key belongs to the user
    if (key.userId !== c.var.user?.id) {
      return c.json(
        { error: "You do not have permission to update this API key" },
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
      },
    })

    if (!updateKey) {
      return c.json({ error: "API key not found" }, HttpstatusCodes.NOT_FOUND)
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
    console.error("Error updating API key:", error)
    return c.json(
      { error: "Failed to update API key" },
      HttpstatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}
