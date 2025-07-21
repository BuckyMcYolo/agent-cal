import { createRouter } from "@/lib/helpers/app/create-app"

import * as routes from "./routes"
import * as handlers from "./handlers"

const availabilityRouter = createRouter()
  .openapi(routes.listAvailability, handlers.listAvailability)
  .openapi(routes.postAvailability, handlers.postAvailability)

export default availabilityRouter
