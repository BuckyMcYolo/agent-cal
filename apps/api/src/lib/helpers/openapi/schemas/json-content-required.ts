import type { ZodSchema } from "./types.ts"
import jsonContent from "@/lib/helpers/openapi/schemas/json-content"

const jsonContentRequired = <T extends ZodSchema>({
  schema,
  description,
}: {
  schema: T
  description: string
}) => {
  return {
    ...jsonContent({ schema, description }),
    required: true,
  }
}

export default jsonContentRequired
