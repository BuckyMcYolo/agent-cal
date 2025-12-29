import { createRouter } from "@/lib/helpers/app/create-app"
import * as handlers from "./handlers"
import * as routes from "./routes"

const bookingsRouter = createRouter()
  .openapi(routes.createBooking, handlers.createBooking)
  .openapi(routes.listBookings, handlers.listBookings)
  .openapi(routes.getBooking, handlers.getBooking)
  .openapi(routes.rescheduleBooking, handlers.rescheduleBooking)
  .openapi(routes.cancelBooking, handlers.cancelBooking)

export default bookingsRouter
