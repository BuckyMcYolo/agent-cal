import { z } from "zod"

export function zodSchemaToOpenAPI<T extends z.ZodTypeAny>(schema: T): T {
  if (!schema) return schema

  // Handle object schemas (most common case)
  if (schema.constructor.name === "ZodObject" && "shape" in schema) {
    const shape = schema.shape as Record<string, z.ZodTypeAny>

    // Create a new object with the same properties
    return z.object(
      Object.entries(shape).reduce(
        (acc, [key, zodType]) => {
          acc[key] = zodType
          return acc
        },
        {} as Record<string, z.ZodTypeAny>
      )
    ) as unknown as T
  }

  // Handle array schemas
  if (
    schema.constructor.name === "ZodArray" &&
    "_def" in schema &&
    "type" in schema._def
  ) {
    const itemType = zodSchemaToOpenAPI(schema._def.type)
    return z.array(itemType) as unknown as T
  }

  // Handle union schemas
  if (
    schema.constructor.name === "ZodUnion" &&
    "_def" in schema &&
    "options" in schema._def
  ) {
    const options = schema._def.options.map((opt: z.ZodTypeAny) =>
      zodSchemaToOpenAPI(opt)
    )
    return z.union(options) as unknown as T
  }

  // Handle intersection schemas
  if (schema.constructor.name === "ZodIntersection" && "_def" in schema) {
    const left = zodSchemaToOpenAPI(schema._def.left)
    const right = zodSchemaToOpenAPI(schema._def.right)
    return z.intersection(left, right) as unknown as T
  }

  // Handle literal schemas
  if (
    schema.constructor.name === "ZodLiteral" &&
    "_def" in schema &&
    "value" in schema._def
  ) {
    return z.literal(schema._def.value) as unknown as T
  }

  // Handle enum schemas
  if (
    schema.constructor.name === "ZodEnum" &&
    "_def" in schema &&
    "values" in schema._def
  ) {
    return z.enum(schema._def.values) as unknown as T
  }

  // Handle native types (string, number, boolean, etc.)
  if (
    [
      "ZodString",
      "ZodNumber",
      "ZodBoolean",
      "ZodNull",
      "ZodUndefined",
    ].includes(schema.constructor.name)
  ) {
    return schema // These are already compatible
  }

  // Default fallback - return the schema as is
  return schema
}
