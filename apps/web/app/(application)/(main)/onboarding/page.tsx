import OnboardingDialog from "@/components/onboarding/onboarding-dialog"
import { authClient } from "@workspace/auth/client"
import { redirect } from "next/navigation"
import React from "react"

const Page = async () => {
  const { data } = await authClient.getSession()
  const { data: activeMember } = await authClient.organization.getActiveMember()

  console.log("activeMember", activeMember)
  console.log("data", data)

  if (activeMember?.role !== "owner") {
    redirect("/event-types")
  }

  return (
    <div>
      <OnboardingDialog />
    </div>
  )
}

export default Page
