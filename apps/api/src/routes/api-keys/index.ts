import { createRouter } from "@/lib/helpers/app/create-app"
import * as handlers from "./handlers"
import * as routes from "./routes"

const apiKeysRouter = createRouter()
  .openapi(routes.listKeys, handlers.listKeys)
  .openapi(routes.getKey, handlers.getKey)
  .openapi(routes.createKey, handlers.createKey)
  .openapi(routes.updateKey, handlers.updateKey)
  .openapi(routes.deleteKey, handlers.deleteKey)

export default apiKeysRouter
