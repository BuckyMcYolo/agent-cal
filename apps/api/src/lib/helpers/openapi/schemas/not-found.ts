import createMessageObjectSchema from "./create-message-object"
import * as HttpStatusPhrases from "@/lib/misc/http-status-phrases"

export const notFoundSchema = createMessageObjectSchema(
  HttpStatusPhrases.NOT_FOUND
)
