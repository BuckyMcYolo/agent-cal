import { createRouter } from "@/lib/helpers/app/create-app"
import * as handlers from "./handlers"
import * as routes from "./routes"

const availabilityRouter = createRouter()
  .openapi(routes.listAvailability, handlers.listAvailability)
  .openapi(routes.getAvailability, handlers.getAvailability)
  .openapi(routes.postAvailability, handlers.postAvailability)
  .openapi(routes.updateAvailability, handlers.updateAvailability)
  .openapi(routes.deleteAvailability, handlers.deleteAvailability)

export default availabilityRouter
