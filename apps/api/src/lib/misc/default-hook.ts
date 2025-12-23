import type { Hook } from "@hono/zod-openapi"
import type { AppBindings } from "@/lib/types/app-types"

import { UNPROCESSABLE_ENTITY } from "./http-status-codes"

// biome-ignore lint/suspicious/noExplicitAny: Hook requires flexible typing for route and path parameters
const defaultHook: Hook<any, AppBindings, any, any> = (result, c) => {
  if (!result.success) {
    return c.json(
      {
        success: result.success,
        error: result.error,
      },
      UNPROCESSABLE_ENTITY
    )
  }
}

export default defaultHook
