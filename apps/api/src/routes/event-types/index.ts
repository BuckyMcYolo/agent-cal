import { createRouter } from "@/lib/helpers/app/create-app"

import * as routes from "./routes"
import * as handlers from "./handlers"

const eventTypesRouter = createRouter()
  .openapi(routes.listEventTypes, handlers.listEventTypes)
  .openapi(routes.createEventType, handlers.createEventType)

export default eventTypesRouter
