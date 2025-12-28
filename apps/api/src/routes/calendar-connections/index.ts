import { createRouter } from "@/lib/helpers/app/create-app"
import * as handlers from "./handlers"
import * as routes from "./routes"

const calendarConnectionsRouter = createRouter()
  // Google OAuth routes
  .openapi(routes.getGoogleOAuthUrl, handlers.getGoogleOAuthUrl)
  .openapi(routes.handleGoogleOAuthCallback, handlers.handleGoogleOAuthCallback)
  // Microsoft OAuth routes (returns 503 if not configured)
  .openapi(routes.getMicrosoftOAuthUrl, handlers.getMicrosoftOAuthUrl)
  .openapi(
    routes.handleMicrosoftOAuthCallback,
    handlers.handleMicrosoftOAuthCallback
  )
  // Connection management routes
  .openapi(routes.listConnections, handlers.listConnections)
  .openapi(routes.getConnection, handlers.getConnection)
  .openapi(routes.deleteConnection, handlers.deleteConnection)
  .openapi(routes.listCalendars, handlers.listCalendars)
  .openapi(routes.updateConnectionCalendar, handlers.updateConnectionCalendar)

export default calendarConnectionsRouter
