import type { AppOpenAPI } from "../types/app-types"

export default function configureOpenAPI(app: AppOpenAPI) {
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
