import OnboardingDialog from "@/components/onboarding/onboarding-dialog"
import { getUserPreferences } from "@/lib/queries/get-user-preferences"
import { redirect } from "next/navigation"
import React from "react"

const Page = async () => {
  const userPreferences = await getUserPreferences()

  // if (userPreferences.onboardingCompleted) {
  //   redirect("/event-types")
  // }

  // console.log("activeMember", activeMember)
  // console.log("data", data)

  // if (activeMember?.role !== "owner") {
  //   redirect("/event-types")
  // }

  return (
    <div>
      <OnboardingDialog />
    </div>
  )
}

export default Page
