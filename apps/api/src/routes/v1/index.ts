import { createRouter } from "@/lib/helpers/app/create-app"
import apiKeysRouter from "../api-keys"
import availabilityRouter from "./availability"
import calendarConnectionsRouter from "./calendar-connections"

const v1Router = createRouter()
  .route("/", apiKeysRouter)
  .route("/", availabilityRouter)
  .route("/", calendarConnectionsRouter)

export default v1Router
