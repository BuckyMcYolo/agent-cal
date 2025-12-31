// Re-export email utilities
export { isEmailEnabled } from "./client"

// Re-export send functions from templates
export { sendBookingConfirmation } from "./templates/booking-confirmation"
export { sendBookingHostNotification } from "./templates/booking-host-notification"
export { sendBookingCancelled } from "./templates/booking-cancelled"
export { sendBookingRescheduled } from "./templates/booking-rescheduled"
