import type { AppOpenAPI } from "../types/app-types"
import packageJson from "../../../package.json"

export default function configureOpenAPI(app: AppOpenAPI) {
  app.doc("/docs", {
    openapi: "3.0.0",
    info: {
      version: packageJson.version,
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
