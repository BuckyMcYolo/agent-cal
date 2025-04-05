import type { AppOpenAPI } from "../types/app-types"

export default function configureOpenAPI(app: AppOpenAPI) {
  // Register security scheme
  app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description:
      "Value must be `Bearer <token>` where `<token>` is API key prefixed with booker_ or user access token",
  })

  app.doc("/docs", {
    openapi: "3.0.0",
    info: {
      version: "1.0.1",
      title: "Booker API reference",
    },
    servers: [
      {
        url: "http://localhost:8080",
        description: "Local server",
      },
    ],
  })
}
