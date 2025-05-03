import { createRouter } from "@/lib/helpers/app/create-app"

import * as routes from "./routes"
import * as handlers from "./handlers"

const userPreferencesRouter = createRouter().openapi(
  routes.getUserPreferences,
  handlers.listUserPreferences
)

export default userPreferencesRouter
