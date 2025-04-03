import type { AppOpenAPI } from "../types/app-types"
import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"

export default function generateOpenAPI(app: AppOpenAPI) {
  const openApiDoc = app.getOpenAPIDocument({
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

  console.log("OpenAPI document generated:", openApiDoc)
  // Create paths compatible with ES modules
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  // Create the directory if it doesn't exist
  const docsDir = path.resolve(__dirname, "../../../../../docs/api-reference")
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true })
  }

  // Write the OpenAPI document to the specified file
  const openApiFilePath = path.resolve(docsDir, "openapi.json")
  fs.writeFileSync(openApiFilePath, JSON.stringify(openApiDoc, null, 2))

  console.log(`OpenAPI document written to ${openApiFilePath}`)
}
