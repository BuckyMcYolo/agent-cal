import { createRouter } from "@/lib/helpers/app/create-app"

import * as routes from "./routes"
import * as handlers from "./handlers"

const tasksRouter = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.create, handlers.createTask)
  .openapi(routes.getOne, handlers.getOne)
  .openapi(routes.patch, handlers.patch)
  .openapi(routes.remove, handlers.remove)

export default tasksRouter
