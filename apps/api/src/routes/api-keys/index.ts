import { createRouter } from "@/lib/helpers/app/create-app"

import * as routes from "./routes"
import * as handlers from "./handlers"

const apiKeysRouter = createRouter()
  .openapi(routes.createKey, handlers.createTask)
  .openapi(routes.updateKey, handlers.updateTask)
  .openapi(routes.listOrgKeys, handlers.listOrgKeys)
  .openapi(routes.deleteOrgKey, handlers.deleteOrgKey)
  .openapi(routes.updateOrgKey, handlers.updateOrgApiKey)

export default apiKeysRouter
