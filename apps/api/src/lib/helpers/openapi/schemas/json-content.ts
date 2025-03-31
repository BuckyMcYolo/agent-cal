import type { ZodSchema } from "./types"

const jsonContent = <T extends ZodSchema>({
  schema,
  description,
}: {
  schema: T
  description: string
}) => {
  return {
    content: {
      "application/json": {
        schema,
      },
    },
    description,
  }
}

export default jsonContent
