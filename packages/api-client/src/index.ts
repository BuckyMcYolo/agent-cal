import app from "@workspace/api/app"
import { hc } from "hono/client"

// this is a trick to calculate the type when compiling
const client = hc<typeof app>("")
export type Client = typeof client

export const hcWithType = (...args: Parameters<typeof hc>): Client =>
  hc<typeof app>(...args)
