import type { AppOpenAPI } from "../../types/app-types"

export default function configureOpenAPI(app: AppOpenAPI) {
  // Register security scheme
  app.openAPIRegistry.registerComponent("securitySchemes", "apiKeyAuth", {
    type: "apiKey",
    in: "header",
    name: "x-api-key",
    description:
      "API key required for authentication. \n\nKeys begin with 'agentcal_' prefix. Get your API key from the [Developer Dashboard](https://dashboard.agentcal.ai/settings/developers). Keys are scoped to an organization.",
  })

  app.doc("/docs", {
    openapi: "3.0.0",
    info: {
      version: "1.0.1",
      title: "AgentCal API reference",
    },
    servers: [
      {
        url: "http://localhost:8080",
        description: "Local server",
      },
    ],
  })
}
