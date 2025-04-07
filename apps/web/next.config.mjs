/** @type {import('next').NextConfig} */

import path from "path"
import { config } from "dotenv"
import { expand } from "dotenv-expand"
import { fileURLToPath } from "url"

// Rename __filename to currentFilename to avoid conflict
const currentFilename = fileURLToPath(import.meta.url)
const currentDirname = path.dirname(currentFilename)

// Only load .env file in development
expand(config({ path: path.resolve(currentDirname, "../../.env") }))

const nextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/env-config"],
  env: {
    NEXT_JS: "true",
  },
}

export default nextConfig
