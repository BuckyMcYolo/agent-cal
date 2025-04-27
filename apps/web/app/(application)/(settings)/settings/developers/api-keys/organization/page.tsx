import { authClient } from "@workspace/auth/client"
import { redirect } from "next/navigation"
import React from "react"

const Page = async () => {
  const { data } = await authClient.getSession()

  if (data?.user.role !== "admin") {
    redirect("/settings/developers/api-keys")
  }

  return <div>Page</div>
}

export default Page
