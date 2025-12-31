import { Resend } from "resend"
import { serverEnv } from "@workspace/env-config/server"

let resendClient: Resend | null = null

export function getResendClient(): Resend | null {
  if (!serverEnv.RESEND_API_KEY) {
    return null
  }

  if (!resendClient) {
    resendClient = new Resend(serverEnv.RESEND_API_KEY)
  }

  return resendClient
}

export function isEmailEnabled(): boolean {
  return !!serverEnv.RESEND_API_KEY
}
