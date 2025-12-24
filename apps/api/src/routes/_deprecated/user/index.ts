import { createRouter } from "@/lib/helpers/app/create-app"
import * as handlers from "./handlers"
import * as routes from "./routes"

const userPreferencesRouter = createRouter().openapi(
  routes.getUserPreferences,
  handlers.listUserPreferences
)

export default userPreferencesRouter
