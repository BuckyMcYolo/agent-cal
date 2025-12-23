import { createRouter } from "@/lib/helpers/app/create-app"
import * as handlers from "./handlers"
import * as routes from "./routes"

const eventTypesRouter = createRouter()
  .openapi(routes.listEventTypes, handlers.listEventTypes)
  .openapi(routes.createEventType, handlers.createEventType)
  .openapi(routes.getEventType, handlers.getEventType)
  .openapi(routes.updateEventType, handlers.updateEventType)
  .openapi(routes.deleteEventType, handlers.deleteEventType)

export default eventTypesRouter
