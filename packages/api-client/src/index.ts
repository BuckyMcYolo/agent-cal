import type { AppType } from "@workspace/api/app"
import type { InferRequestType, InferResponseType } from "hono/client"
import { hc } from "hono/client"

// Re-export hono client types for consumers
export type { InferResponseType, InferRequestType }

// this is a trick to calculate the type when compiling
const client = hc<AppType>("")
export type Client = typeof client

export const honoClient = (...args: Parameters<typeof hc>): Client =>
  hc<AppType>(...args)
