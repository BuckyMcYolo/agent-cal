import { createRouter } from "@/lib/helpers/app/create-app"
import * as handlers from "./handlers"
import * as routes from "./routes"

const overridesRouter = createRouter()
  .openapi(routes.listOverrides, handlers.listOverrides)
  .openapi(routes.createOverride, handlers.createOverride)
  .openapi(routes.updateOverride, handlers.updateOverride)
  .openapi(routes.deleteOverride, handlers.deleteOverride)

export default overridesRouter
