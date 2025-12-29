import { createRouter } from "@/lib/helpers/app/create-app"
import * as handlers from "./handlers"
import overridesRouter from "./overrides"
import * as routes from "./routes"

const availabilityRouter = createRouter()
  // Schedule CRUD
  .openapi(routes.listSchedules, handlers.listSchedules)
  .openapi(routes.createSchedule, handlers.createSchedule)
  .openapi(routes.getSchedule, handlers.getSchedule)
  .openapi(routes.updateSchedule, handlers.updateSchedule)
  .openapi(routes.deleteSchedule, handlers.deleteSchedule)
  // Rule CRUD
  .openapi(routes.createRule, handlers.createRule)
  .openapi(routes.updateRule, handlers.updateRule)
  .openapi(routes.deleteRule, handlers.deleteRule)
  .openapi(routes.replaceRules, handlers.replaceRules)
  // Override CRUD
  .route("/", overridesRouter)
  // Availability query
  .openapi(routes.getAvailability, handlers.getAvailability)

export default availabilityRouter
