import { createRouter } from "@/lib/helpers/app/create-app"

import * as routes from "./routes"
import * as handlers from "./handlers"
import { createTask } from "./routes"

const tasksRouter = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.create, createTask)

export default tasksRouter
