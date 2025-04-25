import type { AppRouteHandler } from "@/lib/types/app-types"
import type { CreateKeyRoute } from "./routes"
import { auth } from "@workspace/auth"
import * as HttpstatusCodes from "@/lib/misc/http-status-codes"

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
