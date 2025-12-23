import jsonContent from "@/lib/helpers/openapi/schemas/json-content"
import type { ZodSchema } from "./types.ts"

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
