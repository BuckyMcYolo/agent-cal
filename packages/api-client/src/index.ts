import type { AppType } from "@workspace/api/app"
import { hc } from "hono/client"

// this is a trick to calculate the type when compiling
const client = hc<AppType>("")
export type Client = typeof client

export const honoClient = (...args: Parameters<typeof hc>): Client =>
  hc<AppType>(...args)
